#!/usr/bin/env node
// Group per-token caption timings into the script's own words.
//
// Usage: node tools/group-words.mjs <captions.json> <script.txt> [out.json]
//
// WHY THIS EXISTS. whisper.cpp emits zh timings per CHARACTER — 核心 arrives as 核 and 心, two
// rows. Highlighting per character is wrong: 核心 is one word and must light as one. But the
// component must not guess where words end, and a Chinese segmenter is a dependency and a second
// source of truth.
//
// This repo already has the answer: it is handed the SCRIPT. The script has the word boundaries a
// segmenter would try to infer, written by the person who chose them. So walk the script's words
// against the transcription's characters and take each word's span from the first and last
// character it consumed: start of the first, end of the last.
//
// It also fixes the text. Per agents.d/modules/captions.md, whisper's zh TEXT is not trustworthy —
// a third of the tokens come back as unrecoverable U+FFFD — while its TIMINGS are. Taking
// characters from the script and spans from the transcription uses each for the half it is good
// at.
//
// The script format: one sentence per line; words separated by spaces. For zh, write the spaces
// where the words break — that is the whole input this needs, and nothing else can supply it.
import fs from 'node:fs';

const [capPath, scriptPath, outPath] = process.argv.slice(2);
if (!capPath || !scriptPath) {
  console.error('Usage: node tools/group-words.mjs <captions.json> <script.txt> [out.json]');
  process.exit(1);
}

const caps = JSON.parse(fs.readFileSync(capPath, 'utf8'));
const lines = fs.readFileSync(scriptPath, 'utf8').split('\n').map((l) => l.trim()).filter(Boolean);

// the transcription as a flat stream of characters, each carrying the span of the token it came
// from; a token of several characters lends its span to each
const stream = [];
for (const c of caps) {
  const chars = [...String(c.text)].filter((ch) => ch.trim() !== '');
  for (const ch of chars) stream.push({ch, startMs: c.startMs, endMs: c.endMs});
}

// THE STREAM IS SHORTER THAN THE SCRIPT, AND THAT IS THE NORMAL CASE. whisper.cpp loses
// multi-byte characters to byte-split tokens before any of this runs — 36 of 131 on S05E002, so
// 118 stream characters for a 151-character script. A greedy walk that consumes one stream
// position per script character (the previous form, 3 hops of tolerance) therefore cannot finish:
// every lost character burns a position a later one needed, the error compounds, and the tail of
// the script falls off the end with startMs = endMs = 0. Five of nineteen sentences came back at
// zero that way, which is not "approximate timings" — it is no timings.
//
// So align instead of walk. The longest common subsequence between the script's characters and
// the stream's is the set of positions both agree on, in order; those are anchors. A script
// character with no anchor is not a failure and gets no guess of its own — it is interpolated
// between the anchors either side of it, which is exactly what a missing character deserves when
// the ones around it are known. Monotonic by construction, so a line can never run backwards.
const scriptChars = [];
lines.forEach((line, si) => {
  line.split(/\s+/).filter(Boolean).forEach((w, wi) => {
    for (const ch of [...w].filter((c) => c.trim() !== '')) scriptChars.push({ch, si, wi});
  });
});

// LCS over (scriptChars, stream) — 151x118 here, so the plain table is the right shape.
const n = scriptChars.length, m = stream.length;
const dp = Array.from({length: n + 1}, () => new Uint16Array(m + 1));
for (let a = n - 1; a >= 0; a--) {
  for (let b = m - 1; b >= 0; b--) {
    dp[a][b] = scriptChars[a].ch === stream[b].ch
      ? dp[a + 1][b + 1] + 1
      : Math.max(dp[a + 1][b], dp[a][b + 1]);
  }
}
const at = new Array(n).fill(null);      // script index -> stream entry, when anchored
let a = 0, b = 0;
while (a < n && b < m) {
  if (scriptChars[a].ch === stream[b].ch) { at[a] = stream[b]; a++; b++; }
  else if (dp[a + 1][b] >= dp[a][b + 1]) a++;
  else b++;
}
const anchored = at.filter(Boolean).length;

// Fill the gaps between anchors. Before the first and after the last, hold the nearest anchor's
// edge rather than inventing a span outside the take.
const spanOf = new Array(n);
for (let k = 0; k < n; k++) {
  if (at[k]) { spanOf[k] = {startMs: at[k].startMs, endMs: at[k].endMs}; continue; }
  let p = k - 1; while (p >= 0 && !at[p]) p--;
  let q = k + 1; while (q < n && !at[q]) q++;
  const from = p >= 0 ? at[p].endMs : (at[q] ? at[q].startMs : 0);
  const to = q < n ? at[q].startMs : (at[p] ? at[p].endMs : from);
  const gap = Math.max(0, to - from), slots = q - p;      // characters sharing this gap
  const idx = k - p;
  spanOf[k] = {
    startMs: Math.round(from + (gap * (idx - 1)) / slots),
    endMs: Math.round(from + (gap * idx) / slots),
  };
}

const sentences = lines.map((line, si) => {
  const words = line.split(/\s+/).filter(Boolean).map((w, wi) => {
    const mine = [];
    for (let k = 0; k < n; k++) if (scriptChars[k].si === si && scriptChars[k].wi === wi) mine.push(spanOf[k]);
    const startMs = mine.length ? mine[0].startMs : 0;
    const endMs = mine.length ? Math.max(startMs, mine[mine.length - 1].endMs) : startMs;
    return {text: w, startMs, endMs};
  });
  return {
    words,
    fromMs: words.length ? words[0].startMs : 0,
    toMs: words.length ? words[words.length - 1].endMs : 0,
  };
});
const drifted = n - anchored;

const out = outPath ?? capPath.replace(/\.json$/, '') + '.words.json';
fs.writeFileSync(out, JSON.stringify(sentences, null, 2));
const nWords = sentences.reduce((n, s) => n + s.words.length, 0);
console.log(`${out}: ${sentences.length} sentence(s), ${nWords} word(s) from ${stream.length} characters`);
console.log(`group-words: ${anchored}/${n} script character(s) anchored to the transcription`);
if (drifted) {
  console.warn(`group-words: ${drifted} character(s) had no anchor and were interpolated between`);
  console.warn('             the ones either side. Expect ~20-30% for zh: whisper.cpp drops that many');
  console.warn('             multi-byte characters to byte-split tokens. A much higher share means the');
  console.warn('             script and the take really have diverged — check the text, not the timings.');
}
