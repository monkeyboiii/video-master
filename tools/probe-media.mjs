#!/usr/bin/env node
// Probe media files: duration, resolution, fps, codecs, bitrate, audio.
// Uses system ffprobe if present, else Remotion's bundled ffprobe.
// Usage: node tools/probe-media.mjs <file-or-directory> [--json]
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { REPO_ROOT } from './lib.mjs';

const MEDIA_EXT = /\.(mp4|mov|mkv|webm|avi|mts|wav|aiff|flac|m4a|mp3)$/i;
const target = process.argv.slice(2).find((a) => !a.startsWith('--'));
const asJson = process.argv.includes('--json');
if (!target || !fs.existsSync(target)) {
  console.error(target ? `Not found: ${target}` : 'Usage: node tools/probe-media.mjs <file-or-directory> [--json]');
  process.exit(1);
}

function ffprobe(file) {
  const args = ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', file];
  let r = spawnSync('ffprobe', args, { encoding: 'utf8' });
  if (r.error) {
    // Fall back to Remotion's bundled ffprobe (requires npm install in packages/remotion-graphics)
    r = spawnSync('npx', ['remotion', 'ffprobe', ...args], {
      encoding: 'utf8',
      cwd: path.join(REPO_ROOT, 'packages', 'remotion-graphics'),
    });
  }
  if (r.status !== 0) {
    // Skip Remotion's banner/separator lines to surface the real ffprobe error.
    const line = (r.stderr || '')
      .split('\n')
      .map((l) => l.trim())
      .find((l) => l && !/^-+$/.test(l) && !/^(Remotion|npm |A new version)/i.test(l));
    throw new Error(line || r.error?.message || 'ffprobe failed');
  }
  const jsonStart = r.stdout.indexOf('{');
  return JSON.parse(r.stdout.slice(jsonStart));
}

function summarize(file, data) {
  const v = data.streams?.find((s) => s.codec_type === 'video');
  const a = data.streams?.find((s) => s.codec_type === 'audio');
  const fps = v?.avg_frame_rate?.includes('/')
    ? (() => { const [n, d] = v.avg_frame_rate.split('/').map(Number); return d ? +(n / d).toFixed(3) : null; })()
    : null;
  return {
    file: path.basename(file),
    duration_sec: data.format?.duration ? +(+data.format.duration).toFixed(3) : null,
    video: v ? { codec: v.codec_name, width: v.width, height: v.height, fps, pix_fmt: v.pix_fmt } : null,
    audio: a ? { codec: a.codec_name, sample_rate: +a.sample_rate || null, channels: a.channels } : null,
    bitrate_kbps: data.format?.bit_rate ? Math.round(+data.format.bit_rate / 1000) : null,
    size_mb: data.format?.size ? +(+data.format.size / 1e6).toFixed(1) : null,
  };
}

const stat = fs.statSync(target);
const files = stat.isDirectory()
  ? fs.readdirSync(target).filter((f) => MEDIA_EXT.test(f)).map((f) => path.join(target, f)).sort()
  : [target];

const results = [];
for (const f of files) {
  try {
    results.push(summarize(f, ffprobe(f)));
  } catch (e) {
    results.push({ file: path.basename(f), error: String(e.message).split('\n')[0] });
  }
}

process.exitCode = results.some((r) => r.error) ? 1 : 0;
if (asJson) {
  console.log(JSON.stringify(results, null, 2));
} else {
  for (const r of results) {
    if (r.error) {
      console.log(`${r.file}\n  ERROR ${r.error}`);
      continue;
    }
    const v = r.video ? `${r.video.width}x${r.video.height} ${r.video.fps ?? '?'}fps ${r.video.codec} (${r.video.pix_fmt})` : 'no video';
    const a = r.audio ? `${r.audio.codec} ${r.audio.sample_rate}Hz ${r.audio.channels}ch` : 'no audio';
    console.log(`${r.file}\n  ${r.duration_sec}s · ${v} · ${a} · ${r.bitrate_kbps}kbps · ${r.size_mb}MB`);
  }
}
