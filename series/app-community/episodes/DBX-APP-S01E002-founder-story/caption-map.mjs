// Word-timed caption map generator (worked example — see skills/06 + 07).
//
// Builds the pre-edit sync artifact: one remotion-props/captions.<beat>.json per beat,
// where each word is {t, s, e?} — text, start-seconds-into-clip, emphasis brand|harsh.
// The editing agent keys captions, SFX, zoom, and overlay timing off this map.
//
// Per-episode config is the BEATS block below (srt file, trimmed clip duration, font
// scale, rolling window, emphasis word sets, optional stop-word). Copy this file into a
// new episode dir and edit BEATS. Run from the video-master repo root:
//   node series/<series>/episodes/<episode>/caption-map.mjs
import fs from 'node:fs';
import path from 'node:path';

const EP = 'series/app-community/episodes/DBX-APP-S01E002-founder-story';
const SRT = 'media/DBX-APP-S01E002/_source/srt'; // per-beat SRTs (media bundle)
const OUT = path.join(EP, 'remotion-props');
fs.mkdirSync(OUT, {recursive: true});

// dur = trimmed clip length (trailing pause cropped at speech end — silencedetect).
// window small = single bounded line. stop = drop words at/after the token containing it.
const BEATS = {
  hook: {f: '01_hook.srt', dur: 7.9, fs: 1.0, win: 6, brand: ['gets', 'it'], harsh: ['nobody']},
  'first-ride': {f: '02_first-ride.srt', dur: 11.0, fs: 0.95, win: 6, brand: [], harsh: ['brutal', '100', 'degrees']},
  addictive: {f: '03_addictive.srt', dur: 10.9, fs: 1.0, win: 6, brand: ['crazy', 'addictive', 'share'], harsh: []},
  scattered: {f: '04_scattered.srt', dur: 7.05, fs: 1.0, win: 6, brand: [], harsh: ['scattered', 'outdated']},
  'built-it': {f: '05_built-it.srt', dur: 16.05, fs: 0.9, win: 6, brand: ['dirtbikex', 'bloat', 'twice', '21', 'languages'], harsh: []},
  cta: {f: '06_cta.srt', dur: 12.85, fs: 0.95, win: 6, stop: 'description', brand: ['seen', 'invite', 'code'], harsh: []},
};

const norm = (w) => w.replace(/^[*"']+|[*"'.,!?;:]+$/g, '').toLowerCase();

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

for (const [beat, cfg] of Object.entries(BEATS)) {
  const brand = new Set(cfg.brand);
  const harsh = new Set(cfg.harsh);
  const words = [];
  let stop = false;
  for (const c of parseSrt(fs.readFileSync(path.join(SRT, cfg.f), 'utf8'))) {
    if (stop) break;
    const toks = c.text.split(/\s+/).map((t) => t.replace(/^\*/, '')).filter(Boolean);
    const span = Math.max(0.2, c.end - c.start);
    for (let i = 0; i < toks.length; i++) {
      const s = +(c.start + (span * i) / toks.length).toFixed(2);
      const n = norm(toks[i]);
      const e = brand.has(n) ? 'brand' : harsh.has(n) ? 'harsh' : undefined;
      words.push(e ? {t: toks[i], s, e} : {t: toks[i], s});
      if (cfg.stop && n.includes(cfg.stop)) {stop = true; break;}
    }
  }
  fs.writeFileSync(
    path.join(OUT, `captions.${beat}.json`),
    JSON.stringify({durationSec: cfg.dur, fontScale: cfg.fs, window: cfg.win, words}, null, 2),
  );
  console.log(`${beat}: ${words.length} words, ${cfg.dur}s, ends "…${words[words.length - 1].t}"`);
}
console.log('wrote', OUT);
