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
// "What" (14:0) — VIDEO evidence, not audio: the operator said this should span when a meme/
// cutaway cuts into the picture, not when the word is audible (the take's "What" is quiet — the
// operator turned it down — so audio silencedetect kept giving inconsistent, threshold-dependent
// answers across two earlier passes; see git log for that dead end). `find-cut.sh` (next to this
// file) runs ffmpeg scene-change detection (`select='gt(scene,0.04)'`) over the whole export:
// a tight cluster at 30.233/30.267s (the cut IN) and a clean single cut at 30.8s (the cut back to
// camera) bound the cutaway.
//
// Went back and forth on What's start, twice:
// - pass 1: 30233 (the meme's cut-in). Operator: too early, and it made the FOLLOWING line early
//   too (see below).
// - pass 2 (reverting pass 1's own fix): 30629 — SpokenSubtitleTrack.tsx caps the PREVIOUS
//   sentence at `until = min(ownEnd, next[0].startMs)`, so starting What at 30233 also capped
//   sentence 13 to 30233 even though 半个小时 (13:11-12) is genuinely still being SAID until
//   ~30629 (the -30dB silencedetect gap, git log) — cutting a caption off before its speech
//   finishes. 30629 fixed that.
// - pass 3, here: operator watched again and asked for pass 1 back on purpose — What should
//   cover the meme's FULL on-screen window (30233-30800), not just its tail, even at the cost of
//   sentence 13 disappearing before 半个小时 finishes speaking. Confirmed explicitly rather than
//   assumed: pass 2's reasoning was sound on its own terms, but the operator has the actual
//   creative call on which matters more, caption-tracks-speech or caption-tracks-the-cutaway, and
//   picked the latter for this beat. 那's start (below) moves out to 31150 in the same pass so
//   What has more room at the far end too, not just the near one.
//
// 那 (15:0) — AUDIO evidence: `analyze-audio.sh` (-30dB then -25dB, see git log) puts real speech
// resuming at 31.03-31.04s regardless of threshold. Pushed a further ~100ms past that (31150) at
// the operator's explicit ask, alongside What's start moving back to 30233 — the caption now
// trails the audio onset slightly rather than leading it, which is the operator's call to make
// once they're watching the actual cut, not something silencedetect can tell either way. Its own
// start is the whole sentence's card-visibility start, so this is what actually moves 那我们's
// appearance — endMs set equal since 我们 (15:1) already starts there too.
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
  '14:0': {startMs: 30233, endMs: 31150}, // What: was 30629-31050; back to the meme's cut-in on
                                           // the operator's explicit call — see note above
  '15:0': {startMs: 31150, endMs: 31150}, // 那: was 31050-31050, pushed ~100ms later for What
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
