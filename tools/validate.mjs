#!/usr/bin/env node
// Validate manifests, naming, and stage artifacts.
// Usage: node tools/validate.mjs [path/to/episode-dir]
import fs from 'node:fs';
import path from 'node:path';
import {
  REPO_ROOT, STATUSES, PLATFORMS, ASPECTS, OVERLAY_COMPS, COVER_COMPS, RE,
  listSeries, listEpisodes, Report, checkSrt, timecodeToMs,
} from './lib.mjs';

const report = new Report();
const onlyDir = process.argv[2] ? path.resolve(process.argv[2]) : null;
let matchedOnlyDir = false;

const allSeries = listSeries();
const seenCodes = new Map();

for (const s of allSeries) {
  const ctx = `series/${s.slug}`;
  if (!s.manifest) {
    report.error(ctx, 'missing or unparseable series.yml');
    continue;
  }
  const m = s.manifest;
  if (m.series !== s.slug) report.error(ctx, `series.yml "series: ${m.series}" != directory name`);
  if (!RE.seriesCode.test(m.code ?? '')) report.error(ctx, `code "${m.code}" must be 3-4 uppercase letters`);
  if (seenCodes.has(m.code)) report.error(ctx, `code ${m.code} already used by ${seenCodes.get(m.code)}`);
  seenCodes.set(m.code, s.slug);
  if (!Number.isInteger(m.season)) report.error(ctx, 'season must be an integer');
  for (const field of ['audience', 'promise', 'positioning']) {
    if (!m[field]) report.warn(ctx, `series.yml "${field}" is empty`);
  }
  for (const [loc, plats] of Object.entries(m.default_platforms ?? {})) {
    if (!RE.locale.test(loc)) report.error(ctx, `default_platforms locale "${loc}" invalid`);
    for (const p of plats ?? []) if (!PLATFORMS.includes(p)) report.error(ctx, `unknown platform "${p}"`);
  }

  for (const ep of listEpisodes(s)) {
    if (onlyDir && path.resolve(ep.dir) !== onlyDir) continue;
    if (onlyDir) matchedOnlyDir = true;
    validateEpisode(ep, m);
  }
}

if (onlyDir && !matchedOnlyDir) {
  report.error(onlyDir, 'no episode found at this path — nothing was validated');
}

function stageAtLeast(status, stage) {
  return STATUSES.indexOf(status) >= STATUSES.indexOf(stage);
}

function fileHasPlaceholders(file) {
  return /\{\{[A-Z_]+\}\}/.test(fs.readFileSync(file, 'utf8'));
}

function validateEpisode(ep, seriesManifest) {
  const ctx = `series/${ep.series.slug}/episodes/${ep.dirName}`;
  if (!ep.manifest) return report.error(ctx, 'missing or unparseable manifest.yml');
  const m = ep.manifest;
  const exists = (rel) => fs.existsSync(path.join(ep.dir, rel));

  // Identity
  if (!RE.videoId.test(m.video_id ?? '')) report.error(ctx, `video_id "${m.video_id}" invalid (DBX-CODE-SssEeee)`);
  if (!RE.slug.test(m.slug ?? '')) report.error(ctx, `slug "${m.slug}" must be kebab-case`);
  else if ((m.slug ?? '').length > 40) report.error(ctx, 'slug longer than 40 chars');
  if (ep.dirName !== `${m.video_id}-${m.slug}`) {
    report.error(ctx, `directory name != "${m.video_id}-${m.slug}"`);
  }
  if (m.video_id?.split('-')[1] !== seriesManifest.code) {
    report.error(ctx, `video_id code != series code ${seriesManifest.code}`);
  }
  if (m.series !== ep.series.slug) report.error(ctx, `manifest "series: ${m.series}" != ${ep.series.slug}`);
  if (!STATUSES.includes(m.status)) return report.error(ctx, `status "${m.status}" not one of ${STATUSES.join('|')}`);
  if (fileHasPlaceholders(ep.manifestPath)) report.error(ctx, 'manifest.yml still contains {{PLACEHOLDER}} tokens');
  for (const f of fs.readdirSync(ep.dir).filter((f) => f.endsWith('.md'))) {
    if (fileHasPlaceholders(path.join(ep.dir, f))) report.error(ctx, `${f} still contains {{PLACEHOLDER}} tokens`);
  }

  // Formats
  if (!ASPECTS.includes(m.formats?.aspect)) report.error(ctx, `formats.aspect must be one of ${ASPECTS.join('|')}`);
  if (typeof m.formats?.fps !== 'number') report.error(ctx, 'formats.fps must be a number');
  if (!/^\d{3,4}x\d{3,4}$/.test(m.formats?.resolution ?? '')) report.error(ctx, 'formats.resolution must be WxH');

  // Variants
  const variants = Object.entries(m.variants ?? {});
  if (variants.length === 0) report.error(ctx, 'no variants defined');
  for (const [loc, v] of variants) {
    if (!RE.locale.test(loc)) report.error(ctx, `variant locale "${loc}" invalid`);
    for (const p of v?.platforms ?? []) if (!PLATFORMS.includes(p)) report.error(ctx, `variant ${loc}: unknown platform "${p}"`);
  }

  // Stage gates: status = that stage's artifacts are complete.
  if (stageAtLeast(m.status, 'topic')) {
    if (!exists('brief.md')) report.error(ctx, 'status>=topic requires brief.md');
  }
  if (stageAtLeast(m.status, 'packaging')) {
    for (const [loc, v] of variants) {
      if (!v?.cover || !exists(v.cover)) report.error(ctx, `status>=packaging requires cover for ${loc}`);
    }
  }
  if (stageAtLeast(m.status, 'scripting')) {
    for (const [loc, v] of variants) {
      if (!v?.script || !exists(v.script)) report.error(ctx, `status>=scripting requires script for ${loc}`);
    }
    const beats = m.beats ?? [];
    if (beats.length === 0) report.error(ctx, 'status>=scripting requires non-empty beats');
    const ids = new Set();
    for (const b of beats) {
      if (!RE.slug.test(b?.id ?? '')) report.error(ctx, `beat id "${b?.id}" must be kebab-case`);
      if (ids.has(b.id)) report.error(ctx, `duplicate beat id "${b.id}"`);
      ids.add(b.id);
      if (b.overlay != null && !OVERLAY_COMPS.includes(b.overlay)) {
        report.error(ctx, `beat ${b.id}: overlay "${b.overlay}" not in ${OVERLAY_COMPS.join('|')}`);
      }
      for (const [loc] of variants) {
        if (typeof b.target_duration_sec?.[loc] !== 'number') {
          report.error(ctx, `beat ${b.id}: missing target_duration_sec for ${loc}`);
        }
      }
    }
  }
  if (stageAtLeast(m.status, 'shooting')) {
    if (!exists('shotlist.md')) report.error(ctx, 'status>=shooting requires shotlist.md');
    const raw = m.assets?.raw ?? [];
    if (raw.length === 0) report.error(ctx, 'status>=shooting requires assets.raw entries');
    for (const a of raw) {
      if (!a?.asset_id) report.error(ctx, 'raw asset missing asset_id');
      if (a?.filename && !RE.shotFile(m.video_id).test(a.filename)) {
        report.error(ctx, `raw ${a.asset_id}: filename "${a.filename}" doesn't match shot pattern`);
      }
      if (!a?.external_uri) report.warn(ctx, `raw ${a.asset_id}: no external_uri recorded`);
    }
  }
  if (stageAtLeast(m.status, 'editing')) {
    if (!exists('edit-notes.md')) report.error(ctx, 'status>=editing requires edit-notes.md');
    const rawIds = new Set((m.assets?.raw ?? []).map((a) => a.asset_id));
    const beatIds = new Set((m.beats ?? []).map((b) => b.id));
    const selected = m.assets?.selected ?? [];
    if (selected.length === 0) report.error(ctx, 'status>=editing requires assets.selected entries');
    for (const sel of selected) {
      if (!rawIds.has(sel?.source_asset_id)) report.error(ctx, `select ${sel?.asset_id}: unknown source ${sel?.source_asset_id}`);
      if (!beatIds.has(sel?.beat)) report.error(ctx, `select ${sel?.asset_id}: unknown beat ${sel?.beat}`);
      let tcOk = true;
      for (const k of ['in', 'out']) {
        if (!RE.timecode.test(sel?.[k] ?? '')) {
          report.error(ctx, `select ${sel?.asset_id}: ${k} must be HH:MM:SS.mmm`);
          tcOk = false;
        }
      }
      if (tcOk && timecodeToMs(sel.out) <= timecodeToMs(sel.in)) {
        report.error(ctx, `select ${sel.asset_id}: out (${sel.out}) must be after in (${sel.in})`);
      }
    }
    for (const [loc, v] of variants) {
      if (!v?.subtitles || !exists(v.subtitles)) report.error(ctx, `status>=editing requires subtitles for ${loc}`);
      if (!v?.voiceover_asset_id) report.warn(ctx, `status>=editing but no voiceover_asset_id for ${loc} (subtitle timing is provisional)`);
    }
    const needsOverlays = (m.beats ?? []).some((b) => b.overlay);
    for (const [loc] of variants) {
      if (needsOverlays && !(m.outputs?.overlays?.[loc]?.length > 0)) {
        report.error(ctx, `status>=editing: beats use overlays but outputs.overlays.${loc} is empty`);
      }
    }
  }
  if (stageAtLeast(m.status, 'qc')) {
    for (const [loc] of variants) {
      if (!(m.outputs?.exports?.[loc]?.length > 0)) report.error(ctx, `status>=qc requires outputs.exports.${loc}`);
    }
    if (exists('edit-notes.md') && !/^## QC /m.test(fs.readFileSync(path.join(ep.dir, 'edit-notes.md'), 'utf8'))) {
      report.error(ctx, 'status>=qc requires a "## QC <filename>" block in edit-notes.md');
    }
  }
  if (stageAtLeast(m.status, 'published')) {
    for (const [loc, v] of variants) {
      const finals = (m.outputs?.exports?.[loc] ?? []).filter((f) => /_final\.mp4$/.test(f));
      if (finals.length === 0) report.error(ctx, `status>=published requires a _final export for ${loc}`);
      const published = m.outputs?.published?.[loc] ?? [];
      if (published.length === 0) {
        report.error(ctx, `status>=published requires outputs.published.${loc} entries ({platform, url, date})`);
      }
      for (const p of published) {
        if (!PLATFORMS.includes(p?.platform)) report.error(ctx, `published ${loc}: unknown platform "${p?.platform}"`);
        else if (!(v?.platforms ?? []).includes(p.platform)) {
          report.warn(ctx, `published ${loc}: ${p.platform} is not in this variant's platform list`);
        }
        if (!p?.url) report.error(ctx, `published ${loc}/${p?.platform}: missing url`);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(p?.date ?? '')) report.error(ctx, `published ${loc}/${p?.platform}: date must be YYYY-MM-DD`);
      }
    }
  }
  if (stageAtLeast(m.status, 'retro')) {
    if (!exists('review.md')) report.error(ctx, 'status=retro requires review.md');
  }

  // Output naming
  for (const [loc, files] of Object.entries(m.outputs?.overlays ?? {})) {
    for (const f of files ?? []) {
      if (!RE.overlayFile(m.video_id, loc).test(f)) report.error(ctx, `overlay "${f}" doesn't match naming pattern`);
    }
  }
  for (const [loc, files] of Object.entries(m.outputs?.covers ?? {})) {
    for (const f of files ?? []) {
      if (!RE.coverFile(m.video_id, loc).test(f)) report.error(ctx, `cover "${f}" doesn't match naming pattern`);
    }
  }
  for (const [loc, files] of Object.entries(m.outputs?.exports ?? {})) {
    for (const f of files ?? []) {
      if (!RE.exportFile(m.video_id, loc).test(f)) report.error(ctx, `export "${f}" doesn't match naming pattern`);
    }
  }
  for (const [loc, f] of Object.entries(m.outputs?.kdenlive ?? {})) {
    if (f && !RE.timelineFile(m.video_id, loc).test(path.basename(f))) {
      report.error(ctx, `timeline "${f}" doesn't match naming pattern`);
    }
  }

  // Voiceover asset bookkeeping (whenever recorded)
  const voIds = new Set();
  for (const vo of m.assets?.voiceover ?? []) {
    voIds.add(vo?.asset_id);
    if (vo?.filename && !RE.voFile(m.video_id).test(vo.filename)) {
      report.error(ctx, `voiceover ${vo?.asset_id}: filename "${vo.filename}" doesn't match VO pattern`);
    }
    if (vo?.locale && !Object.keys(m.variants ?? {}).includes(vo.locale)) {
      report.error(ctx, `voiceover ${vo?.asset_id}: locale ${vo.locale} is not a variant`);
    }
  }
  for (const [loc, v] of variants) {
    if (v?.voiceover_asset_id && !voIds.has(v.voiceover_asset_id)) {
      report.error(ctx, `variant ${loc}: voiceover_asset_id ${v.voiceover_asset_id} has no assets.voiceover entry`);
    }
  }

  // Tracked per-variant files that DO exist get content checks
  for (const [loc, v] of variants) {
    if (v?.subtitles && exists(v.subtitles)) {
      const { cues, errors } = checkSrt(fs.readFileSync(path.join(ep.dir, v.subtitles), 'utf8'));
      for (const e of errors) report.error(ctx, `subtitles ${loc}: ${e}`);
      if (cues.length === 0) {
        const msg = `subtitles ${loc}: file exists but contains no cues`;
        if (stageAtLeast(m.status, 'editing')) report.error(ctx, msg);
        else report.warn(ctx, msg);
      }
    }
    if (v?.remotion_props && exists(v.remotion_props)) {
      try {
        const props = JSON.parse(fs.readFileSync(path.join(ep.dir, v.remotion_props), 'utf8'));
        if (props.locale && props.locale !== loc) report.error(ctx, `remotion-props ${loc}: locale field says ${props.locale}`);
        for (const key of Object.keys(props)) {
          if (key.startsWith('_') || key === 'locale') continue;
          if (![...OVERLAY_COMPS, ...COVER_COMPS].includes(key)) {
            report.warn(ctx, `remotion-props ${loc}: unknown composition key "${key}"`);
          }
        }
      } catch {
        report.error(ctx, `remotion-props ${loc}: invalid JSON`);
      }
    }
  }
}

if (allSeries.length === 0) report.warn('series/', 'no series found');
report.print();
process.exit(report.errors.length > 0 ? 1 : 0);
