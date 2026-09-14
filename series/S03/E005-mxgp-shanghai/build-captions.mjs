#!/usr/bin/env node
// One-off: turn words.json (tools/group-words.mjs's output) into the pipe-delimited
// Caption[] script string agents.d/modules/captions.md / /video-captions describe, marking
// this episode's chosen emphasis words with `*`. Run from this directory, AFTER
// run-transcribe.sh has produced words.json on the Mac and it's been pulled back
// (`dbx mac pull video-master series/S03/E005-mxgp-shanghai/words.json`, then copy from
// .dbx/mac/video-master/ into this directory — words.json itself is not committed):
//   node build-captions.mjs
import fs from 'node:fs';
import path from 'node:path';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const words = JSON.parse(fs.readFileSync(path.join(HERE, 'words.json'), 'utf8'));

// (sentence index, word index) -> emphasised, chosen against script.txt's own word order.
// captions.md: "spend it two or three times a sentence, not on every noun."
// Reindexed when script.txt line 1 split into two (乱窜 | 花样精实透) and line 6 gained 一台.
const EMPHASIS = new Set([
  '0:5',   // 炸裂
  '1:5',   // 卧槽
  '2:1',   // 精实
  '4:7',   // 耐力
  '6:2',   // 真
  '7:0', '7:5',   // 蛋蛋 / 100多
  '8:5',   // 两秒
  '9:4',   // 唯一
  '10:2',  // 30多
  '11:6',  // 180
  '13:9',  // 狠狠
  '14:0',  // What
  '15:5',  // 世界冠军
  '16:0', '16:1',  // 本田 / 450
  '17:5',  // 艺术品
  '18:6',  // 完全
  '19:14', // 可能
]);

// v3: the operator's final pick, emoji only (word 7:0, was text 蛋蛋 — see script.zh-CN.md's
// note). v1 (text) and v2 (first emoji pass) are retired; this is the one saved to mac-rev.
const TEXT_OVERRIDES = {
  v3: {'7:0': '🥚'},
};

// Every zero-width word below aligned to a real zero-width span from group-words — either no
// anchor exists for it at all (whisper's raw stream has no gap between the words around it), or
// it's swallowed inside a neighbour's suspiciously wide token. None of these are group-words
// bugs; they're honest reports of a boundary the alignment could not find. Fixed by two
// different kinds of evidence, in order of how much trust each deserves:
//
// "What" (14:0) and the 13/14/15 boundary generally — four passes on this one beat; git log
// carries the earlier three (measured audio, meme cut-in vs cut-out, a "cut the previous line
// short" pass). Each one traded sentence 13's completeness against What's coverage against 那's
// lead time — because each pass tried to fit all three into the TIGHT window the actual measured
// evidence bounds (silence gaps, scene cuts), and that window is short. The operator's actual
// instruction, once said plainly: stop fitting three things into a tight measured window: give
// EACH of sentence 13, What, and the gap before 那 a genuinely comfortable length, sequentially,
// and let 那's arrival move out to wherever that lands. Loose and generous on purpose here, not
// measured — the precision this segment doesn't have was the whole problem with passes 1-3.
//
// So: sentence 13 keeps its own ORIGINAL, uncapped end (30760 — 小时's own group-words value,
// never touched) instead of being capped early by What's start. What starts there (30760) and
// runs a full 640ms — past both the meme's measured cut-in (30233, already gone by this point)
// and its cut-out (30800), comfortably covering the whole beat rather than chasing either edge.
// 那 moves out to 31400 to match, later than every prior pass, on purpose.
//
// SpokenSubtitleTrack.tsx caps the PREVIOUS sentence at `until = min(ownEnd, next[0].startMs)`
// and the CURRENT one the same way against the sentence after it — so sentence 13 no longer being
// capped early, and What no longer being squeezed against 那's old (earlier) start, both fall out
// of the same two numbers below; nothing else needed changing.
//
// 炸裂 (0:5), 卧槽 (1:5), 狠狠 (13:9), 骑 (15:6), 世界冠军 (15:5) — no measurable boundary either
// way (continuous speech through all five, checked against the full-file silencedetect log): each
// given a modest real slice by shortening an adjacent LOW-information neighbour (a bare function
// word or a word that isn't itself emphasised) rather than guessing a number from nothing. These
// are the ones the automated check below exists for — EVERY `*` word needs enough width to have a
// frame to light on, or the emphasis is invisible and looks like a random rendering bug instead of
// what it actually is: a word nobody gave real estate to.
const TIMING_OVERRIDES = {
  '0:5': {startMs: 1960, endMs: 2160},    // 炸裂: was 1960-1960; borrowed from 的 (0:6)
  '0:6': {startMs: 2160, endMs: 2260},    // 的: was 1960-2260
  '1:5': {startMs: 4400, endMs: 4600},    // 卧槽: was 4400-4400; borrowed from 一群 (1:6)
  '1:6': {startMs: 4600, endMs: 4760},    // 一群: was 4400-4760
  '13:9': {startMs: 29680, endMs: 29880}, // 狠狠: was 29680-29680; borrowed from 跟着 (13:10)
  '13:10': {startMs: 29880, endMs: 30040}, // 跟着: was 29680-30040
  // endMs extended to 那's own start (31050), not the meme's own cut-out (30800): closing the
  // 250ms blank gap that would otherwise sit between them with nothing rendered. This keeps
  // What's band LIT the whole time (a longer highlight, not a tail) — captions.md's "no tail"
  // rule is specifically about a line held with NOTHING lit; a longer lit duration doesn't
  // trigger the artefact that rule exists to prevent. Operator confirmed: fix the gap, don't
  // reopen the tail question.
  '14:0': {startMs: 30760, endMs: 31650}, // What: was 30760-31400, +250ms — still reading as
                                           // starting early once watched; more room again
  '15:0': {startMs: 31650, endMs: 31650}, // 那: was 31400-31400, moved out to match
  '15:5': {startMs: 32230, endMs: 33080}, // 世界冠军: was 32230-33280; borrowed from 骑 (15:6)
  '15:6': {startMs: 33080, endMs: 33280}, // 骑: was 33280-33280
};

const durationSec = Math.max(...words.map((s) => s.toMs)) / 1000;

for (const [ver, overrides] of Object.entries(TEXT_OVERRIDES)) {
  const sentenceRows = words.map((s, si) =>
    s.words.map((w, wi) => {
      const key = `${si}:${wi}`;
      const text = overrides[key] ?? w.text;
      const {startMs, endMs} = TIMING_OVERRIDES[key] ?? w;
      const star = EMPHASIS.has(key) ? '|*' : '';
      return `${text}|${startMs}|${endMs}${star}`;
    }).join('\n')
  );
  const script = sentenceRows.join('\n\n');
  const out = {
    locale: 'zh-CN',
    durationSec: Math.round(durationSec * 100) / 100,
    script,
  };
  const outPath = path.join(HERE, 'remotion-props', `spoken-captions.zh-CN.${ver}.json`);
  fs.mkdirSync(path.dirname(outPath), {recursive: true});
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n');
  console.log(`${outPath}: ${words.length} sentence(s), durationSec=${out.durationSec}`);
}

// Sanity: every EMPHASIS key must have actually hit a real word — a stale index after any
// re-segmentation would otherwise mark nothing and light silently fewer words than intended.
const seen = new Set();
words.forEach((s, si) => s.words.forEach((w, wi) => seen.add(`${si}:${wi}`)));
for (const k of EMPHASIS) if (!seen.has(k)) console.warn(`build-captions: EMPHASIS key ${k} has no matching word`);
for (const [ver, overrides] of Object.entries(TEXT_OVERRIDES)) {
  for (const k of Object.keys(overrides)) {
    if (!seen.has(k)) console.warn(`build-captions: TEXT_OVERRIDES[${ver}] key ${k} has no matching word`);
  }
}
for (const k of Object.keys(TIMING_OVERRIDES)) {
  if (!seen.has(k)) console.warn(`build-captions: TIMING_OVERRIDES key ${k} has no matching word`);
}
// The bug this session actually shipped: an emphasised word with zero final duration has no
// frame to light its band on, so the `*` silently does nothing — reads as a random rendering
// bug, not what it is. Check the FINAL (post-override) span, not the raw alignment.
for (const k of EMPHASIS) {
  const [si, wi] = k.split(':').map(Number);
  const w = words[si]?.words[wi];
  if (!w) continue;
  const {startMs, endMs} = TIMING_OVERRIDES[k] ?? w;
  if (endMs <= startMs) console.warn(`build-captions: EMPHASIS key ${k} (${w.text}) has zero final duration — its highlight will not render`);
}
