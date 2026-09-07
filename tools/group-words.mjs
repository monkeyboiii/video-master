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

let i = 0;
let drifted = 0;
const sentences = lines.map((line) => {
  const words = line.split(/\s+/).filter(Boolean).map((w) => {
    const want = [...w].filter((ch) => ch.trim() !== '');
    const from = i;
    for (const ch of want) {
      // tolerate a mismatch rather than desync the whole line: skip at most a few stream
      // characters looking for this one, then take the position anyway
      let look = i, hops = 0;
      while (look < stream.length && stream[look].ch !== ch && hops < 3) { look++; hops++; }
      if (look < stream.length && stream[look].ch === ch) i = look + 1;
      else { i += 1; drifted++; }
    }
    const span = stream.slice(from, i).filter(Boolean);
    const startMs = span.length ? span[0].startMs : 0;
    const endMs = span.length ? span[span.length - 1].endMs : startMs;
    return {text: w, startMs, endMs};
  });
  return {
    words,
    fromMs: words.length ? words[0].startMs : 0,
    toMs: words.length ? words[words.length - 1].endMs : 0,
  };
});

const out = outPath ?? capPath.replace(/\.json$/, '') + '.words.json';
fs.writeFileSync(out, JSON.stringify(sentences, null, 2));
const nWords = sentences.reduce((n, s) => n + s.words.length, 0);
console.log(`${out}: ${sentences.length} sentence(s), ${nWords} word(s) from ${stream.length} characters`);
if (drifted) {
  console.warn(`group-words: ${drifted} character(s) did not match the transcription — the script and`);
  console.warn('             the take have diverged; timings near those words are approximate.');
}
