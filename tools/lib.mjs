// Shared helpers for the video-master tools. Requires `npm install` in tools/.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const STATUSES = ['topic', 'packaging', 'scripting', 'shooting', 'editing', 'qc', 'published', 'retro'];
export const LOCALES = ['en-US', 'zh-CN'];
export const PLATFORMS = ['tiktok', 'ytshorts', 'reels', 'rednote', 'douyin', 'bilibili', 'wechat'];
// 16x10 exists for covers only (Bilibili requires a 16:10 cover image).
export const ASPECTS = ['9x16', '16x9', '1x1', '3x4', '16x10'];
export const OVERLAY_COMPS = ['hook-title', 'checklist-card', 'cta-card', 'lower-third', 'subtitle-track', 'stage-cards', 'stage-cards-wide', 'phone-language', 'phone-embed', 'phone-sponsor', 'brand-title', 'brand-drop', 'profile-card', 'invite-card', 'kinetic-captions', 'feature-phones', 'feature-fan', 'side-screen', 'photo-reveal', 'brand-form', 'mark-pop'];
export const COVER_COMPS = ['cover-9x16', 'cover-3x4'];

// Video IDs appear inside the derived filename patterns below, and an interstitial ID
// carries a literal dot — escape before interpolating so it can't match any character.
const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Lineage relations. `follows` (where it published) is a separate field and always allowed;
// `relation` describes what an episode does to its PARENT, and only exists when a parent does.
export const RELATIONS = ['remedy', 'inspired-by', 'followup'];

export const RE = {
  // S{season}E{episode}. The season number IS the category — S03 is the 100-track challenge —
  // so nothing else needs to be in the id. The retired form was DBX-{CODE}-S..E.., whose
  // prefix discriminated nothing once one series existed; see naming-conventions.md.
  videoId: /^S\d{2}E\d{3}$/,
  // The retired form, recognised ONLY so the checker can say "this is the old id" instead of
  // "this is not an id". Nothing accepts it.
  legacyVideoId: /^DBX-[A-Z]{3,4}-S\d{2}E\d{3}(?:\.\d)?$/,
  seasonDir: /^S\d{2}$/,
  episodeDir: /^E\d{3}-[a-z0-9]+(-[a-z0-9]+)*$/,
  slug: /^[a-z0-9]+(-[a-z0-9]+)*$/,
  seriesCode: /^[A-Z]{3,4}$/,
  locale: /^[a-z]{2}-[A-Z]{2}$/,
  // Raw source clips. Two accepted forms:
  //  - multicam shots:      {videoId}_SH###_TK##_{cam}.ext
  //  - per-beat narration:  NN_{beat}.ext  (optionally {videoId}_NN_{beat}.ext)
  // The narration form matches how founder talking-head episodes are shot/renamed
  // for easy pickup (one clip per beat), e.g. 01_hook.MOV.
  shotFile: () =>
    new RegExp(
      `^(?:(?:.+_)?SH\\d{3}_TK\\d{2}_[a-z0-9]+(?:-[a-z0-9]+)*` +
        `|(?:.+_)?\\d{2}_[a-z0-9]+(?:-[a-z0-9]+)*)\\.[A-Za-z0-9]+$`,
    ),
  // MEDIA FILENAMES ARE RECORDED, NOT DERIVED. manifest.yml carries every asset's `filename:`,
  // so the id and the filename were never actually coupled — the old patterns only made them
  // look coupled, and enforcing that coupling is what would have forced renaming every file on
  // the MacBook during the S0N migration. What still carries meaning is the locale and the
  // version, so that is what these assert; the optional leading `{anything}_` accepts both the
  // legacy `DBX-APP-S03E003_en-US_vo_v004.wav` already on disk and a short `en-US_vo_v004.wav`.
  voFile: () => new RegExp(`^(?:.+_)?(${LOCALES.join('|')})_vo(-[a-z0-9]+)?_v\\d{3}\\.\\w+$`),
  // Optional `-<variant>` after the comp name for per-beat instances of one
  // composition, e.g. ..._kinetic-captions-hook_v001.mov
  overlayFile: (_videoId, locale) =>
    new RegExp(`^(?:.+_)?${locale}_(${ASPECTS.join('|')})_(${OVERLAY_COMPS.join('|')})(-[a-z0-9]+(-[a-z0-9]+)*)?_v\\d{3}\\.mov$`),
  coverFile: (_videoId, locale) =>
    new RegExp(`^(?:.+_)?${locale}_(${PLATFORMS.join('|')})_(${ASPECTS.join('|')})_cover_v\\d{3}\\.(png|jpg)$`),
  exportFile: (_videoId, locale) =>
    new RegExp(`^(?:.+_)?${locale}_(${PLATFORMS.join('|')})_(${ASPECTS.join('|')})_v\\d{3}_(review|final)\\.mp4$`),
  // Canonical `{videoId}_{locale}_v###.kdenlive`, or a friendly slug name (e.g.
  // founder-story.kdenlive) when the project lives inside the episode media bundle.
  timelineFile: (_videoId, locale) =>
    new RegExp(`^((?:.+_)?${locale}_v\\d{3}|[a-z0-9]+(-[a-z0-9]+)*)\\.kdenlive$`),
  timecode: /^\d{2}:\d{2}:\d{2}\.\d{3}$/,
};

export function loadYamlFile(file) {
  return YAML.parse(fs.readFileSync(file, 'utf8'));
}

// Like loadYamlFile but returns null on a parse error instead of throwing, so one
// broken manifest can't abort validation of everything else.
function tryLoadYamlFile(file) {
  try {
    return loadYamlFile(file);
  } catch {
    return null;
  }
}

// "HH:MM:SS.mmm" -> milliseconds (assumes RE.timecode already matched)
export function timecodeToMs(tc) {
  const [h, m, rest] = tc.split(':');
  const [s, ms] = rest.split('.');
  return ((+h * 60 + +m) * 60 + +s) * 1000 + +ms;
}

// The season IS the top level and the season number IS the category: series/S03/E003-slug/.
// `root` exists so selftest can point the whole model at a fixture tree.
export function seriesRoot(root = REPO_ROOT) {
  return path.join(root, 'series');
}

export function listSeasons(root = REPO_ROOT) {
  const base = seriesRoot(root);
  if (!fs.existsSync(base)) return [];
  return fs
    .readdirSync(base, { withFileTypes: true })
    .filter((d) => d.isDirectory() && RE.seasonDir.test(d.name))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((d) => {
      const dir = path.join(base, d.name);
      const readmePath = path.join(dir, 'README.md');
      return {
        id: d.name,
        n: Number(d.name.slice(1)),
        dir,
        readmePath,
        hasReadme: fs.existsSync(readmePath),
      };
    });
}

export function listEpisodes(season) {
  return fs
    .readdirSync(season.dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((d) => {
      const dir = path.join(season.dir, d.name);
      const manifestPath = path.join(dir, 'manifest.yml');
      const manifest = fs.existsSync(manifestPath) ? tryLoadYamlFile(manifestPath) : null;
      return { dirName: d.name, dir, manifestPath, manifest, season };
    });
}

// Every episode across every season, plus an id -> episode index. One call, because almost every
// cross-episode question (lineage, props reuse, duplicate ids) needs both.
export function loadTree(root = REPO_ROOT) {
  const seasons = listSeasons(root);
  const episodes = [];
  for (const s of seasons) for (const ep of listEpisodes(s)) episodes.push(ep);
  const byId = new Map();
  for (const ep of episodes) {
    const id = ep.manifest?.video_id;
    if (id) byId.set(id, ep);
  }
  return { seasons, episodes, byId, root };
}

export class Report {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }
  error(ctx, msg) {
    this.errors.push(`${ctx}: ${msg}`);
  }
  warn(ctx, msg) {
    this.warnings.push(`${ctx}: ${msg}`);
  }
  print() {
    for (const w of this.warnings) console.log(`WARN  ${w}`);
    for (const e of this.errors) console.log(`ERROR ${e}`);
    console.log(`\n${this.errors.length} error(s), ${this.warnings.length} warning(s)`);
  }
}

// Minimal SRT parser/checker. Returns {cues, errors}.
export function checkSrt(text) {
  const errors = [];
  const cues = [];
  const ts = /^(\d{2}):(\d{2}):(\d{2}),(\d{3})$/;
  const toMs = (m) => ((+m[1] * 60 + +m[2]) * 60 + +m[3]) * 1000 + +m[4];
  const blocks = text
    .replace(/\r\n/g, '\n')
    .replace(/^﻿/, '')
    .split(/\n\n+/)
    .map((b) => b.trim())
    .filter(Boolean);
  blocks.forEach((block, i) => {
    const lines = block.split('\n');
    if (lines.length < 3) return errors.push(`cue ${i + 1}: fewer than 3 lines`);
    if (String(+lines[0]) !== lines[0].trim()) errors.push(`cue ${i + 1}: bad index "${lines[0]}"`);
    else if (+lines[0] !== i + 1) errors.push(`cue ${i + 1}: index ${lines[0]} not sequential`);
    const m = lines[1].match(/^(\S+) --> (\S+)$/);
    if (!m) return errors.push(`cue ${i + 1}: bad timing line "${lines[1]}"`);
    const a = m[1].match(ts);
    const b = m[2].match(ts);
    if (!a || !b) return errors.push(`cue ${i + 1}: timestamps must be HH:MM:SS,mmm`);
    const start = toMs(a);
    const end = toMs(b);
    if (end <= start) errors.push(`cue ${i + 1}: end <= start`);
    const prev = cues[cues.length - 1];
    if (prev && start < prev.end) errors.push(`cue ${i + 1}: overlaps cue ${i}`);
    cues.push({ start, end, text: lines.slice(2).join('\n') });
  });
  return { cues, errors };
}
