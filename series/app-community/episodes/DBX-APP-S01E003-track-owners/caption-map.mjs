// Word-timed caption map generator — E003 (see skills/06 + 07).
//
// E003 uses ONE continuous whole-video caption track (not per-beat), so the rolling
// window carries words across the cuts and captions never fade out mid-video.
// Word times are therefore GLOBAL: clipStart + (srtTime - trimIn), clamped at clipStart.
//
// Run from the video-master repo root:
//   node series/app-community/episodes/DBX-APP-S01E003-track-owners/caption-map.mjs
import fs from 'node:fs';
import path from 'node:path';

const EP = 'series/app-community/episodes/DBX-APP-S01E003-track-owners';
const SRT = 'media/DBX-APP-S01E003/_source/srt';
const OUT = path.join(EP, 'remotion-props');
fs.mkdirSync(OUT, {recursive: true});

const TOTAL = 53.61; // sum of trimmed clip durations

// start = global timeline start; trimIn = head silence trimmed; dur = trimmed clip length.
// The SRT cue-end times overshoot the real speech end (they were transcribed loosely), so
// each beat's word times are scaled by dur / (srtEnd - trimIn), capped at 1.0. Without this
// the last words fall past the end of the clip and never render.
const BEATS = [
  {f: '01_hook.srt',   start: 0.00,  trimIn: 0.00, dur: 15.48, brand: [],                    harsh: ['never', 'discover']},
  {f: '02_why.srt',    start: 15.48, trimIn: 0.21, dur: 7.55,  brand: ['dirtbikex'],         harsh: []},
  {f: '03_flair.srt',  start: 23.03, trimIn: 0.35, dur: 5.92,  brand: ['verified', 'owner'], harsh: []},
  {f: '04_create.srt', start: 28.95, trimIn: 0.00, dur: 5.06,  brand: ['reoccurring'],       harsh: []},
  {f: '05_rsvp.srt',   start: 34.01, trimIn: 0.00, dur: 7.97,  brand: ['rsvp', 'reminded'],  harsh: []},
  {f: '06_cta.srt',    start: 41.98, trimIn: 0.00, dur: 11.63, brand: ['owner', 'comment'],  harsh: []},
];

const norm = (w) => w.replace(/^[*"“”'']+|[*"“”''.,!?;:]+$/g, '').toLowerCase();

const parseSrt = (txt) => {
  const cues = [];
  for (const b of txt.replace(/\r/g, '').split(/\n\n+/)) {
    const m = b.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
    if (!m) continue;
    const start = +m[1] * 3600 + +m[2] * 60 + +m[3] + +m[4] / 1000;
    const end = +m[5] * 3600 + +m[6] * 60 + +m[7] + +m[8] / 1000;
    const text = b.split('\n').slice(2).join(' ').trim();
    if (text) cues.push({start, end, text});
  }
  return cues;
};

const words = [];
for (const cfg of BEATS) {
  const brand = new Set(cfg.brand);
  const harsh = new Set(cfg.harsh);
  const cues = parseSrt(fs.readFileSync(path.join(SRT, cfg.f), 'utf8'));
  const srtEnd = cues[cues.length - 1].end;
  const scale = Math.min(1, cfg.dur / Math.max(0.1, srtEnd - cfg.trimIn));
  for (const c of cues) {
    const toks = c.text.split(/\s+/).filter(Boolean);
    const span = Math.max(0.2, c.end - c.start);
    toks.forEach((tok, i) => {
      const local = c.start + (span * i) / toks.length;
      const s = +(cfg.start + Math.max(0, local - cfg.trimIn) * scale).toFixed(2);
      const n = norm(tok);
      const e = brand.has(n) ? 'brand' : harsh.has(n) ? 'harsh' : undefined;
      words.push(e ? {t: tok, s, e} : {t: tok, s});
    });
  }
}
words.sort((a, b) => a.s - b.s);
const last = words[words.length - 1].s;
if (last >= TOTAL) throw new Error(`last word @${last} >= TOTAL ${TOTAL}`);

const props = {durationSec: TOTAL, fontScale: 0.95, window: 6, words};
fs.writeFileSync(path.join(OUT, 'captions.all.json'), JSON.stringify(props, null, 2));

// Combined whole-video SRT (subtitle artifact of record), same offset+scale as the words.
const ts = (t) => {
  const ms = Math.max(0, Math.round(t * 1000));
  const h = String(Math.floor(ms / 3600000)).padStart(2, '0');
  const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, '0');
  const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
  return `${h}:${m}:${s},${String(ms % 1000).padStart(3, '0')}`;
};
let n = 0;
const srtOut = [];
for (const cfg of BEATS) {
  const cues = parseSrt(fs.readFileSync(path.join(SRT, cfg.f), 'utf8'));
  const srtEnd = cues[cues.length - 1].end;
  const scale = Math.min(1, cfg.dur / Math.max(0.1, srtEnd - cfg.trimIn));
  for (const c of cues) {
    const a = cfg.start + Math.max(0, c.start - cfg.trimIn) * scale;
    const b = Math.min(TOTAL, cfg.start + Math.max(0, c.end - cfg.trimIn) * scale);
    srtOut.push(`${++n}\n${ts(a)} --> ${ts(b)}\n${c.text}\n`);
  }
}
fs.mkdirSync(path.join(EP, 'subtitles'), {recursive: true});
fs.writeFileSync(path.join(EP, 'subtitles', 'en-US.srt'), srtOut.join('\n'));

const emph = words.filter((w) => w.e).map((w) => `${w.t}[${w.e}]@${w.s}`).join(' ');
console.log(`${words.length} words, ${TOTAL}s, first@${words[0].s} last@${words[words.length - 1].s}`);
console.log(`${n} srt cues -> subtitles/en-US.srt`);
console.log('emphasis:', emph);
