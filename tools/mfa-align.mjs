#!/usr/bin/env node
// Force-align a script against its own audio with Montreal Forced Aligner (MFA), producing the
// same per-word shape group-words.mjs writes.
//
// Usage: node tools/mfa-align.mjs <audio> <script.txt> <out.json> [--locale zh-CN]
//
// WHY THIS IS THE REQUIRED WORD-TIMING STEP, NOT group-words.mjs. whisper.cpp's timestamps are a
// byproduct of ASR decoding — one pair per decoded TOKEN, which can span several script words or
// collapse a word to zero width when the token boundary and the script's word boundary disagree.
// group-words.mjs reconciles two independent text segmentations (the script's words against
// whisper's character stream) and interpolates the gaps; it cannot manufacture a real boundary
// where whisper's tokens never drew one. That produced three documented bug classes on S03E005 —
// a word with no anchor, a word absorbed into a wide neighbour, two words sharing one token's
// span — all fixed by hand, expensively, before this tool existed.
//
// MFA does real phone-level forced alignment against the AUDIO instead, so none of those classes
// apply to its output: it always finds a boundary, because it is measuring one, not inferring one
// from a second transcription. Validated on S03E005, 2026-09-16: every previously zero-duration or
// shared-token word got a real, independently measured span, several cross-checked against
// ffmpeg silencedetect gaps on the same audio to within 20-40ms, and the two words with NO
// whisper anchor at all (世界冠军, 艺术品) got real numbers for the first time.
//
// whisper.cpp still has a job: producing the TEXT when no script exists yet. MFA aligns a script
// you already have against the audio; it does not transcribe. Once a script exists (by hand or
// via tools/transcribe.mjs + a read-through), this tool replaces group-words.mjs for timing.
//
// PREREQUISITES, one-time setup — see infra:agents.d/modules/layout.md's image-store escape hatch
// for why a SECOND docker/containerd pair, not the box's real one, on a disk-constrained shared
// box (skip the scratch pair and use the box's real docker if it has room):
//   docker [--host <MFA_DOCKER_HOST>] pull mmcauliffe/montreal-forced-aligner
//   docker [--host <MFA_DOCKER_HOST>] run --rm -v <MFA_HOME>:/mfa \
//     mmcauliffe/montreal-forced-aligner bash -c \
//     "mfa model download acoustic mandarin_mfa && mfa model download dictionary mandarin_china_mfa"
// Point this tool at them with env vars (both optional; defaults match the box's own docker):
//   MFA_DOCKER_HOST   docker --host value, e.g. unix:///run/dbx-scratch/docker.sock
//   MFA_HOME          the <MFA_HOME> above (default: ~/.cache/mfa-home)
//   MFA_ACOUSTIC      acoustic model name (default: mandarin_mfa)
//   MFA_DICTIONARY    dictionary name (default: mandarin_china_mfa — mainland pronunciation;
//                     mandarin_taiwan_mfa is the other shipped option)
//
// SCRIPT FORMAT. Exactly group-words.mjs's own input: one sentence per line, words
// space-separated. A script word that is not itself a dictionary entry (a compound like
// 世界冠军, a colloquialism like 这玩意儿, a digit run like "180") is split into
// dictionary-covered sub-words before alignment (greedy longest-match; digit runs are spelled out
// as Chinese numeral characters first). The split is undone after alignment — only the OUTER
// start/end of each ORIGINAL script word is kept, so nothing downstream ever sees the sub-word
// boundary. A word that still cannot be resolved (no dictionary entry for any character in it,
// e.g. an English interjection like "What") is left as literal text for MFA's dictionary to
// resolve itself if it can, or reported as OOV in this tool's own warning if it can't — those
// words need a human check same as before this tool existed; MFA does not fix content whisper
// mistranscribed, only timing for content that is correctly transcribed.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

const [audioPath, scriptPath, outPath, ...rest] = process.argv.slice(2);
if (!audioPath || !scriptPath || !outPath) {
  console.error('Usage: node tools/mfa-align.mjs <audio> <script.txt> <out.json> [--locale zh-CN]');
  process.exit(1);
}
const localeArg = rest.find((a) => a.startsWith('--locale='));
const locale = localeArg ? localeArg.split('=')[1] : 'zh-CN';
if (locale !== 'zh-CN') {
  console.error(`mfa-align: only zh-CN is wired up today (got ${locale}) — mandarin_china_mfa is the only dictionary this tool spells numerals for`);
  process.exit(1);
}

const DOCKER_HOST = process.env.MFA_DOCKER_HOST || '';
const MFA_HOME = process.env.MFA_HOME || path.join(os.homedir(), '.cache', 'mfa-home');
const ACOUSTIC = process.env.MFA_ACOUSTIC || 'mandarin_mfa';
const DICTIONARY = process.env.MFA_DICTIONARY || 'mandarin_china_mfa';

const dockerArgs = (...args) => (DOCKER_HOST ? ['--host', DOCKER_HOST, ...args] : args);
const docker = (...args) => spawnSync('docker', dockerArgs(...args), { encoding: 'utf8' });
const dockerOrDie = (...args) => {
  const r = docker(...args);
  if (r.status !== 0) {
    console.error(`mfa-align: docker ${args.join(' ')} failed:\n${r.stderr || r.stdout}`);
    process.exit(1);
  }
  return r;
};

const dictPath = path.join(MFA_HOME, 'pretrained_models', 'dictionary', `${DICTIONARY}.dict`);
if (!fs.existsSync(dictPath)) {
  console.error(`mfa-align: no dictionary at ${dictPath} — run the one-time model download (see this file's header) with MFA_HOME=${MFA_HOME}`);
  process.exit(1);
}

// --- dictionary + OOV handling -------------------------------------------------------------
const entries = new Set();
for (const line of fs.readFileSync(dictPath, 'utf8').split('\n')) {
  const w = line.split('\t')[0];
  if (w) entries.add(w);
}

const CN_DIGIT = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
const CN_UNIT = ['', '十', '百', '千'];
// Standard Chinese reading for 0-9999: place-value decomposition, 零 for an internal skipped
// place, and the leading 一 before 十 dropped only when 十 is the number's own first digit
// (18 -> 十八, but 118 -> 一百一十八). Anything outside this range falls back to spelling each
// digit individually — wrong for how it would actually be read, but a visible, checkable wrong
// rather than a crash; numbers this large are not expected caption content.
const numberToChinese = (nStr) => {
  const n = parseInt(nStr, 10);
  if (n === 0) return '零';
  if (!(n > 0 && n <= 9999)) return nStr.split('').map((d) => CN_DIGIT[+d] || d).join('');
  const digits = String(n).split('').map(Number);
  const len = digits.length;
  let out = '';
  let zeroPending = false;
  digits.forEach((d, i) => {
    const place = len - i - 1;
    if (d === 0) { zeroPending = true; return; }
    if (zeroPending && out !== '') out += '零';
    zeroPending = false;
    out += (d === 1 && place === 1 && i === 0) ? CN_UNIT[1] : CN_DIGIT[d] + CN_UNIT[place];
  });
  return out;
};

// Longest dictionary-covered chunk first; a character with no entry at all (rare — an English
// word not in the loanword list, e.g.) is kept as its own bare, likely-OOV chunk rather than
// dropped, so the caller's warning below can report it instead of silently losing the word.
const greedySplit = (word) => {
  const out = [];
  let i = 0;
  while (i < word.length) {
    let matched = false;
    for (let j = word.length; j > i; j--) {
      const chunk = word.slice(i, j);
      if (entries.has(chunk)) { out.push(chunk); i = j; matched = true; break; }
    }
    if (!matched) { out.push(word[i]); i += 1; }
  }
  return out;
};

const subWordsFor = (word) => {
  if (entries.has(word)) return [word];
  const digitMatch = word.match(/^(\d+)(.*)$/);
  if (digitMatch) {
    const [, digits, rest] = digitMatch;
    const spelled = numberToChinese(digits);
    return rest ? [...greedySplit(spelled), ...subWordsFor(rest)] : greedySplit(spelled);
  }
  if (/^[a-zA-Z]+$/.test(word)) return [word.toLowerCase()]; // dictionary carries some loanwords lowercase
  return greedySplit(word);
};

// --- build the corpus -----------------------------------------------------------------------
const sentences = fs.readFileSync(scriptPath, 'utf8')
  .split('\n').map((l) => l.trim()).filter(Boolean).map((l) => l.split(/\s+/));

const mapping = []; // {si, wi, word, subWords[]}
const flatSubWords = [];
sentences.forEach((words, si) => {
  words.forEach((word, wi) => {
    const subWords = subWordsFor(word);
    mapping.push({ si, wi, word, subWords });
    flatSubWords.push(...subWords);
  });
});

const stillOov = flatSubWords.filter((w) => !entries.has(w));
if (stillOov.length) {
  console.warn(`mfa-align: ${stillOov.length} sub-word(s) not in ${DICTIONARY} even after splitting — MFA will error or silently misalign these, check by hand: ${[...new Set(stillOov)].join(', ')}`);
}

const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mfa-align-'));
const corpusDir = path.join(workDir, 'corpus');
const outDir = path.join(workDir, 'out');
fs.mkdirSync(corpusDir, { recursive: true });
fs.mkdirSync(outDir, { recursive: true });
// The container writes as its own internal user (not this process's uid), and the mode above is
// masked by this process's umask before mkdir even sees it — chmod afterward to actually force it.
fs.chmodSync(outDir, 0o777);

execFileSync('ffmpeg', ['-y', '-i', audioPath, '-ar', '16000', '-ac', '1', '-vn', path.join(corpusDir, 'audio.wav')], { stdio: 'inherit' });
fs.writeFileSync(path.join(corpusDir, 'audio.lab'), flatSubWords.join(' '));

// --- align ------------------------------------------------------------------------------------
dockerOrDie('run', '--rm',
  '-v', `${MFA_HOME}:/mfa`, '-v', `${corpusDir}:/corpus`, '-v', `${outDir}:/out`,
  'mmcauliffe/montreal-forced-aligner',
  'mfa', 'align', '/corpus', DICTIONARY, ACOUSTIC, '/out', '--clean', '--no_tokenization');

// --- parse the TextGrid and re-group sub-words back to script.txt's own word boundaries -------
const tgText = fs.readFileSync(path.join(outDir, 'audio.TextGrid'), 'utf8');
const wordsTier = tgText.match(/name = "words".*?(?=item \[2\]:|\Z)/s)?.[0] ?? '';
const rawIntervals = [...wordsTier.matchAll(/xmin = ([\d.]+)\s+xmax = ([\d.]+)\s+text = "([^"]*)"/g)]
  .map((m) => ({ startMs: Math.round(parseFloat(m[1]) * 1000), endMs: Math.round(parseFloat(m[2]) * 1000), text: m[3] }))
  .filter((iv) => iv.text.trim() !== '');

if (rawIntervals.length !== flatSubWords.length) {
  console.error(`mfa-align: MFA returned ${rawIntervals.length} word interval(s), expected ${flatSubWords.length} — alignment likely failed partway; not writing output. Check ${outDir} before it's cleaned up.`);
  process.exit(1);
}

let cursor = 0;
const bySentence = new Map();
for (const { si, wi, word, subWords } of mapping) {
  const chunk = rawIntervals.slice(cursor, cursor + subWords.length);
  cursor += subWords.length;
  const startMs = chunk[0].startMs;
  const endMs = chunk[chunk.length - 1].endMs;
  if (!bySentence.has(si)) bySentence.set(si, []);
  bySentence.get(si).push({ text: word, startMs, endMs });
}

const out = [...bySentence.keys()].sort((a, b) => a - b).map((si) => {
  const words = bySentence.get(si);
  return { words, fromMs: words[0]?.startMs ?? 0, toMs: words[words.length - 1]?.endMs ?? 0 };
});

fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
fs.rmSync(workDir, { recursive: true, force: true });
const nWords = out.reduce((n, s) => n + s.words.length, 0);
console.log(`mfa-align: wrote ${outPath} — ${out.length} sentence(s), ${nWords} word(s)`);
