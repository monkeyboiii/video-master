// Word-timed caption map generator — E004 (see skills/06 + 07).
//
// ONE continuous whole-video caption track, so the rolling window carries words across the cuts
// and captions never fade out mid-video.
//
// WHY THIS IS NOT THE E002/E003 GENERATOR
// Those episodes scaled each beat's SRT times by `dur / srtEnd` to pull the loosely-transcribed
// cue ends back inside the clip. That works when a beat is ONE cue with no real pauses. E004's
// beats are up to three sentences with ~1s breaths, and a global scale drags the later sentences
// EARLY (it moved "DirtBikeX" to 5.76s when he says it near 7.0s).
//
// So words are anchored to the REAL SPEECH instead. For each beat we know its speech runs
// (measured with `silencedetect=noise=-32dB:d=0.30`, see RUNS below). We split those runs into
// as many groups as the beat has SRT cues, cutting at the LARGEST inter-run gaps — i.e. the real
// sentence boundaries — and treat the smaller gaps as breaths. Each cue's words are then spread
// uniformly over its group's *speech* time, skipping the silences entirely. A word can therefore
// never land in a pause, and each sentence starts when it is actually spoken.
//
// Reproduce RUNS with:
//   ffmpeg -i narration/<clip> -map 0:a:0 -af silencedetect=noise=-32dB:d=0.30 -f null -
//
// Run from the video-master repo root:
//   node series/app-community/episodes/DBX-APP-S01E004-sponsorship-passes/caption-map.mjs
import fs from 'node:fs';
import path from 'node:path';

const EP = 'series/app-community/episodes/DBX-APP-S01E004-sponsorship-passes';
const SRT = 'media/DBX-APP-S01E004/_source/srt';
const OUT = path.join(EP, 'remotion-props');
fs.mkdirSync(OUT, {recursive: true});

// start = global timeline start; trimIn = head silence trimmed; dur = trimmed clip length.
// runs = speech intervals in RAW clip seconds (before trimIn is subtracted).
const BEATS = [
  {f: '01_hook.srt', start: 0.00, trimIn: 0, dur: 9.79,
   runs: [[0, 2.754], [3.439, 5.850], [6.830, 9.638]],
   brand: ['slots', 'dirtbikex'], harsh: ['hate', 'ads']},

  {f: '02_hate-ads.srt', start: 9.79, trimIn: 0, dur: 4.88,
   runs: [[0, 4.725]],
   brand: [], harsh: ['hate', 'ads', 'away', 'eyes']},

  {f: '03_billboard.srt', start: 14.67, trimIn: 0, dur: 4.94,
   runs: [[0, 4.785]],
   brand: [], harsh: ['billboard']},

  {f: '04_passes.srt', start: 19.61, trimIn: 0, dur: 5.84,
   runs: [[0, 1.624], [2.090, 5.693]],
   brand: ['differently', 'passes', 'riders'], harsh: []},

  {f: '05_sponsorship.srt', start: 25.45, trimIn: 0.83, dur: 7.64,
   // the 0.33-0.57 blip is a lip smack before the take; trimIn drops it
   runs: [[0.883, 3.624], [4.111, 5.128], [5.479, 6.437], [6.768, 8.322]],
   brand: ['sponsorship', 'spots', 'starts', 'runs', 'dirtbikex'], harsh: []},

  {f: '06_discovery.srt', start: 33.09, trimIn: 0.44, dur: 5.25,
   runs: [[0.495, 3.700], [4.121, 5.535]],
   brand: ['multiple', 'places', 'looking'], harsh: []},

  {f: '07_splash.srt', start: 38.34, trimIn: 0, dur: 6.19,
   runs: [[0, 1.886], [2.295, 3.427], [3.859, 6.043]],
   brand: ['biggest', 'splash', 'pause', 'tap', 'profile'], harsh: []},

  {f: '08_capped.srt', start: 44.53, trimIn: 0, dur: 6.08,
   runs: [[0, 3.999], [4.368, 5.926]],
   brand: ['fair', 'capped', 'rotated'], harsh: ['flood']},

  {f: '09_stats.srt', start: 50.61, trimIn: 0.29, dur: 6.20,
   runs: [[0.341, 2.782], [3.397, 4.558], [5.001, 6.342]],
   brand: ['stats', 'regional', 'exposure', 'daily', 'trends'], harsh: []},

  {f: '10_cta.srt', start: 56.81, trimIn: 0, dur: 9.44,
   runs: [[0, 3.082], [3.877, 6.587], [7.173, 9.293]],
   brand: ['fair', 'seen', 'rubio', 'passes', 'free', 'pass'], harsh: []},
];

const TOTAL = +BEATS.reduce((a, b) => a + b.dur, 0).toFixed(2); // 66.25

const norm = (w) => w.replace(/^[*"“”'']+|[*"“”''.,!?;:]+$/g, '').toLowerCase();

const parseSrt = (txt) => {
  const cues = [];
  for (const b of txt.replace(/\r/g, '').split(/\n\n+/)) {
    const m = b.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
    if (!m) continue;
    const text = b.split('\n').slice(2).join(' ').trim();
    if (text) cues.push({text});
  }
  return cues;
};

/** Shift runs into trimmed-clip time and clip them to [0, dur]. */
const localRuns = (cfg) =>
  cfg.runs
    .map(([a, b]) => [a - cfg.trimIn, Math.min(b - cfg.trimIn, cfg.dur)])
    .filter(([a, b]) => b - a > 0.05)
    .map(([a, b]) => [Math.max(0, a), b]);

/** Split runs into `n` groups, cutting at the n-1 largest inter-run gaps (sentence boundaries). */
const groupRuns = (runs, n) => {
  if (n >= runs.length) return runs.map((r) => [r]);
  const gaps = runs.slice(0, -1).map((r, i) => ({i, gap: runs[i + 1][0] - r[1]}));
  const cutAfter = new Set(
    gaps.sort((a, b) => b.gap - a.gap).slice(0, n - 1).map((g) => g.i),
  );
  const groups = [];
  let cur = [];
  runs.forEach((r, i) => {
    cur.push(r);
    if (cutAfter.has(i)) { groups.push(cur); cur = []; }
  });
  if (cur.length) groups.push(cur);
  return groups;
};

/** Map a fraction of a group's SPEECH time back to real (trimmed-clip) seconds. */
const speechAt = (group, frac) => {
  const total = group.reduce((a, [s, e]) => a + (e - s), 0);
  let want = frac * total;
  for (const [s, e] of group) {
    const len = e - s;
    if (want <= len) return s + want;
    want -= len;
  }
  return group[group.length - 1][1];
};

const words = [];
const cueTimes = []; // for the combined SRT artifact
for (const cfg of BEATS) {
  const brand = new Set(cfg.brand);
  const harsh = new Set(cfg.harsh);
  const cues = parseSrt(fs.readFileSync(path.join(SRT, cfg.f), 'utf8'));
  const groups = groupRuns(localRuns(cfg), cues.length);
  if (groups.length !== cues.length) {
    throw new Error(`${cfg.f}: ${cues.length} cues but ${groups.length} run-groups`);
  }
  cues.forEach((c, ci) => {
    const g = groups[ci];
    const toks = c.text.split(/\s+/).filter(Boolean);
    toks.forEach((tok, i) => {
      const s = +(cfg.start + speechAt(g, i / toks.length)).toFixed(2);
      const n = norm(tok);
      const e = brand.has(n) ? 'brand' : harsh.has(n) ? 'harsh' : undefined;
      words.push(e ? {t: tok, s, e} : {t: tok, s});
    });
    cueTimes.push({
      a: cfg.start + g[0][0],
      b: cfg.start + g[g.length - 1][1],
      text: c.text,
    });
  });
}
words.sort((a, b) => a.s - b.s);
const last = words[words.length - 1].s;
if (last >= TOTAL) throw new Error(`last word @${last} >= TOTAL ${TOTAL}`);

const props = {durationSec: TOTAL, fontScale: 0.95, window: 6, words};
fs.writeFileSync(path.join(OUT, 'captions.all.json'), JSON.stringify(props, null, 2));

// Combined whole-video SRT (subtitle artifact of record) — cue spans are the real speech runs.
const ts = (t) => {
  const ms = Math.max(0, Math.round(t * 1000));
  const h = String(Math.floor(ms / 3600000)).padStart(2, '0');
  const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, '0');
  const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
  return `${h}:${m}:${s},${String(ms % 1000).padStart(3, '0')}`;
};
const srtOut = cueTimes.map(
  (c, i) => `${i + 1}\n${ts(c.a)} --> ${ts(Math.min(TOTAL, c.b))}\n${c.text}\n`,
);
fs.mkdirSync(path.join(EP, 'subtitles'), {recursive: true});
fs.writeFileSync(path.join(EP, 'subtitles', 'en-US.srt'), srtOut.join('\n'));

const emph = words.filter((w) => w.e).map((w) => `${w.t}[${w.e}]@${w.s}`).join(' ');
console.log(`${words.length} words, ${TOTAL}s, first@${words[0].s} last@${last}`);
console.log(`${srtOut.length} srt cues -> subtitles/en-US.srt`);
console.log('beat starts:', BEATS.map((b) => b.start).join(' '));
console.log('emphasis:', emph);
