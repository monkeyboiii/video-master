#!/usr/bin/env node
// Diagnostic: same LCS alignment as tools/group-words.mjs, but reports per WORD whether its
// characters are real whisper anchors or interpolated across a gap, and how large that gap's
// run is — to test whether "early"/drifted words correlate with low anchor density (a big run
// of unanchored characters between two real anchors, proportionally interpolated across all of
// them, which is wrong wherever real speech isn't evenly paced within the run).
import fs from 'node:fs';

const [capPath, scriptPath] = process.argv.slice(2);
const caps = JSON.parse(fs.readFileSync(capPath, 'utf8'));
const lines = fs.readFileSync(scriptPath, 'utf8').split('\n').map((l) => l.trim()).filter(Boolean);

const stream = [];
for (const c of caps) {
  const chars = [...String(c.text)].filter((ch) => ch.trim() !== '');
  for (const ch of chars) stream.push({ch, startMs: c.startMs, endMs: c.endMs});
}

const scriptChars = [];
lines.forEach((line, si) => {
  line.split(/\s+/).filter(Boolean).forEach((w, wi) => {
    for (const ch of [...w].filter((c) => c.trim() !== '')) scriptChars.push({ch, si, wi, word: w});
  });
});

const n = scriptChars.length, m = stream.length;
const dp = Array.from({length: n + 1}, () => new Uint16Array(m + 1));
for (let a = n - 1; a >= 0; a--) {
  for (let b = m - 1; b >= 0; b--) {
    dp[a][b] = scriptChars[a].ch === stream[b].ch
      ? dp[a + 1][b + 1] + 1
      : Math.max(dp[a + 1][b], dp[a][b + 1]);
  }
}
const at = new Array(n).fill(null);
let a = 0, b = 0;
while (a < n && b < m) {
  if (scriptChars[a].ch === stream[b].ch) { at[a] = stream[b]; a++; b++; }
  else if (dp[a + 1][b] >= dp[a][b + 1]) a++;
  else b++;
}

// Per-word: how many of its characters are real anchors, and the size (in characters) of the
// interpolation run each unanchored character sits inside.
const words = new Map(); // "si:wi" -> {word, total, anchored, maxRun}
for (let k = 0; k < n; k++) {
  const key = `${scriptChars[k].si}:${scriptChars[k].wi}`;
  if (!words.has(key)) words.set(key, {word: scriptChars[k].word, total: 0, anchored: 0, runStart: null});
  const w = words.get(key);
  w.total++;
  if (at[k]) w.anchored++;
}

// Compute run lengths: a maximal stretch of consecutive unanchored characters.
let runLen = 0;
const runOf = new Array(n).fill(0);
for (let k = 0; k < n; k++) {
  if (!at[k]) { runLen++; }
  else {
    for (let j = k - runLen; j < k; j++) runOf[j] = runLen;
    runLen = 0;
  }
}
if (runLen > 0) for (let j = n - runLen; j < n; j++) runOf[j] = runLen;

const maxRunPerWord = new Map();
for (let k = 0; k < n; k++) {
  const key = `${scriptChars[k].si}:${scriptChars[k].wi}`;
  maxRunPerWord.set(key, Math.max(maxRunPerWord.get(key) ?? 0, runOf[k]));
}

const rows = [...words.entries()].map(([key, w]) => ({
  key, word: w.word, chars: w.total, anchored: w.anchored,
  maxRun: maxRunPerWord.get(key) ?? 0,
}));
console.log(JSON.stringify(rows, null, 2));
