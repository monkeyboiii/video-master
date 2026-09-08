#!/usr/bin/env node
/**
 * storyboard-check.mjs — the storyboard, the manifest and the script name the same beats.
 *
 *   node tools/storyboard-check.mjs S05E002 [--locale=zh-CN] [--json] [--cuts]
 *
 * WHY THIS EXISTS. A storyboard is a third statement of the beat list, after manifest.yml and
 * script.<locale>.md. Three copies of one list drift, and the drift is SILENT: each file reads
 * perfectly on its own, and the first symptom is a previz rendering a shot for a beat nobody
 * wrote a line for, or a line with no picture designed for it. `tools/vm check` cannot catch it
 * because it never opens the storyboard.
 *
 * WHAT IT CHECKS
 *   1. every cut names a manifest beat, and the beats appear in MANIFEST ORDER
 *   2. every manifest beat has at least one cut — a beat with no picture is the common omission
 *   3. shot / camera / bg / motion / sfx are in the vocabularies the previz actually implements,
 *      so a typo fails here instead of rendering a default that looks deliberate
 *   4. a beat with no line in the script is a PICTURE beat: legal, but it must say so in a note
 *   5. `share` is a positive number — it is the cut's weight inside its beat
 *
 * WHAT IT DOES NOT CHECK: durations. A beat's length is in manifest.yml and nowhere else; a cut
 * has only a relative `share`. Retiming a beat retimes its cuts, so the two cannot disagree.
 */
import {readFileSync, existsSync, globSync} from 'node:fs';
import {join, relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import YAML from 'yaml';

const REPO = join(fileURLToPath(new URL('.', import.meta.url)), '..');

// The previz renderer implements exactly these. Keep in step with PrevizStoryboard.tsx.
export const VOCAB = {
  shot: ['ECU', 'CU', 'MCU', 'MS', 'WS', 'EWS', 'POV', 'AERIAL', 'INSERT'],
  // No `whip`: a whip pan is a transition device, and this piece cuts straight.
  camera: ['static', 'push', 'pull', 'snap-zoom', 'pan-l', 'pan-r', 'tilt-up', 'tilt-down',
           'handheld', 'orbit', 'freeze', 'ramp'],
  bg: ['dirt', 'night', 'sky', 'asphalt', 'crowd', 'grade', 'neutral', 'mall'],
  // No `whip-cut` or `fade-through`: both are transitions BETWEEN shots, and every motion here
  // must be something that happens inside one. Removed from the vocabulary rather than merely
  // unused, so reaching for one is an error instead of a habit.
  motion: ['none', 'punch-in', 'zoom-punch', 'slide-up', 'drop-in', 'pop', 'rise',
           'freeze-flash', 'text-pop', 'shake', 'glitch'],
  sfx: ['none', 'whoosh', 'impact', 'riser', 'sub-drop', 'click', 'shutter', 'scratch', 'ding',
        'swoosh-rev'],
};

/** Find an episode by video_id, the way tools/tts/episode.py does — the slug is not derivable. */
export const findEpisode = (videoId) => {
  for (const m of globSync('series/S*/E*/manifest.yml', {cwd: REPO})) {
    if (new RegExp(`^video_id:\\s*"${videoId}"`, 'm').test(readFileSync(join(REPO, m), 'utf8'))) {
      return join(REPO, m, '..');
    }
  }
  return null;
};

/**
 * [{beat, atSec, durSec, ...cut}] — a cut's length is its share of its beat's duration.
 * This is the ONE place cut timing is computed; the previz takes it from here rather than
 * recomputing it, so a change to the rule cannot land in one and not the other.
 */
export const timeline = (manifest, storyboard, locale) => {
  const dur = new Map();
  let clock = 0;
  for (const b of manifest.beats || []) {
    const d = (b.target_duration_sec || {})[locale];
    if (d === undefined) continue;
    dur.set(b.id, {at: clock, sec: Number(d)});
    clock += Number(d);
  }
  const out = [];
  for (const [beat, {at, sec}] of dur) {
    const cuts = (storyboard.cuts || []).filter((c) => c.beat === beat);
    const total = cuts.reduce((n, c) => n + (Number(c.share) || 0), 0) || 1;
    let t = at;
    for (const c of cuts) {
      const d = (sec * (Number(c.share) || 0)) / total;
      out.push({...c, atSec: Number(t.toFixed(3)), durSec: Number(d.toFixed(3))});
      t += d;
    }
  }
  return out;
};

const main = () => {
  const args = process.argv.slice(2);
  const videoId = args.find((a) => !a.startsWith('-'));
  const locale = (args.find((a) => a.startsWith('--locale=')) || '--locale=zh-CN').split('=')[1];
  if (!videoId) {
    console.error('usage: node tools/storyboard-check.mjs <video_id> [--locale=zh-CN] [--json] [--cuts]');
    process.exit(2);
  }
  const dir = findEpisode(videoId);
  if (!dir) {
    console.error(`${videoId}: no episode with that video_id`);
    process.exit(2);
  }
  const sbPath = join(dir, 'storyboard.yml');
  if (!existsSync(sbPath)) {
    console.error(`${relative(REPO, sbPath)}: no storyboard`);
    process.exit(2);
  }
  const man = YAML.parse(readFileSync(join(dir, 'manifest.yml'), 'utf8'));
  const sb = YAML.parse(readFileSync(sbPath, 'utf8'));
  const errs = [];
  const warns = [];

  if (sb.video_id !== man.video_id) {
    errs.push(`storyboard video_id "${sb.video_id}" != manifest "${man.video_id}"`);
  }

  const manBeats = (man.beats || []).map((b) => b.id);
  const cuts = sb.cuts || [];
  const cutBeats = [...new Set(cuts.map((c) => c.beat))];

  for (const b of cutBeats) {
    if (!manBeats.includes(b)) errs.push(`a cut names "${b}", which is not a manifest beat`);
  }
  for (const b of manBeats) {
    if (!cutBeats.includes(b)) errs.push(`beat "${b}" has no cut designed`);
  }
  const seen = cutBeats.filter((b) => manBeats.includes(b));
  const want = manBeats.filter((b) => cutBeats.includes(b));
  if (seen.join('>') !== want.join('>')) {
    errs.push(`cuts are not in manifest order:\n    storyboard ${seen.join(' > ')}\n    manifest   ${want.join(' > ')}`);
  }
  // A beat's cuts must be contiguous; interleaving two beats' cuts makes `share` meaningless.
  const runs = cuts.map((c) => c.beat).filter((b, i, a) => b !== a[i - 1]);
  if (runs.length !== new Set(runs).size) {
    errs.push('a beat\'s cuts are not contiguous — they are interleaved with another beat\'s');
  }

  for (const [i, c] of cuts.entries()) {
    const where = `cut ${i + 1} (${c.beat})`;
    for (const [key, allowed] of Object.entries(VOCAB)) {
      const v = c[key];
      if (v === undefined || v === null) {
        if (key === 'sfx') continue;                       // sfx is optional; absent means none
        errs.push(`${where}: no ${key}`);
      } else if (!allowed.includes(v)) {
        errs.push(`${where}: ${key} "${v}" is not one of ${allowed.join(' ')}`);
      }
    }
    if (!(Number(c.share) > 0)) errs.push(`${where}: share must be a positive number`);
    // A cut may name a published image instead of a generated field. It is checked HERE because
    // the failure is otherwise invisible: Remotion resolves an `src` against public/ and a missing
    // file renders as an empty box with no error, so a typo looks like a design choice. Nothing
    // else in the repo verifies that a component's src exists.
    if (c.src) {
      const pub = join(REPO, 'packages/remotion-graphics/public', c.src);
      if (!existsSync(pub)) {
        errs.push(`${where}: src "${c.src}" is not published — run the episode's chop script ` +
                  `(it writes into packages/remotion-graphics/public/)`);
      }
    }
    if (!c.subject) warns.push(`${where}: no subject — the previz renders an empty slate`);
  }

  // Script agreement. A beat with no VO/source marker is a PICTURE beat: legal, but deliberate.
  const scriptPath = join(dir, `script.${locale}.md`);
  if (existsSync(scriptPath)) {
    const spoken = new Set();
    let cur = null;
    for (const line of readFileSync(scriptPath, 'utf8').split('\n')) {
      const h = line.match(/^##\s+([a-z0-9][a-z0-9-]*)/);
      if (h) { cur = h[1]; continue; }
      if (cur && /^\*\*(VO|口播|Read|原声|Source):\*\*/.test(line)) spoken.add(cur);
    }
    for (const b of cutBeats) {
      if (spoken.has(b)) continue;
      const notes = cuts.filter((c) => c.beat === b).some((c) => c.subject);
      if (!notes) errs.push(`"${b}" is silent and its cuts say nothing about what is on screen`);
      else warns.push(`"${b}" is a picture beat — no line in script.${locale}.md`);
    }
    for (const b of spoken) {
      if (!cutBeats.includes(b)) errs.push(`script.${locale}.md has a line for "${b}", which has no cut`);
    }
  } else {
    warns.push(`no script.${locale}.md — script agreement not checked`);
  }

  const tl = timeline(man, sb, locale);
  const lens = tl.map((c) => c.durSec).sort((a, b) => a - b);
  const median = lens.length ? lens[Math.floor(lens.length / 2)] : 0;
  const total = tl.reduce((n, c) => Math.max(n, c.atSec + c.durSec), 0);

  if (args.includes('--json')) {
    console.log(JSON.stringify({video_id: videoId, cuts: tl, errors: errs, warnings: warns}, null, 2));
  } else {
    if (args.includes('--cuts')) {
      for (const c of tl) {
        console.log(`  ${c.atSec.toFixed(2).padStart(6)}s +${c.durSec.toFixed(2)}s  ${String(c.shot).padEnd(6)} ${String(c.camera).padEnd(10)} ${String(c.motion).padEnd(12)} ${String(c.sfx ?? 'none').padEnd(10)} ${c.beat}`);
      }
    }
    for (const w of warns) console.log(`WARN  ${w}`);
    for (const e of errs) console.log(`ERROR ${e}`);
    console.log(`storyboard ${videoId}: ${tl.length} cut(s) over ${cutBeats.length} beat(s), ` +
                `${total.toFixed(2)}s, median cut ${median.toFixed(2)}s, ` +
                `${errs.length} error(s), ${warns.length} warning(s)`);
  }
  process.exit(errs.length ? 1 : 0);
};

if (process.argv[1] && process.argv[1].endsWith('storyboard-check.mjs')) main();
