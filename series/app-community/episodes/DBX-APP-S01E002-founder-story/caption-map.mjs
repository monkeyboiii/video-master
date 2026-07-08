// Word-timed caption map generator — E002 (see skills/06 + 07).
//
// E002 now uses ONE continuous whole-video caption track (the E003 strategy), so the rolling
// window carries words across every cut and subtitles never fade out mid-video. Word times
// are GLOBAL: clipStart + (srtTime - trimIn) * scale.
//
// The track stops at 63.80s — before profile-card enters at 63.80 — because the cta captions
// deliberately end at "…description." (no subtitles over "My name is Rubio / waiting for you
// there"). That `stop` truncates the CAPTION WORDS only; the .srt of record keeps every line.
//
// Run from the video-master repo root:
//   node series/app-community/episodes/DBX-APP-S01E002-founder-story/caption-map.mjs
import fs from 'node:fs';
import path from 'node:path';

const EP = 'series/app-community/episodes/DBX-APP-S01E002-founder-story';
const SRT = 'media/DBX-APP-S01E002/_source/srt';
const OUT = path.join(EP, 'remotion-props');
fs.mkdirSync(OUT, {recursive: true});

const TOTAL = 63.8; // caption track ends as the profile-card enters
const VIDEO_END = 65.75;

// start = global timeline start; dur = trimmed clip length (trailing pause cropped).
const BEATS = [
  {f: '01_hook.srt',       start: 0.00,  trimIn: 0, dur: 7.90,  brand: ['gets', 'it'],                            harsh: ['nobody']},
  {f: '02_first-ride.srt', start: 7.90,  trimIn: 0, dur: 11.00, brand: [],                                        harsh: ['brutal', '100', 'degrees']},
  {f: '03_addictive.srt',  start: 18.90, trimIn: 0, dur: 10.90, brand: ['crazy', 'addictive', 'share'],           harsh: []},
  {f: '04_scattered.srt',  start: 29.80, trimIn: 0, dur: 7.05,  brand: [],                                        harsh: ['scattered', 'outdated']},
  {f: '05_built-it.srt',   start: 36.85, trimIn: 0, dur: 16.05, brand: ['dirtbikex', 'bloat', 'twice', '21', 'languages'], harsh: []},
  {f: '06_cta.srt',        start: 52.90, trimIn: 0, dur: 12.85, stop: 'description',
   brand: ['seen', 'invite', 'code'], harsh: []},
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

const scaleOf = (cfg, cues) =>
  Math.min(1, cfg.dur / Math.max(0.1, cues[cues.length - 1].end - cfg.trimIn));

// ---- caption words (truncated at `stop`) ----
const words = [];
for (const cfg of BEATS) {
  const cues = parseSrt(fs.readFileSync(path.join(SRT, cfg.f), 'utf8'));
  const scale = scaleOf(cfg, cues);
  const brand = new Set(cfg.brand);
  const harsh = new Set(cfg.harsh);
  let stop = false;
  for (const c of cues) {
    if (stop) break;
    const toks = c.text.split(/\s+/).map((x) => x.replace(/^\*/, '')).filter(Boolean);
    const span = Math.max(0.2, c.end - c.start);
    for (let i = 0; i < toks.length; i++) {
      const local = c.start + (span * i) / toks.length;
      const s = +(cfg.start + Math.max(0, local - cfg.trimIn) * scale).toFixed(2);
      const n = norm(toks[i]);
      const e = brand.has(n) ? 'brand' : harsh.has(n) ? 'harsh' : undefined;
      words.push(e ? {t: toks[i], s, e} : {t: toks[i], s});
      if (cfg.stop && n.includes(cfg.stop)) {stop = true; break;}
    }
  }
}
words.sort((a, b) => a.s - b.s);
const last = words[words.length - 1].s;
if (last >= TOTAL) throw new Error(`last caption word @${last} >= TOTAL ${TOTAL}`);

fs.writeFileSync(
  path.join(OUT, 'captions.all.json'),
  JSON.stringify({durationSec: TOTAL, fontScale: 0.95, window: 6, words}, null, 2),
);

// ---- combined whole-video SRT of record (keeps every line, incl. the CTA) ----
const ts = (t) => {
  const ms = Math.max(0, Math.round(t * 1000));
  const p = (n, w = 2) => String(n).padStart(w, '0');
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor((ms % 3600000) / 60000))}:${p(
    Math.floor((ms % 60000) / 1000),
  )},${p(ms % 1000, 3)}`;
};
let n = 0;
const srtOut = [];
for (const cfg of BEATS) {
  const cues = parseSrt(fs.readFileSync(path.join(SRT, cfg.f), 'utf8'));
  const scale = scaleOf(cfg, cues);
  for (const c of cues) {
    const a = cfg.start + Math.max(0, c.start - cfg.trimIn) * scale;
    const b = Math.min(VIDEO_END, cfg.start + Math.max(0, c.end - cfg.trimIn) * scale);
    srtOut.push(`${++n}\n${ts(a)} --> ${ts(b)}\n${c.text.replace(/\*/g, '')}\n`);
  }
}
fs.mkdirSync(path.join(EP, 'subtitles'), {recursive: true});
fs.writeFileSync(path.join(EP, 'subtitles', 'en-US.srt'), srtOut.join('\n'));

const emph = words.filter((w) => w.e).map((w) => `${w.t}[${w.e}]@${w.s}`).join(' ');
console.log(`${words.length} caption words, track ${TOTAL}s, last@${last}`);
console.log(`${n} srt cues -> subtitles/en-US.srt (video ends ${VIDEO_END}s)`);
console.log('emphasis:', emph);
