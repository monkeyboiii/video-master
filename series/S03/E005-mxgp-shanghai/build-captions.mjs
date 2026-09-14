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
const EMPHASIS = new Set([
  '0:5',   // 炸裂
  '1:5', '1:13',   // 卧槽 / 精实
  '3:7',   // 耐力
  '5:2',   // 真
  '6:0', '6:4',   // 蛋蛋 / 100多
  '7:5',   // 两秒
  '8:4',   // 唯一
  '9:2',   // 30多
  '10:6',  // 180
  '12:9',  // 狠狠
  '13:0',  // What
  '14:5',  // 世界冠军
  '15:0', '15:1',  // 本田 / 450
  '16:5',  // 艺术品
  '17:6',  // 完全
  '18:14', // 可能
]);

const sentenceRows = words.map((s, si) =>
  s.words.map((w, wi) => {
    const star = EMPHASIS.has(`${si}:${wi}`) ? '|*' : '';
    return `${w.text}|${w.startMs}|${w.endMs}${star}`;
  }).join('\n')
);
const script = sentenceRows.join('\n\n');

const durationSec = Math.max(...words.map((s) => s.toMs)) / 1000;

const out = {
  locale: 'zh-CN',
  durationSec: Math.round(durationSec * 100) / 100,
  script,
};
const outPath = path.join(HERE, 'remotion-props', 'spoken-captions.zh-CN.json');
fs.mkdirSync(path.dirname(outPath), {recursive: true});
fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n');
console.log(`${outPath}: ${words.length} sentence(s), durationSec=${out.durationSec}`);

// Sanity: every EMPHASIS key must have actually hit a real word — a stale index after any
// re-segmentation would otherwise mark nothing and light silently fewer words than intended.
const seen = new Set();
words.forEach((s, si) => s.words.forEach((w, wi) => seen.add(`${si}:${wi}`)));
for (const k of EMPHASIS) if (!seen.has(k)) console.warn(`build-captions: EMPHASIS key ${k} has no matching word`);
