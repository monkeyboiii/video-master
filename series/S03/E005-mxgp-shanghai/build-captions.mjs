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

// Both these words aligned to a real zero-width span — whisper's raw stream (whisper-raw.json)
// has NO gap at all across 半个小时|那我们…世界冠军|骑|的: 时 ends 30760, 那 starts 30760, no
// anchor for "What" anywhere in between; 世界 runs a suspicious, unbroken 32230-33280 (1050ms,
// almost certainly 世界冠军骑 all swallowed into one token) then 的 starts clean at 33280, no
// anchor for 骑. There is no real signal to recover here — these are hand-set, wider than the
// first pass (which read as "too short, not well aligned" once actually watched), not derived.
//
// "What" (14:0) and 那 (15:0): measured, then re-measured, because "What" is genuinely quiet —
// the operator turned its volume down in this take (media/exports/S03E005-cn.MP4). Two probes:
//
// 1. `analyze-audio.sh` at -30dB/d=0.05 found silence 30629-30748, speech, silence 30866-31030
//    — the first "measured" pass, giving What 30748-30866 (118ms). Operator: still too short.
// 2. Re-checked at -25dB/d=0.03 (stricter — needs louder audio to NOT count as silence): the
//    same two gaps WIDEN to 30489-30770 and 30772-31042, nearly swallowing the ~2ms between them
//    entirely. That is What sitting right at the edge of the noise floor after the volume drop:
//    different thresholds give different answers because the word itself is quiet, not because
//    either threshold is wrong. Also tried re-transcribing just this window in isolation
//    (probe-what.sh) to sidestep the whole-file --lang=zh lock — WORSE, not better: forced zh
//    reproduces the same garbage as the full pass, forced en hallucinates the entire 5.49s clip
//    as one token, "What" 0-5490ms. Isolated re-transcription is not more trustworthy here.
//
// Given the two probes AGREE on the wider silence boundaries (30.49-30.77ish before, ending
// 31.03-31.04ish after) and disagree only on how much of the narrow quiet gap between them is
// "speech", the fix widens What to fill its full evidence-bounded gap rather than only the
// narrowest read — legible without claiming a precision the source audio does not have — and
// nudges 那 a touch past the stricter reading's 31042 for the margin the operator's "a few
// frames early" points at.
//
// No silence gap exists anywhere in 32000-34300 (continuous speech through 世界冠军骑的这台),
// at either threshold, so 15:5/15:6 below stay a guess — there is no acoustic evidence to place
// that split any better than this.
//
// "What" (14:0): SpokenSubtitleTrack.tsx caps the PREVIOUS sentence at
// `until = min(ownEnd, next[0].startMs)`, so moving this word's start earlier automatically
// shrinks sentence 13's display to match — it does not stack or overlap.
// 那 (15:0): its OWN start is the whole sentence's card-visibility start (`ws[0].startMs`), so
// this is the actual fix for "那我们再来看看 is too early" — endMs set equal since 我们 (15:1)
// already starts at 31030 too; giving 那 any real width would overlap it.
// 骑 (15:6): given its own slice by shortening 世界冠军 (15:5)'s tail — both are internal words
// in the same sentence/card, so this only moves the band highlight, no card-boundary risk.
const TIMING_OVERRIDES = {
  '14:0': {startMs: 30700, endMs: 30950},  // widened to the evidence bounds; was 30748-30866
  '15:0': {startMs: 31050, endMs: 31050},  // was 31030-31030, +20ms past the stricter reading
  '15:5': {startMs: 32230, endMs: 33080},  // still a guess — no silence gap to measure against
  '15:6': {startMs: 33080, endMs: 33280},  // still a guess — no silence gap to measure against
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
