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
  '6:2',   // 真的
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
// 炸裂 (0:5), 卧槽 (1:5), 狠狠 (13:9), 骑 (15:6), 世界冠军 (15:5), 乱窜 (1:11), 壮汉 (13:8), 都
// (18:5), 挂 (19:12) — no measurable boundary either way (continuous speech, checked against the
// full-file silencedetect log): each given a modest real slice by shortening an adjacent
// neighbour rather than guessing a number from nothing. For 乱窜 and 壮汉 the neighbour to borrow
// from was obvious: 里 (1:10, single character) and 位 (within 多位, 13:7) both ran 580ms/860ms
// on their own in whisper's raw output — 3-4x a typical single character — the same
// absorbed-into-a-wide-token shape as 时/那 (git log) and 真/的 below, just without a second real
// word on the other side to reveal it as a drop; here it only shows up as an anomalous WIDTH.
// 都 and 挂 had no such tell (both flanking words had ordinary widths), so their slices are a
// smaller, more genuinely-arbitrary default. These are the ones the automated check below exists
// for — EVERY word needs enough width to have a frame for the ALWAYS-ON band to light on
// (captions.md: "the band always lights under the word being spoken, in both locales" — not just
// `*` words), or it's invisible and looks like a random rendering bug instead of what it actually
// is: a word nobody gave real estate to.
//
// A SECOND, DIFFERENT bug class, found scanning the whole document for it after 真的/是 turned
// up identical: whisper.cpp emits ONE timestamp pair per TOKEN, and a token can be several
// characters (真的是 arrived as one 560ms token). group-words gives every CHARACTER within that
// token the token's full span, unsplit — fine when the token maps to one script word, but when
// the script splits it across two or more words (真的 + 是 here), those words end up with
// IDENTICAL start/end, not sequential ones: two captions claiming the exact same time. Three
// instances found this way (9:7/9:8, 13:2/13:3, 17:1/17:2) — all fixed the same way, splitting
// the shared span proportionally by character count between the words that shared it.
const TIMING_OVERRIDES = {
  '9:7': {startMs: 21020, endMs: 21173},   // 的: was 21020-21480, identical to 时候 — split 1:2
  '9:8': {startMs: 21173, endMs: 21480},   // 时候: was 21020-21480, identical to 的
  '13:2': {startMs: 27690, endMs: 27940},  // 你: was 27690-28190, identical to 在 — split evenly
  '13:3': {startMs: 27940, endMs: 28190},  // 在: was 27690-28190, identical to 你
  '0:5': {startMs: 1960, endMs: 2160},    // 炸裂: was 1960-1960; borrowed from 的 (0:6)
  '0:6': {startMs: 2160, endMs: 2260},    // 的: was 1960-2260
  '1:5': {startMs: 4400, endMs: 4600},    // 卧槽: was 4400-4400; borrowed from 一群 (1:6)
  '1:6': {startMs: 4600, endMs: 4760},    // 一群: was 4400-4760
  '1:10': {startMs: 5660, endMs: 5990},   // 里: was 5660-6240 (580ms, 1 char — anomalously wide)
  '1:11': {startMs: 5990, endMs: 6240},   // 乱窜: was 6240-6240; borrowed from 里
  '13:7': {startMs: 28670, endMs: 29350}, // 多位: was 28670-29680 (位 alone ran 860ms — anomalous)
  '13:8': {startMs: 29350, endMs: 29680}, // 壮汉: was 29680-29680; borrowed from 多位
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
  '17:1': {startMs: 35940, endMs: 36313}, // 真的: was 35940-36500, identical to 是 — split 2:1
  '17:2': {startMs: 36313, endMs: 36500}, // 是: was 35940-36500, identical to 真的
  '18:5': {startMs: 39630, endMs: 39780}, // 都: was 39630-39630; borrowed from 完全 (18:6)
  '18:6': {startMs: 39780, endMs: 39940}, // 完全: was 39630-39940 — 都 borrows from this side,
                                           // not 那儿 (18:4), which is unchanged
  '19:12': {startMs: 43210, endMs: 43360}, // 挂: was 43210-43210; borrowed from 一台 (19:13)
  '19:13': {startMs: 43360, endMs: 43520}, // 一台: was 43210-43520 — 挂 borrows from this side,
                                            // not 墙上 (19:11), which is unchanged
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
// Two more bugs this session actually shipped, both checked against the FINAL (post-override)
// span, not the raw alignment:
//
// 1. ANY word (not just an EMPHASIS one) with zero final duration has no frame for the
//    ALWAYS-ON band to light on — captions.md: "the band always lights under the word being
//    spoken, in both locales", not just `*` words. An emphasised zero-width word loses its
//    text-lighting too, which is worse, so that case still warns louder.
// 2. Two consecutive words sharing an IDENTICAL final start AND end. whisper.cpp timestamps a
//    TOKEN, not a character, and group-words gives every character within one token the same
//    span; if the script splits that token across two words, both inherit the same span
//    unless a TIMING_OVERRIDE splits it — found three real instances by scanning for exactly
//    this shape (9:7/9:8, 13:2/13:3, 17:1/17:2).
// 15:0 (那) is deliberately zero-width — it's a card-boundary marker (its own start sets the
// sentence's card-visibility start, per SpokenSubtitleTrack.tsx), not a moment meant to be seen
// on its own; 我们 (15:1) starts at the same instant. Exempted so the check below stays a signal,
// not noise — a warning that fires on every correct run trains people to stop reading it (O47).
const INTENTIONALLY_ZERO_WIDTH = new Set(['15:0']);

words.forEach((s, si) => {
  s.words.forEach((w, wi) => {
    const key = `${si}:${wi}`;
    const {startMs, endMs} = TIMING_OVERRIDES[key] ?? w;
    if (endMs <= startMs && !INTENTIONALLY_ZERO_WIDTH.has(key)) {
      const loud = EMPHASIS.has(key) ? ' (EMPHASIS — text-lighting lost too)' : '';
      console.warn(`build-captions: ${key} (${w.text}) has zero final duration — its band will not render${loud}`);
    }
    const next = s.words[wi + 1];
    if (next) {
      const nextKey = `${si}:${wi + 1}`;
      const nb = TIMING_OVERRIDES[nextKey] ?? next;
      if (nb.startMs === startMs && nb.endMs === endMs) {
        console.warn(`build-captions: ${key} (${w.text}) and ${nextKey} (${next.text}) share an identical span ${startMs}-${endMs} — likely one whisper token split across two script words without a TIMING_OVERRIDE to divide it`);
      }
    }
  });
});
