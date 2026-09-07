#!/usr/bin/env node
// Validate one episode, or every episode. Usage: node tools/validate.mjs [series/S03/E003-slug]
//
// This is the in-episode pass only. It stays because episode-level validation is a useful thing to
// run on its own — and because edit-notes across the repo record having run it, and a command that
// a written record says was run should keep existing.
//
// `tools/vm check` is the full check: this pass plus everything cross-episode (season shape,
// duplicate ids, lineage, props references), which is what repos.toml declares as this repo's
// verify. Nothing here can see those, by construction.
import path from 'node:path';
import { REPO_ROOT, loadTree, Report } from './lib.mjs';
import { validateEpisode } from './series/episode.mjs';

const only = process.argv[2] ? path.resolve(process.argv[2]) : null;
const report = new Report();
const tree = loadTree(REPO_ROOT);
let matched = false;

for (const ep of tree.episodes) {
  if (only && path.resolve(ep.dir) !== only) continue;
  matched = true;
  validateEpisode(ep, report);
}

if (only && !matched) report.error(only, 'no episode found at this path — nothing was validated');
if (tree.episodes.length === 0) report.warn('series/', 'no episodes found');
report.print();
process.exit(report.errors.length > 0 ? 1 : 0);
