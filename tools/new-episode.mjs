#!/usr/bin/env node
// Scaffold a new episode from templates.
// Usage: node tools/new-episode.mjs <SERIES-CODE|series-slug> <kebab-slug>
import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT, RE, listSeries } from './lib.mjs';

const [seriesArg, slug] = process.argv.slice(2);
if (!seriesArg || !slug) {
  console.error('Usage: node tools/new-episode.mjs <SERIES-CODE|series-slug> <kebab-slug>');
  process.exit(1);
}
if (!RE.slug.test(slug) || slug.length > 40) {
  console.error(`Slug "${slug}" must be kebab-case ASCII, ≤40 chars.`);
  process.exit(1);
}

const series = listSeries().find(
  (s) => s.slug === seriesArg || s.manifest?.code === seriesArg.toUpperCase(),
);
if (!series?.manifest) {
  console.error(`Series "${seriesArg}" not found. Existing: ${listSeries().map((s) => `${s.manifest?.code} (${s.slug})`).join(', ') || 'none'}`);
  process.exit(1);
}

const { code, season } = series.manifest;
const epRoot = path.join(series.dir, 'episodes');
fs.mkdirSync(epRoot, { recursive: true });
if (season < 1 || season > 99) {
  console.error(`Season ${season} out of range: the S{ss} ID format supports 1–99.`);
  process.exit(1);
}
const nums = fs
  .readdirSync(epRoot, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name.match(new RegExp(`^DBX-${code}-S${String(season).padStart(2, '0')}E(\\d{3})-`)))
  .filter(Boolean)
  .map((m) => +m[1]);
const next = (nums.length ? Math.max(...nums) : 0) + 1;
if (next > 999) {
  console.error(`Episode ${next} out of range: the E{eee} ID format supports 1–999.`);
  process.exit(1);
}
const videoId = `DBX-${code}-S${String(season).padStart(2, '0')}E${String(next).padStart(3, '0')}`;
const epDir = path.join(epRoot, `${videoId}-${slug}`);
if (fs.existsSync(epDir)) {
  console.error(`${epDir} already exists`);
  process.exit(1);
}

fs.mkdirSync(path.join(epDir, 'subtitles'), { recursive: true });
fs.mkdirSync(path.join(epDir, 'remotion-props'), { recursive: true });
fs.writeFileSync(path.join(epDir, 'subtitles', '.gitkeep'), '');
fs.writeFileSync(path.join(epDir, 'remotion-props', '.gitkeep'), '');

const fill = (text) =>
  text
    .replaceAll('{{VIDEO_ID}}', videoId)
    .replaceAll('{{SLUG}}', slug)
    .replaceAll('{{SERIES_SLUG}}', series.slug);

const tpl = (name) => fs.readFileSync(path.join(REPO_ROOT, 'templates', 'episode', name), 'utf8');
fs.writeFileSync(path.join(epDir, 'manifest.yml'), fill(tpl('manifest.yml')));
fs.writeFileSync(path.join(epDir, 'brief.md'), fill(tpl('brief.md')));

console.log(`Created ${path.relative(REPO_ROOT, epDir)}`);
console.log(`
Next steps:
  1. Fill brief.md            (skills/01-topic-selection.md)
  2. node tools/validate.mjs  (must pass with status: topic)
Later stages copy their own templates from templates/episode/.`);
