#!/usr/bin/env node
// Transcribe a cut's audio to Caption[] with whisper.cpp, locally.
//
// Usage: node tools/transcribe.mjs <media> [out.json] [--model=<name>] [--lang=<code>]
//
// WHY LOCAL. No per-minute cost and unreleased footage never leaves the box; `toCaptions()`
// hands @remotion/captions its Caption shape directly. The cost is a model download and CPU.
//
// WHY A MULTILINGUAL MODEL. Remotion's example uses `medium.en`, which is English-only and wrong
// here: this repo ships en-US and zh-CN as sibling variants (agents.d/modules/localization.md).
// Default is `large-v3` — for Chinese, model size dominates accuracy far more than it does for
// English, and `medium` is the floor rather than the target.
//
// WHY --dtw IS NOT OPTIONAL. `tokenLevelTimestamps: true` passes `--dtw` to whisper.cpp, which
// aligns by Dynamic Time Warping and returns `t_dtw` instead of the decoder's heuristic guess.
// That is the accuracy WhisperX is usually reached for, and whisper.cpp has it natively. It needs
// whisper.cpp >= 1.5.5 and a model with alignment heads.
//
// FOR zh-CN THIS IS PER-CHARACTER, WHICH IS WHAT YOU WANT. Chinese has no spaces, so "per word"
// is not a thing the audio gives you. Whisper's Chinese tokens are one or two characters, so DTW
// timestamps land per character — finer than word-level, and the granularity Chinese karaoke
// captions actually highlight at. `splitOnWord` is for space-delimited languages; leave it off
// for zh.
//
// The 16 kHz mono WAV conversion is not optional — whisper.cpp reads nothing else — so this does
// it rather than leaving a trap for the caller.
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { downloadWhisperModel, installWhisperCpp, transcribe, toCaptions } from '@remotion/install-whisper-cpp';

const WHISPER_VERSION = '1.5.5';
const args = process.argv.slice(2);
const flag = (n, d) => args.find((a) => a.startsWith(`--${n}=`))?.split('=')[1] ?? d;
const positional = args.filter((a) => !a.startsWith('--'));
const [src, outArg] = positional;
if (!src) {
  console.error('Usage: node tools/transcribe.mjs <media> [out.json] [--model=medium] [--lang=auto]');
  process.exit(1);
}
const model = flag('model', 'large-v3');
// Explicit beats auto: on a short clip whisper's language detection flips zh to ja or yue and
// the whole take comes back in the wrong script.
const lang = flag('lang', 'auto');
if (lang === 'auto') console.warn('transcribe: --lang=auto — pass --lang=zh or --lang=en; detection flips on short clips');
const out = outArg ?? src.replace(/\.[^.]+$/, '') + '.captions.json';
// Kept beside the repo, not inside it: the binary and the models are per-box and large.
const whisperPath = process.env.DBX_WHISPER_DIR ?? path.join(os.homedir(), '.cache', 'whisper.cpp');

// whisper.cpp emits BYTE-level tokens, so a multi-byte character arrives split across two of them
// and its bytes are ALREADY LOST — whisper.cpp's own JSON contains U+FFFD, before any JavaScript
// touches it. Measured on a 26 s zh-CN take with large-v3: 50 of 170 raw tokens (30%). Nothing
// downstream can recover them; concatenating two replacement characters yields two replacement
// characters, not the glyph.
//
// So the fragments are dropped and their TIME is folded into the previous caption, which keeps the
// timeline continuous and never ships half a glyph into a burn-in. What it means for zh-CN is that
// this file produces trustworthy TIMINGS and untrustworthy TEXT, which is why the text has to come
// from the script — see agents.d/modules/captions.md § The script is known, so ASR output is a
// draft. English is unaffected: its tokens are whole.
function dropSplitCharacters(captions) {
  const broken = (t) => t.includes('\uFFFD');
  const out = [];
  let dropped = 0;
  for (const c of captions) {
    if (!broken(c.text)) { out.push({ ...c }); continue; }
    dropped++;
    if (out.length) out[out.length - 1].endMs = c.endMs;   // keep the span, lose the fragment
  }
  return { captions: out, dropped };
}

const wav = path.join(os.tmpdir(), `dbx-16k-${process.pid}.wav`);
const conv = spawnSync('ffmpeg', ['-y', '-v', 'error', '-i', src, '-ar', '16000', '-ac', '1', wav]);
if (conv.status !== 0) {
  console.error('ffmpeg could not produce a 16 kHz mono WAV:', conv.stderr?.toString().trim());
  process.exit(1);
}

await installWhisperCpp({ to: whisperPath, version: WHISPER_VERSION });
await downloadWhisperModel({ model, folder: whisperPath });

const whisperCppOutput = await transcribe({
  model, whisperPath, whisperCppVersion: WHISPER_VERSION,
  inputPath: wav,
  tokenLevelTimestamps: true,   // --dtw; incompatible with tokensPerItem, so that is never set here
  ...(lang === 'auto' ? {} : { language: lang }),
});

const raw = toCaptions({ whisperCppOutput }).captions;
const { captions, dropped } = dropSplitCharacters(raw);
if (dropped) {
  const pct = Math.round((100 * dropped) / raw.length);
  console.warn(`transcribe: dropped ${dropped}/${raw.length} (${pct}%) byte-split tokens — normal for zh/ja/ko.`);
  console.warn('transcribe: TIMINGS are usable, TEXT is not. Reconcile against the script.');
}
fs.writeFileSync(out, JSON.stringify(captions, null, 2));
fs.rmSync(wav, { force: true });
console.log(`${out}: ${captions.length} caption(s) from ${path.basename(src)} [model=${model}]`);
