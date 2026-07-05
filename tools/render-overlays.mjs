#!/usr/bin/env node
// Render every overlay an episode's beats call for, for one locale.
// Reads manifest.yml beats + remotion-props/<locale>.json, renders via
// packages/remotion-graphics (ProRes 4444 alpha defaults are baked into the
// compositions), names files per docs/naming-conventions.md.
//
// Usage: node tools/render-overlays.mjs <episode-dir> <locale> [--comp=<id>] [--dry-run]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { REPO_ROOT, RE, loadYamlFile } from './lib.mjs';

const [epDirArg, locale] = process.argv.slice(2);
const compFilter = process.argv.find((a) => a.startsWith('--comp='))?.slice(7);
const dryRun = process.argv.includes('--dry-run');
if (!epDirArg || !RE.locale.test(locale ?? '')) {
  console.error('Usage: node tools/render-overlays.mjs <episode-dir> <locale> [--comp=<id>] [--dry-run]');
  process.exit(1);
}

const epDir = path.resolve(epDirArg);
const manifest = loadYamlFile(path.join(epDir, 'manifest.yml'));
const variant = manifest.variants?.[locale];
if (!variant) {
  console.error(`Locale ${locale} not in manifest variants (${Object.keys(manifest.variants ?? {}).join(', ')})`);
  process.exit(1);
}
const propsPath = path.join(epDir, variant.remotion_props ?? `remotion-props/${locale}.json`);
if (!fs.existsSync(propsPath)) {
  console.error(`Props file missing: ${propsPath}\nCopy templates/remotion-props/locale-props.template.json and fill it from the script.`);
  process.exit(1);
}
let allProps;
try {
  allProps = JSON.parse(fs.readFileSync(propsPath, 'utf8'));
} catch (e) {
  console.error(`Props file is not valid JSON: ${propsPath}\n  ${e.message}`);
  process.exit(1);
}

const overlaysDir = path.join(REPO_ROOT, 'media', 'overlays');
fs.mkdirSync(overlaysDir, { recursive: true });
const pkgDir = path.join(REPO_ROOT, 'packages', 'remotion-graphics');
const aspect = manifest.formats?.aspect ?? '9x16';

// Group beats by overlay composition. One render per composition; beats may share a
// render only when their target durations agree.
const byComp = new Map();
for (const beat of manifest.beats ?? []) {
  if (!beat.overlay) continue;
  if (!byComp.has(beat.overlay)) byComp.set(beat.overlay, []);
  byComp.get(beat.overlay).push(beat);
}
// subtitle-track spans the whole video rather than one beat: renderable via
// --comp=subtitle-track even when no beat references it.
if (compFilter === 'subtitle-track' && !byComp.has('subtitle-track')) {
  byComp.set('subtitle-track', []);
}

const jobs = [];
const missingProps = [];
for (const [comp, beats] of byComp) {
  if (compFilter && comp !== compFilter) continue;
  const durations = [...new Set(beats.map((b) => b.target_duration_sec?.[locale]).filter((d) => d != null))];
  if (durations.length > 1) {
    console.error(
      `Beats ${beats.map((b) => b.id).join(', ')} share overlay "${comp}" with different ${locale} durations (${durations.join(', ')}s).\n` +
      'One composition = one render. Give the beats matching durations, or render per beat with --comp and a durationSec preset in the props file.',
    );
    process.exit(1);
  }
  const props = { locale, ...(allProps[comp] ?? {}) };
  if (comp === 'subtitle-track') {
    if (!props.srt) {
      const srtPath = path.join(epDir, variant.subtitles ?? `subtitles/${locale}.srt`);
      if (!fs.existsSync(srtPath)) {
        console.error(`subtitle-track needs ${srtPath} (or an "srt" value in the props file).`);
        process.exit(1);
      }
      props.srt = fs.readFileSync(srtPath, 'utf8');
    }
    if (props.durationSec == null) {
      const total = (manifest.beats ?? []).reduce((s, b) => s + (b.target_duration_sec?.[locale] ?? 0), 0);
      props.durationSec = Math.round(total * 10) / 10;
    }
  } else if (allProps[comp] == null) {
    missingProps.push(comp);
    continue;
  }
  if (props.durationSec == null && durations.length === 1) props.durationSec = durations[0];
  const version = nextVersion(comp);
  const outName = `${manifest.video_id}_${locale}_${aspect}_${comp}_v${version}.mov`;
  jobs.push({ comp, beat: beats.map((b) => b.id).join('+') || '(whole video)', props, outName });
}

if (missingProps.length) {
  console.error(
    `No props for ${missingProps.map((c) => `"${c}"`).join(', ')} in ${path.basename(propsPath)}.\n` +
    'Rendering would burn placeholder text into production overlays. Add the missing keys (see templates/remotion-props/locale-props.template.json) with the exact script wording, then rerun.',
  );
  process.exit(1);
}

function nextVersion(comp) {
  const re = new RegExp(`^${manifest.video_id}_${locale}_${aspect}_${comp}_v(\\d{3})\\.mov$`);
  const existing = fs.readdirSync(overlaysDir).map((f) => f.match(re)).filter(Boolean).map((m) => +m[1]);
  return String((existing.length ? Math.max(...existing) : 0) + 1).padStart(3, '0');
}

if (jobs.length === 0) {
  console.log('No beats with overlays to render (or --comp filtered everything out).');
  process.exit(0);
}

const rendered = [];
for (const job of jobs) {
  const outPath = path.join(overlaysDir, job.outName);
  console.log(`\n▶ ${job.comp} (beat: ${job.beat}) → media/overlays/${job.outName}`);
  if (dryRun) {
    console.log(`  props: ${JSON.stringify(job.props)}`);
    continue;
  }
  const tmpProps = path.join(os.tmpdir(), `dbx-props-${process.pid}-${job.comp}.json`);
  fs.writeFileSync(tmpProps, JSON.stringify(job.props));
  const r = spawnSync('npx', ['remotion', 'render', job.comp, outPath, `--props=${tmpProps}`], {
    cwd: pkgDir,
    stdio: 'inherit',
  });
  fs.rmSync(tmpProps, { force: true });
  if (r.status !== 0) {
    console.error(`Render failed for ${job.comp}; stopping.`);
    process.exit(1);
  }
  rendered.push(job.outName);
}

if (rendered.length) {
  console.log(`\nDone. Record these in manifest.yml (outputs.overlays.${locale}):\n`);
  for (const f of rendered) console.log(`      - ${f}`);
  console.log('\nThen run: node tools/validate.mjs');
}
