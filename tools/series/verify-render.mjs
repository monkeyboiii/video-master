// vm verify-render — does the actual rendered FILE match what the pipeline computed it should be.
//
// WHY THIS IS NOT PART OF `vm check`. `vm check` validates metadata — manifests, props shape,
// lineage — in seconds, run often. This renders a real video, which takes minutes; folding a
// heavy check into a fast one that runs often is exactly how a check earns being skipped (O40,
// O47 — the estate's own examples of a slow step someone stopped running). `vm selftest` is this
// repo's existing precedent for the same call: a real test kept OUT of the fast path, on purpose.
//
// WHAT IT CATCHES THAT NOTHING ELSE DOES. `build-captions.mjs`'s own checks (zero-duration words,
// identical consecutive spans) prove the PROPS are shaped right before a render ever runs — they
// say nothing about whether Remotion's encoder actually produced a playable file of the right
// length and resolution. `npx remotion compositions --props=X` reports what the pipeline COMPUTED
// the composition should be (duration, resolution) for that props file; this renders it for real
// and asks ffprobe what the file ON DISK actually is, then compares the two. A silently truncated
// render, a wrong resolution baked into a template, or an unplayable file all show up here and
// nowhere else in this repo's checks.
//
// Usage: node tools/series/cli.mjs verify-render <composition> <props.json> [--tolerance-ms N] [--keep]
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { REPO_ROOT } from '../lib.mjs';

const GFX = path.join(REPO_ROOT, 'packages', 'remotion-graphics');
const COMP_ROW = /^(\S+)\s+\d+\s+(\d+)x(\d+)\s+(\d+)\s+\(([\d.]+)\s*sec\)/;

function expectedMetadata(composition, propsPath) {
  const out = execFileSync('npx', ['remotion', 'compositions', `--props=${propsPath}`],
    { cwd: GFX, encoding: 'utf8' });
  for (const line of out.split('\n')) {
    const m = COMP_ROW.exec(line.trim());
    if (m && m[1] === composition) {
      return { width: +m[2], height: +m[3], frames: +m[4], durationSec: +m[5] };
    }
  }
  return null;
}

function ffprobe(file, entries) {
  return execFileSync('ffprobe',
    ['-v', 'error', '-select_streams', 'v:0', '-show_entries', entries, '-of', 'csv=p=0', file],
    { encoding: 'utf8' }).trim();
}

export function verifyRender(composition, propsPathArg, { toleranceMs = 200, keep = false } = {}) {
  // Absolute, because remotion runs with cwd=GFX (a different package directory) — a relative
  // path typed at the repo root would silently resolve against the wrong directory there.
  const propsPath = path.resolve(propsPathArg);
  if (!fs.existsSync(propsPath)) {
    console.error(`verify-render: no such props file: ${propsPath}`);
    return false;
  }
  const expected = expectedMetadata(composition, propsPath);
  if (!expected) {
    console.error(`verify-render: ${composition} is not a known composition (checked against \`npx remotion compositions\`)`);
    return false;
  }
  console.log(`verify-render: pipeline computed ${expected.width}x${expected.height}, ${expected.durationSec}s for ${composition} against this props file`);

  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vm-verify-'));
  const out = path.join(workDir, 'render.mov');
  console.log('verify-render: rendering (this is the slow step, minutes not seconds)...');
  execFileSync('npx', ['remotion', 'render', composition, out, `--props=${propsPath}`, '--log=error'],
    { cwd: GFX, stdio: 'inherit' });

  let ok = true;
  const durSec = parseFloat(ffprobe(out, 'format=duration').split('\n').pop() ?? 'NaN');
  const actualMs = Math.round(durSec * 1000);
  const expectedMs = Math.round(expected.durationSec * 1000);
  if (!Number.isFinite(durSec)) {
    console.error(`verify-render: FAIL — ffprobe could not read a duration from the rendered file at all (${out})`);
    ok = false;
  } else if (Math.abs(actualMs - expectedMs) > toleranceMs) {
    console.error(`verify-render: FAIL duration — pipeline computed ${expectedMs}ms, rendered file is ${actualMs}ms (tolerance ${toleranceMs}ms)`);
    ok = false;
  } else {
    console.log(`verify-render: duration ok — ${actualMs}ms (computed ${expectedMs}ms)`);
  }

  const dims = ffprobe(out, 'stream=width,height');
  const [w, h] = dims.split(',').map(Number);
  if (w !== expected.width || h !== expected.height) {
    console.error(`verify-render: FAIL resolution — pipeline computed ${expected.width}x${expected.height}, rendered file is ${w}x${h}`);
    ok = false;
  } else {
    console.log(`verify-render: resolution ok — ${w}x${h}`);
  }

  if (keep) {
    console.log(`verify-render: kept at ${out}`);
  } else {
    fs.rmSync(workDir, { recursive: true, force: true });
  }
  return ok;
}
