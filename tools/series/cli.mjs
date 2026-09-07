// `vm` — the verbs for the series tree. Shaped after `dbx`: a bare verb prints what it found, a
// non-zero exit means a real error, and --json is for machines.
import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT, RE, RELATIONS, loadTree, listSeasons } from '../lib.mjs';
import { checkTree } from './check.mjs';
import * as props from './props.mjs';
import { selftest } from './selftest.mjs';

const [verb, ...rest] = process.argv.slice(2);
const flag = (name) => rest.includes(`--${name}`);
const val = (name, dflt = null) => {
  const i = rest.findIndex((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (i < 0) return dflt;
  const a = rest[i];
  return a.includes('=') ? a.slice(a.indexOf('=') + 1) : rest[i + 1] ?? dflt;
};
const pos = rest.filter((a) => !a.startsWith('--'));

const USAGE = `vm — the series tree

  vm check [--json]              shape, naming, manifests, lineage, props refs
  vm tree [--json]               seasons and episodes, with status and lineage
  vm season S0N "Name"           scaffold a season README
  vm new S0N slug [--parent ID] [--relation R] [--follows ID]
  vm link E-ID --parent ID --relation R [--reason "..."] | --clear
  vm props where NAME            every episode using it
  vm props index [--json]        every prop set, most-used first
  vm props promote NAME [--apply]
  vm props demote  NAME [--apply]
  vm selftest                    run vm against fixture trees

Relations: ${RELATIONS.join(' | ')}`;

function out(obj, human) {
  if (flag('json')) console.log(JSON.stringify(obj, null, 2));
  else human();
}

function cmdCheck() {
  const { report } = checkTree(REPO_ROOT);
  out({ errors: report.errors, warnings: report.warnings }, () => report.print());
  process.exit(report.errors.length > 0 ? 1 : 0);
}

function cmdTree() {
  const tree = loadTree(REPO_ROOT);
  const data = tree.seasons.map((s) => ({
    season: s.id,
    title: s.hasReadme ? (fs.readFileSync(s.readmePath, 'utf8').match(/^#\s+(.+)$/m)?.[1] ?? '') : '(no README)',
    episodes: tree.episodes.filter((e) => e.season.id === s.id).map((e) => ({
      id: e.manifest?.video_id ?? '?',
      dir: e.dirName,
      status: e.manifest?.status ?? '?',
      lineage: e.manifest?.lineage ?? null,
    })),
  }));
  out(data, () => {
    for (const s of data) {
      console.log(`${s.season}  ${s.title}`);
      for (const e of s.episodes) {
        const l = e.lineage ?? {};
        const bits = [
          l.follows ? `follows ${l.follows}` : null,
          l.parent ? `${l.relation ?? 'child'} of ${l.parent}` : null,
        ].filter(Boolean).join(', ');
        console.log(`  ${e.id}  ${e.dir.padEnd(38)} ${String(e.status).padEnd(10)} ${bits}`);
      }
    }
  });
}

function cmdProps() {
  const [sub, name] = pos;
  const tree = loadTree(REPO_ROOT);
  if (sub === 'index' || (!sub && !name)) {
    const idx = props.index(REPO_ROOT);
    return out(idx, () => {
      for (const e of idx) console.log(`${String(e.count).padStart(3)}  ${e.catalogued ? '*' : ' '} ${e.name}`);
      console.log(`\n${idx.length} prop set(s); * = in the catalogue`);
    });
  }
  if (!name) { console.error(USAGE); process.exit(2); }
  if (sub === 'where') {
    const u = props.usages(tree, name);
    if (u.length === 0) { console.error(`vm props: nothing named "${name}"`); process.exit(1); }
    // print a path that actually exists — `where` is for feeding into an editor
    const rel = (x) => path.relative(REPO_ROOT, x.path);
    return out(u.map((x) => ({ episode: `${x.ep.season.id}/${x.ep.dirName}`, path: rel(x), ref: x.ref })),
      () => u.forEach((x) => console.log(`${rel(x)}${x.ref ? `  -> props/${x.ref}` : ''}`)));
  }
  if (sub === 'promote' || sub === 'demote') {
    const plan = (sub === 'promote' ? props.promote : props.demote)(tree, name, { apply: flag('apply') });
    if (plan.error) { console.error(`vm props ${sub}: ${plan.error}`); process.exit(1); }
    return out(plan, () => {
      console.log(`${sub} ${name}: ${plan.uses} file(s)${plan.applied ? '' : '  (dry run — pass --apply)'}`);
      if (sub === 'promote') {
        console.log(`  shared -> props/${name}/base.json: ${plan.sharedKeys.join(', ') || '(none)'}`);
        console.log(`  stays per-episode:                ${plan.overrideKeys.join(', ') || '(none)'}`);
      }
      plan.files.forEach((f) => console.log(`  ${f.path}`));
    });
  }
  console.error(USAGE);
  process.exit(2);
}

function cmdLink() {
  const id = pos[0];
  const tree = loadTree(REPO_ROOT);
  const ep = tree.byId.get(id);
  if (!ep) { console.error(`vm link: no episode ${id}`); process.exit(1); }
  const raw = fs.readFileSync(ep.manifestPath, 'utf8');
  if (flag('clear')) {
    fs.writeFileSync(ep.manifestPath, raw.replace(/\nlineage:\n(?:[ \t]+.*\n)*/g, '\n'));
    console.log(`${id}: lineage cleared`);
    return;
  }
  const parent = val('parent');
  const relation = val('relation');
  const follows = val('follows');
  const reason = val('reason');
  if (parent && !tree.byId.has(parent)) { console.error(`vm link: parent ${parent} does not exist`); process.exit(1); }
  if (follows && !tree.byId.has(follows)) { console.error(`vm link: follows ${follows} does not exist`); process.exit(1); }
  if (relation && !RELATIONS.includes(relation)) { console.error(`vm link: relation must be ${RELATIONS.join('|')}`); process.exit(1); }
  if (relation && !parent) { console.error('vm link: --relation needs --parent'); process.exit(1); }
  const lines = ['lineage:'];
  if (follows) lines.push(`  follows: ${follows}`);
  if (parent) lines.push(`  parent: ${parent}`);
  if (relation) lines.push(`  relation: ${relation}`);
  if (reason) lines.push(`  reason: >-\n    ${reason}`);
  const stripped = raw.replace(/\nlineage:\n(?:[ \t]+.*\n)*/g, '\n');
  const marker = '\nformats:';
  const block = `\n${lines.join('\n')}\n`;
  fs.writeFileSync(ep.manifestPath, stripped.includes(marker)
    ? stripped.replace(marker, `${block}${marker}`)
    : stripped + block);
  console.log(`${id}: ${lines.slice(1).join(', ').replace(/\s+/g, ' ')}`);
}

// The scaffolds live HERE, not in templates/. A template directory that a script copies and then
// overwrites is two sources of truth for one shape, and this one had already drifted: its manifest
// still showed the retired DBX- id form and a `series:` key, and its edit-notes pointed at two
// files deleted in the toolline restructure. A scaffold nobody can run is a scaffold nobody
// notices going stale.
const manifestScaffold = (id, slug, lineage) =>
  `# Episode manifest — source of truth for this episode.
# Naming: agents.d/modules/naming-conventions.md · validate: tools/vm check

video_id: "${id}"
slug: "${slug}"
status: topic # topic|packaging|scripting|shooting|editing|qc|published|retro
${lineage.length ? `\nlineage:\n${lineage.join('\n')}\n` : `
# Optional. \`follows\` = where this published; \`parent\` = the episode it ANSWERS, if any;
# \`relation\` = ${RELATIONS.join(' | ')}, and needs a parent. Write it with \`tools/vm link\`.
`}
formats:
  primary: short_vertical
  aspect: 9x16
  resolution: 1080x1920
  fps: 30

variants: {}
beats: []
assets:
  raw: []
  selected: []
  voiceover: []
  audio: []
outputs:
  overlays: {}
  exports: {}
  published: {}
`;

const editNotesScaffold = (id) =>
  `# Edit notes — ${id}

What this repo actually did to the material, in enough detail to reproduce it. Clips by asset id
and timecode, never "the good take". Open questions are explicit \`DECIDE:\` lines.

## Voice

The splice: which takes, which grafts, what gain match, measured gaps. Reproduce with vo-process.sh.

## Captions

Where the timings came from — a transcription, or \`/auto-narrate\` reading them off the voice.

## QC

Measured, not eyeballed: loudness, peak, duration against the manifest's beats.
`;

const seasonScaffold = (id, name) =>
  `# ${id} — ${name}

One paragraph: what this season is, and what every episode in it repeats.

## Episodes

| ID | Slug | What it is | Status |
|---|---|---|---|

## Where it stands

Two to four bullets — what has shipped, and what a producer must not walk past.

<!-- Keep this to one screen. Production quirks (TTS, translation, splices, codecs, per-beat
     timings) belong in the episode's edit-notes.md or in agents.d/modules/, not here. tools/vm
     check warns past ~4000 chars. -->
`;

function cmdSeason() {
  const [id, ...name] = pos;
  if (!RE.seasonDir.test(id ?? '')) { console.error(USAGE); process.exit(2); }
  const dir = path.join(REPO_ROOT, 'series', id);
  const readme = path.join(dir, 'README.md');
  if (fs.existsSync(readme)) { console.error(`vm season: ${id}/README.md already exists`); process.exit(1); }
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(readme, seasonScaffold(id, name.join(' ') || '{Season name}'));
  console.log(path.relative(REPO_ROOT, readme));
}

function cmdNew() {
  const [season, slug] = pos;
  if (!RE.seasonDir.test(season ?? '') || !RE.slug.test(slug ?? '')) { console.error(USAGE); process.exit(2); }
  const seasons = listSeasons(REPO_ROOT);
  const s = seasons.find((x) => x.id === season);
  if (!s) { console.error(`vm new: season ${season} does not exist — create series/${season}/README.md first`); process.exit(1); }
  const tree = loadTree(REPO_ROOT);
  const nums = tree.episodes.filter((e) => e.season.id === season)
    .map((e) => Number((e.manifest?.video_id ?? '').slice(4))).filter(Number.isFinite);
  const n = String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, '0');
  const id = `${season}E${n}`;
  const dir = path.join(s.dir, `E${n}-${slug}`);
  fs.mkdirSync(path.join(dir, 'remotion-props'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'subtitles'), { recursive: true });
  const lineage = [];
  if (val('follows')) lineage.push(`  follows: ${val('follows')}`);
  if (val('parent')) lineage.push(`  parent: ${val('parent')}`);
  if (val('relation')) lineage.push(`  relation: ${val('relation')}`);
  fs.writeFileSync(path.join(dir, 'manifest.yml'), manifestScaffold(id, slug, lineage));
  fs.writeFileSync(path.join(dir, 'edit-notes.md'), editNotesScaffold(id));
  console.log(`${path.relative(REPO_ROOT, dir)}  (${id})`);
}

switch (verb) {
  case 'check': cmdCheck(); break;
  case 'tree': cmdTree(); break;
  case 'props': cmdProps(); break;
  case 'link': cmdLink(); break;
  case 'season': cmdSeason(); break;
  case 'new': cmdNew(); break;
  case 'selftest': process.exit(selftest() ? 0 : 1); break;
  default: console.log(USAGE); process.exit(verb ? 2 : 0);
}
