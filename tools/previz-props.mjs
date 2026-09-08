#!/usr/bin/env node
/**
 * previz-props.mjs — the props file the storyboard previz renders from.
 *
 *   node tools/previz-props.mjs S05E002 [--locale=zh-CN]
 *
 * Joins three files that each own one thing and none of which restate another:
 *   storyboard.yml   what is on screen, per cut
 *   manifest.yml     how long each beat is  (the ONLY place a duration is written)
 *   remotion-props/spoken-captions.<locale>.json   the caption rows, from /auto-narrate
 *
 * Cut timing comes from storyboard-check.mjs's `timeline()` rather than being recomputed here,
 * so the previz cannot disagree with the checker about where a cut falls. That is the whole
 * reason the function is exported instead of living inside its own script.
 */
import {readFileSync, existsSync, writeFileSync, mkdirSync} from 'node:fs';
import {join, relative, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import YAML from 'yaml';
import {findEpisode, timeline} from './storyboard-check.mjs';

const REPO = join(fileURLToPath(new URL('.', import.meta.url)), '..');

const args = process.argv.slice(2);
const videoId = args.find((a) => !a.startsWith('-'));
const locale = (args.find((a) => a.startsWith('--locale=')) || '--locale=zh-CN').split('=')[1];
if (!videoId) {
  console.error('usage: node tools/previz-props.mjs <video_id> [--locale=zh-CN]');
  process.exit(2);
}
const dir = findEpisode(videoId);
if (!dir) {
  console.error(`${videoId}: no episode with that video_id`);
  process.exit(2);
}

const man = YAML.parse(readFileSync(join(dir, 'manifest.yml'), 'utf8'));
const sb = YAML.parse(readFileSync(join(dir, 'storyboard.yml'), 'utf8'));
const cuts = timeline(man, sb, locale);
if (!cuts.length) {
  console.error(`${videoId}: storyboard produced no cuts for ${locale}`);
  process.exit(2);
}

// The captions are optional: a previz is still useful before anything is narrated, and saying so
// beats rendering a silent-looking piece that quietly lost its caption track.
const capPath = join(dir, 'remotion-props', `spoken-captions.${locale}.json`);
let script = '';
if (existsSync(capPath)) {
  script = JSON.parse(readFileSync(capPath, 'utf8')).script || '';
} else {
  console.log(`note  no ${relative(REPO, capPath)} — previz will render without captions. ` +
              `Generate it with: tools/tts/narrate --locale ${locale} --episode ${videoId} --write`);
}

const durationSec = Number(cuts.reduce((n, c) => Math.max(n, c.atSec + c.durSec), 0).toFixed(2));
const out = join(dir, 'remotion-props', `previz.${locale}.json`);
mkdirSync(dirname(out), {recursive: true});
writeFileSync(out, JSON.stringify({locale, durationSec, cuts, script}, null, 2) + '\n', 'utf8');
console.log(`${relative(REPO, out)}: ${cuts.length} cuts, ${durationSec}s` +
            (script ? `, ${script.split('\n').filter(Boolean).length} caption rows` : ', no captions'));
