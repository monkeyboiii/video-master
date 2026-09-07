// The cross-episode layer: everything that cannot be decided while looking at one directory.
//
// Season shape, id uniqueness, lineage, and props references. `episode.mjs` owns the inside of an
// episode; this owns the relationships between them, which is exactly the set of facts the old
// per-episode validator was structurally unable to see.
import fs from 'node:fs';
import path from 'node:path';
import { RE, RELATIONS, loadTree, Report } from '../lib.mjs';
import { validateEpisode } from './episode.mjs';
import { catalogueEntries, propRefs } from './props.mjs';

export function checkTree(root) {
  const report = new Report();
  const tree = loadTree(root);

  if (tree.seasons.length === 0) {
    report.error('series/', 'no seasons found — expected series/S01, series/S02, …');
    return { report, tree };
  }

  // Anything in series/ that is not a season directory is a leftover from the flat layout.
  for (const name of fs.readdirSync(path.join(root ?? tree.root, 'series'))) {
    const p = path.join(root ?? tree.root, 'series', name);
    if (fs.statSync(p).isDirectory() && !RE.seasonDir.test(name)) {
      report.error(`series/${name}`, 'not a season directory — the tree is series/S0N/E0NN-slug');
    }
  }

  for (const s of tree.seasons) {
    if (!s.hasReadme) report.error(`series/${s.id}`, 'no README.md — a season must say what it is');
    else {
      // Bounded at BOTH ends on purpose. Too short and it does not answer "what is this season";
      // too long and it stops being read, which costs more than the detail was worth. The upper
      // bound exists because the first drafts ran to 5-10 KB each and had absorbed TTS quirks,
      // splice notes and per-beat timings — all true, none of it a season-level fact. That
      // material belongs in edit-notes.md and the module docs; see `vm season` for the scaffold.
      const n = fs.readFileSync(s.readmePath, 'utf8').trim().length;
      if (n < 200) report.warn(`series/${s.id}`, 'README.md is under 200 chars — "what is this season" needs a paragraph');
      else if (n > 4000) report.warn(`series/${s.id}`, `README.md is ${n} chars — over ~4000 it is a production log, not a season doc`);
    }
    if (listOf(tree, s).length === 0) report.warn(`series/${s.id}`, 'season has no episodes');
  }

  // Episode-local checks
  for (const ep of tree.episodes) validateEpisode(ep, report);

  // One id, one episode. Two manifests claiming S03E003 is the failure that makes every
  // cross-reference below meaningless, so it is checked before any of them are believed.
  const seen = new Map();
  for (const ep of tree.episodes) {
    const id = ep.manifest?.video_id;
    if (!id) continue;
    if (seen.has(id)) {
      report.error(`series/${ep.season.id}/${ep.dirName}`, `video_id ${id} is also claimed by ${seen.get(id)}`);
    } else seen.set(id, `${ep.season.id}/${ep.dirName}`);
  }

  checkLineage(tree, report);
  checkProps(tree, report);
  return { report, tree };
}

const listOf = (tree, season) => tree.episodes.filter((e) => e.season.id === season.id);

// `follows` and `parent` are different facts and the checker must not conflate them:
//   follows — where this episode published in the original run. What the fractional number used
//             to encode, and the one piece of information renumbering into S04/S05 destroys.
//   parent  — the episode this one ANSWERS. Only some episodes answer one.
// An episode may have `follows` with no `parent` (a feature piece that simply shipped between two
// others); `relation` without `parent` is meaningless and is an error rather than a warning.
function checkLineage(tree, report) {
  for (const ep of tree.episodes) {
    const m = ep.manifest;
    if (!m) continue;
    const ctx = `series/${ep.season.id}/${ep.dirName}`;
    const l = m.lineage;
    if (l == null) continue;
    if (typeof l !== 'object') {
      report.error(ctx, 'lineage must be a mapping');
      continue;
    }
    for (const key of Object.keys(l)) {
      if (!['follows', 'parent', 'relation', 'reason'].includes(key)) {
        report.error(ctx, `lineage: unknown key "${key}"`);
      }
    }
    for (const field of ['follows', 'parent']) {
      const v = l[field];
      if (v == null) continue;
      if (!RE.videoId.test(v)) {
        report.error(ctx, `lineage.${field} "${v}" is not a video_id`);
      } else if (!tree.byId.has(v)) {
        report.error(ctx, `lineage.${field} names ${v}, which does not exist`);
      } else if (v === m.video_id) {
        report.error(ctx, `lineage.${field} points at its own episode`);
      }
    }
    if (l.relation != null) {
      if (!RELATIONS.includes(l.relation)) {
        report.error(ctx, `lineage.relation "${l.relation}" not one of ${RELATIONS.join('|')}`);
      }
      if (l.parent == null) {
        report.error(ctx, 'lineage.relation set with no lineage.parent — a relation is to something');
      }
      if (!l.reason) {
        report.warn(ctx, `lineage.relation ${l.relation} with no reason — the reason is the useful half`);
      }
    }
  }
  // A parent chain that loops means an episode transitively answers itself; every consumer that
  // walks the chain (tree, reports) would hang rather than be wrong, which is worse.
  for (const ep of tree.episodes) {
    const start = ep.manifest?.video_id;
    if (!start) continue;
    const seen = new Set([start]);
    let cur = ep.manifest?.lineage?.parent;
    while (cur && tree.byId.has(cur)) {
      if (seen.has(cur)) {
        report.error(`series/${ep.season.id}/${ep.dirName}`, `lineage.parent chain cycles at ${cur}`);
        break;
      }
      seen.add(cur);
      cur = tree.byId.get(cur).manifest?.lineage?.parent;
    }
  }
}

// A props file either holds real props or is a reference into the catalogue. A dangling reference
// renders a placeholder and says nothing — the exact failure remotion-overlays.md calls out — so
// it fails the check rather than warning.
function checkProps(tree, report) {
  const cat = new Set(catalogueEntries(tree.root).map((e) => e.name));
  for (const { ep, file, ref } of propRefs(tree)) {
    if (!cat.has(ref)) {
      report.error(`series/${ep.season.id}/${ep.dirName}`, `${file}: $ref "${ref}" has no props/ entry`);
    }
  }
  for (const e of catalogueEntries(tree.root)) {
    if (!e.base) report.error(`props/${e.name}`, 'catalogue entry has no base.json');
  }
}
