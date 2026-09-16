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

// Superseded 2026-09-16: every entry below (bar the two named exceptions) is now sourced from a
// Montreal Forced Aligner run against this episode's own audio, not whisper.cpp's token stream.
// whisper's per-word timestamps are a byproduct of ASR decoding — one timestamp pair per decoded
// TOKEN, which can span several script words or collapse a word to zero width when the token
// boundary and the script's word boundary disagree. That was the root cause of every class of bug
// this table used to work around by hand: a word with no anchor at all, a word absorbed into a
// wide neighbour, and two words sharing one token's identical span. MFA does real phone-level
// forced alignment against the audio instead, so none of those failure modes apply to its output.
//
// Method: script.txt's words fed to `mfa align` against the `mandarin_china_mfa` dictionary and
// `mandarin_mfa` acoustic model, `--no_tokenization` (the text is already word-segmented). Any
// script word not itself a dictionary entry (compounds like 世界冠军, 这玩意儿, numerals like
// 100多/180) was split into dictionary-covered sub-words before alignment and merged back to the
// script's own word boundaries afterward — MFA's sub-word boundary inside such a compound is
// finer than this table needs, only the outer start/end of the whole script word is kept. Spans
// cross-checked against independent ffmpeg `silencedetect` gaps on the same audio at several
// points (not against whisper) matched within 20-40ms.
//
// Two exceptions, kept OUT of the MFA table on purpose:
// - '14:0' (What) stays hand-tuned. MFA's pure-audio measurement for it is real but short
//   (~180ms) — it has no notion of the meme cutaway on screen, which is what this word's timing
//   was actually tuned against across several rounds this repo's git log carries. Audio-only
//   alignment answers a different question than "does this line up with the picture."
// - '15:0' (那) stays a deliberate zero-width card-boundary marker (its own start sets the
//   sentence's card-visibility start, per SpokenSubtitleTrack.tsx) — not a moment meant to be
//   seen on its own, so MFA's real measured span for it would be the wrong fix.
const TIMING_OVERRIDES = {
  '0:0': {startMs: 0, endMs: 730},
  '0:1': {startMs: 730, endMs: 930},
  '0:2': {startMs: 930, endMs: 1240},
  '0:3': {startMs: 1240, endMs: 1310},
  '0:4': {startMs: 1380, endMs: 1690},
  '0:5': {startMs: 1690, endMs: 2040},
  '0:6': {startMs: 2040, endMs: 2110},
  '0:7': {startMs: 2110, endMs: 2450},
  '1:0': {startMs: 2870, endMs: 3330},
  '1:1': {startMs: 3330, endMs: 3370},
  '1:2': {startMs: 3370, endMs: 3570},
  '1:3': {startMs: 3570, endMs: 3680},
  '1:4': {startMs: 3680, endMs: 4070},
  '1:5': {startMs: 4070, endMs: 4450},
  '1:6': {startMs: 4820, endMs: 5060},
  '1:7': {startMs: 5060, endMs: 5280},
  '1:8': {startMs: 5280, endMs: 5390},
  '1:9': {startMs: 5390, endMs: 5710},
  '1:10': {startMs: 5710, endMs: 5820},
  '1:11': {startMs: 5820, endMs: 6290},
  '2:0': {startMs: 6600, endMs: 6960},
  '2:1': {startMs: 6960, endMs: 7250},
  '2:2': {startMs: 7250, endMs: 7310},
  '3:0': {startMs: 7710, endMs: 7840},
  '3:1': {startMs: 7840, endMs: 8070},
  '3:2': {startMs: 8070, endMs: 8230},
  '3:3': {startMs: 8230, endMs: 8490},
  '3:4': {startMs: 8580, endMs: 8640},
  '4:0': {startMs: 8990, endMs: 9110},
  '4:1': {startMs: 9110, endMs: 9340},
  '4:2': {startMs: 9340, endMs: 9420},
  '4:3': {startMs: 9420, endMs: 9930},
  '4:4': {startMs: 9930, endMs: 10160},
  '4:5': {startMs: 10160, endMs: 10450},
  '4:6': {startMs: 10450, endMs: 10590},
  '4:7': {startMs: 10590, endMs: 10860},
  '4:8': {startMs: 10860, endMs: 10940},
  '4:9': {startMs: 10940, endMs: 11280},
  '4:10': {startMs: 11280, endMs: 11400},
  '5:0': {startMs: 11770, endMs: 11900},
  '5:1': {startMs: 11900, endMs: 12120},
  '5:2': {startMs: 12120, endMs: 12310},
  '5:3': {startMs: 12310, endMs: 12590},
  '6:0': {startMs: 13110, endMs: 13280},
  '6:1': {startMs: 13280, endMs: 13380},
  '6:2': {startMs: 13380, endMs: 13670},
  '6:3': {startMs: 13670, endMs: 13850},
  '6:4': {startMs: 13850, endMs: 14090},
  '7:0': {startMs: 14440, endMs: 14730},
  '7:1': {startMs: 14730, endMs: 14880},
  '7:2': {startMs: 14910, endMs: 14990},
  '7:3': {startMs: 14990, endMs: 15270},
  '7:4': {startMs: 15270, endMs: 15590},
  '7:5': {startMs: 15590, endMs: 16170},
  '7:6': {startMs: 16170, endMs: 16450},
  '7:7': {startMs: 16450, endMs: 16570},
  '7:8': {startMs: 16570, endMs: 16630},
  '7:9': {startMs: 16630, endMs: 17010},
  '8:0': {startMs: 17490, endMs: 17590},
  '8:1': {startMs: 17590, endMs: 18020},
  '8:2': {startMs: 18120, endMs: 18440},
  '8:3': {startMs: 18440, endMs: 18500},
  '8:4': {startMs: 18500, endMs: 18580},
  '8:5': {startMs: 18580, endMs: 18910},
  '9:0': {startMs: 19130, endMs: 19400},
  '9:1': {startMs: 19400, endMs: 19540},
  '9:2': {startMs: 19540, endMs: 19930},
  '9:3': {startMs: 19930, endMs: 20280},
  '9:4': {startMs: 20280, endMs: 20540},
  '9:5': {startMs: 20540, endMs: 20680},
  '9:6': {startMs: 20680, endMs: 21190},
  '9:7': {startMs: 21190, endMs: 21280},
  '9:8': {startMs: 21280, endMs: 21500},
  '10:0': {startMs: 21740, endMs: 21920},
  '10:1': {startMs: 21920, endMs: 22350},
  '10:2': {startMs: 22350, endMs: 22970},
  '10:3': {startMs: 22970, endMs: 23390},
  '11:0': {startMs: 23630, endMs: 23830},
  '11:1': {startMs: 23830, endMs: 23890},
  '11:2': {startMs: 23890, endMs: 24420},
  '11:3': {startMs: 24420, endMs: 24550},
  '11:4': {startMs: 24550, endMs: 24780},
  '11:5': {startMs: 24780, endMs: 25050},
  '11:6': {startMs: 25050, endMs: 25670},
  '11:7': {startMs: 25670, endMs: 25910},
  '12:0': {startMs: 26240, endMs: 26530},
  '12:1': {startMs: 26530, endMs: 26840},
  '13:0': {startMs: 27090, endMs: 27470},
  '13:1': {startMs: 27470, endMs: 27670},
  '13:2': {startMs: 27670, endMs: 27750},
  '13:3': {startMs: 27750, endMs: 27860},
  '13:4': {startMs: 27860, endMs: 28320},
  '13:5': {startMs: 28320, endMs: 28560},
  '13:6': {startMs: 28560, endMs: 28680},
  '13:7': {startMs: 28750, endMs: 29010},
  '13:8': {startMs: 29010, endMs: 29370},
  '13:9': {startMs: 29370, endMs: 29820},
  '13:10': {startMs: 29820, endMs: 30050},
  '13:11': {startMs: 30050, endMs: 30320},
  '13:12': {startMs: 30320, endMs: 30570},
  // '14:0' (What): NOT from MFA — see the exception note above.
  // '15:0' (那): NOT from MFA — intentionally zero-width, see INTENTIONALLY_ZERO_WIDTH below.
  '15:1': {startMs: 31960, endMs: 32140},
  '15:2': {startMs: 32140, endMs: 32250},
  '15:3': {startMs: 32250, endMs: 32330},
  '15:4': {startMs: 32330, endMs: 32660},
  '15:5': {startMs: 32660, endMs: 33330},
  '15:6': {startMs: 33330, endMs: 33510},
  '15:7': {startMs: 33510, endMs: 33600},
  '15:8': {startMs: 33600, endMs: 33980},
  '16:0': {startMs: 34280, endMs: 34730},
  '16:1': {startMs: 34730, endMs: 35250},
  '17:0': {startMs: 35770, endMs: 36180},
  '17:1': {startMs: 36180, endMs: 36470},
  '17:2': {startMs: 36470, endMs: 36610},
  '17:3': {startMs: 36610, endMs: 37420},
  '17:4': {startMs: 37420, endMs: 37480},
  '17:5': {startMs: 37480, endMs: 37920},
  '18:0': {startMs: 38340, endMs: 38550},
  '18:1': {startMs: 38550, endMs: 38700},
  '18:2': {startMs: 38700, endMs: 39010},
  '18:3': {startMs: 39260, endMs: 39400},
  '18:4': {startMs: 39400, endMs: 39650},
  '18:5': {startMs: 39650, endMs: 39710},
  '18:6': {startMs: 39710, endMs: 40070},
  '18:7': {startMs: 40070, endMs: 40210},
  '18:8': {startMs: 40250, endMs: 40400},
  '18:9': {startMs: 40400, endMs: 40480},
  '18:10': {startMs: 40620, endMs: 40960},
  '19:0': {startMs: 41240, endMs: 41360},
  '19:1': {startMs: 41360, endMs: 41540},
  '19:2': {startMs: 41540, endMs: 41730},
  '19:3': {startMs: 41730, endMs: 41830},
  '19:4': {startMs: 41830, endMs: 42180},
  '19:5': {startMs: 42180, endMs: 42430},
  '19:6': {startMs: 42430, endMs: 42490},
  '19:7': {startMs: 42490, endMs: 42580},
  '19:8': {startMs: 42580, endMs: 42630},
  '19:9': {startMs: 42630, endMs: 42710},
  '19:10': {startMs: 42710, endMs: 42990},
  '19:11': {startMs: 42990, endMs: 43350},
  '19:12': {startMs: 43350, endMs: 43510},
  '19:13': {startMs: 43510, endMs: 43750},
  '19:14': {startMs: 43800, endMs: 44020},
  '19:15': {startMs: 44020, endMs: 44220},
  // Hand-tuned, kept as-is (see the exception note above):
  '14:0': {startMs: 30760, endMs: 31650}, // What: audio-only MFA measures ~180ms; this is tuned
                                           // against the meme cutaway on screen, not the audio
  '15:0': {startMs: 31650, endMs: 31650}, // 那: deliberate card-boundary marker, not a measurement
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
