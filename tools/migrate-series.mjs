#!/usr/bin/env node
// One-shot: flat `series/app-community/episodes/DBX-APP-*` -> season-first `series/S0N/E0NN-slug`.
// Delete this file once it has run. Spec: video-master-series-shape.
//
// Usage: node tools/migrate-series.mjs [--apply]
//
// WHY A SCRIPT AND NOT FIFTEEN `git mv`s. A hand-run rename is where a slug silently changes, and
// the diff it produces is unreviewable — every file shows as deleted and re-added unless the moves
// go through `git mv`, which is also what keeps `git log --follow` working afterwards.
//
// THE ONE RULE THAT MATTERS: a bare id is rewritten, a MEDIA FILENAME built from it is not.
// `DBX-APP-S03E003` is an identifier and becomes `S03E003`. `DBX-APP-S03E003_en-US_vo_v004.wav` is
// a file that exists on the MacBook under exactly that name, and renaming the string here would
// point the manifest at nothing. The two are told apart by the underscore that follows, which is
// why every id pattern below ends in a negative lookahead for `_`.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { REPO_ROOT } from './lib.mjs';

const APPLY = process.argv.includes('--apply');
const OLD_ROOT = path.join(REPO_ROOT, 'series', 'app-community');
const OLD_EPS = path.join(OLD_ROOT, 'episodes');

// Operator-confirmed. The three S04 pieces are product/feature introductions; the one S05 piece is
// a re-cut of an episode that underperformed. `follows` preserves what the fractional number said —
// WHERE it published — which renumbering would otherwise destroy. `parent` is only set where the
// episode actually answers another one, and two of the four do not.
const MAP = [
  ['DBX-APP-S01E002-founder-story',                'S01', 'E002-founder-story',                'S01E002'],
  ['DBX-APP-S01E003-track-owners',                 'S01', 'E003-track-owners',                 'S01E003'],
  ['DBX-APP-S01E004-sponsorship-passes',           'S01', 'E004-sponsorship-passes',           'S01E004'],
  ['DBX-APP-S01E005-verified-boost-rider',         'S01', 'E005-verified-boost-rider',         'S01E005'],
  ['DBX-APP-S02E001-synced-app-flavor',            'S02', 'E001-synced-app-flavor',            'S02E001'],
  ['DBX-APP-S02E002-suit-on-full-throttle',        'S02', 'E002-suit-on-full-throttle',        'S02E002'],
  ['DBX-APP-S03E000-track-zero',                   'S03', 'E000-track-zero',                   'S03E000'],
  ['DBX-APP-S03E001-100-tracks-day-one',           'S03', 'E001-100-tracks-day-one',           'S03E001'],
  ['DBX-APP-S03E002-ebike-park-day-two',           'S03', 'E002-ebike-park-day-two',           'S03E002'],
  ['DBX-APP-S03E003-barber-track-day-three',       'S03', 'E003-barber-track-day-three',       'S03E003'],
  ['DBX-APP-S03E004-nanjing-farm-track-day-four',  'S03', 'E004-nanjing-farm-track-day-four',  'S03E004'],
  ['DBX-APP-S03E002.5-put-it-on-the-map',          'S04', 'E001-put-it-on-the-map',            'S04E001',
    { follows: 'S03E002', parent: 'S03E002', relation: 'inspired-by',
      reason: 'the app-ecosystem build-up this episode grew out of; S03E002 is what prompted it' }],
  ['DBX-APP-S03E003.8-share-your-trails',          'S04', 'E002-share-your-trails',            'S04E002',
    { follows: 'S03E003', reason: 'introduces the trails functionality; a feature piece, not an answer to S03E003' }],
  ['DBX-APP-S03E004.5-almost-100-riders-first-bug','S04', 'E003-almost-100-riders-first-bug',  'S04E003',
    { follows: 'S03E004', reason: 'product update; published between S03E004 and what came next' }],
  ['DBX-APP-S03E003.5-barber-shop-dirt-bike',      'S05', 'E001-barber-shop-dirt-bike',        'S05E001',
    { follows: 'S03E003', parent: 'S03E003', relation: 'remedy',
      reason: 'same topic as S03E003, re-cut after that episode underperformed' }],
];

const OLD_ID = (dir) => dir.match(/^DBX-APP-(S\d{2}E\d{3}(?:\.\d)?)/)[0];

// Longest first, so DBX-APP-S03E003.5 is never partly matched by the DBX-APP-S03E003 rule.
const ID_REWRITES = MAP
  .map(([dir, , , id]) => [OLD_ID(dir), id])
  .sort((a, b) => b[0].length - a[0].length);

function rewriteText(text) {
  let out = text;
  for (const [oldDir, season, newDir] of MAP) {
    out = out.split(`series/app-community/episodes/${oldDir}`).join(`series/${season}/${newDir}`);
    out = out.split(`app-community/episodes/${oldDir}`).join(`${season}/${newDir}`);
    out = out.split(oldDir).join(newDir);
  }
  for (const [oldId, newId] of ID_REWRITES) {
    // NOT followed by `_` — that would be a media filename, which stays as it is on disk.
    out = out.replace(new RegExp(`${oldId.replace(/\./g, '\\.')}(?!_)`, 'g'), newId);
  }
  out = out.split('series/app-community/episodes/').join('series/');
  return out;
}

function editManifest(text, newId, lineage) {
  let out = rewriteText(text);
  out = out.replace(/^series:\s*".*"\s*\n/m, '');
  if (lineage) {
    const lines = ['lineage:'];
    if (lineage.follows) lines.push(`  follows: ${lineage.follows}`);
    if (lineage.parent) lines.push(`  parent: ${lineage.parent}`);
    if (lineage.relation) lines.push(`  relation: ${lineage.relation}`);
    if (lineage.reason) lines.push(`  reason: >-\n    ${lineage.reason}`);
    const block = `\n${lines.join('\n')}\n`;
    out = out.includes('\nformats:') ? out.replace('\nformats:', `${block}\nformats:`) : out + block;
  }
  return out;
}

const git = (...args) => execFileSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8' });

function main() {
  if (!fs.existsSync(OLD_EPS)) {
    console.error('migrate-series: series/app-community/episodes is gone — already migrated?');
    process.exit(1);
  }
  const onDisk = fs.readdirSync(OLD_EPS).filter((d) => fs.statSync(path.join(OLD_EPS, d)).isDirectory()).sort();
  const mapped = MAP.map(([d]) => d).sort();
  const missing = mapped.filter((d) => !onDisk.includes(d));
  const extra = onDisk.filter((d) => !mapped.includes(d));
  if (missing.length || extra.length) {
    console.error('migrate-series: the map and the tree disagree — refusing to move anything');
    missing.forEach((d) => console.error(`  in map, not on disk: ${d}`));
    extra.forEach((d) => console.error(`  on disk, not in map: ${d}`));
    process.exit(1);
  }

  console.log(`${APPLY ? 'MIGRATING' : 'DRY RUN'} — ${MAP.length} episodes\n`);
  for (const [oldDir, season, newDir, newId, lineage] of MAP) {
    const from = path.join(OLD_EPS, oldDir);
    const to = path.join(REPO_ROOT, 'series', season, newDir);
    const tag = lineage
      ? `  [${[lineage.follows && `follows ${lineage.follows}`,
                lineage.parent && `${lineage.relation ?? 'child'} of ${lineage.parent}`].filter(Boolean).join(', ')}]`
      : '';
    console.log(`  ${oldDir}\n    -> ${season}/${newDir}  (${newId})${tag}`);
    if (!APPLY) continue;

    fs.mkdirSync(path.dirname(to), { recursive: true });
    git('mv', path.relative(REPO_ROOT, from), path.relative(REPO_ROOT, to));

    for (const file of walk(to)) {
      const rel = path.relative(to, file);
      if (/\.(json|md|yml|yaml|mjs|js|sh|py|repl|srt|txt)$/i.test(rel)) {
        const before = fs.readFileSync(file, 'utf8');
        const after = rel === 'manifest.yml' ? editManifest(before, newId, lineage) : rewriteText(before);
        if (after !== before) fs.writeFileSync(file, after);
      }
    }
  }

  if (!APPLY) {
    console.log('\nnothing written. Re-run with --apply.');
    return;
  }

  // series.yml described the app-and-community series, which is now S01; its substance moved into
  // that season's README in the phase before this one.
  const seriesYml = path.join(OLD_ROOT, 'series.yml');
  if (fs.existsSync(seriesYml)) git('rm', '-q', path.relative(REPO_ROOT, seriesYml));
  for (const d of [OLD_EPS, OLD_ROOT]) if (fs.existsSync(d) && fs.readdirSync(d).length === 0) fs.rmdirSync(d);

  console.log('\nmoved. Now run: tools/vm check');
}

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else yield p;
  }
}

main();
