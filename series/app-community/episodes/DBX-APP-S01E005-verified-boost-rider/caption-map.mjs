// Word-timed caption map generator — E005 (see skills/06 + 07).
//
// ONE continuous whole-video caption track, so the rolling window carries words across the cuts
// and captions never fade out mid-video.
//
// The per-beat `.srt` files are CANONICAL — the words, the subtitles and the sync source of truth.
// They outrank `rough.md` (intent) and `script.en-US.md` (a readable transcript of them). The only
// thing this generator changes about their text is stripping markdown emphasis markers, which are
// a cue for the caption colouring and not something the founder said out loud.
//
// WHY THIS IS NOT THE E004 GENERATOR
// E004 anchored words to measured speech runs and split the runs into cue-groups at the LARGEST
// inter-run gaps, treating smaller gaps as breaths. That works when a beat's sentence boundaries
// are its longest pauses. E005's CTA breaks it: its interior breaths (0.45 / 0.50 / 0.51s) are as
// long as its sentence gaps (0.55s), so largest-gap put cue 1 at 0.12-2.61s when it is spoken to
// 4.86s. It also cannot express a cue that is a *sub-span* of one run — E005's CTA ends with the
// transcriber's cue "the bio." sitting inside the middle of a run.
//
// So the cue boundaries come from the SRT (whose times are already close, being the phone's own
// transcription of this clip), and are then SNAPPED so no boundary — and therefore no word — can
// land in a pause:
//   * a boundary inside a silence moves to the start of the next speech run;
//   * a boundary within SNAP of a run's edge moves to that edge;
//   * a boundary genuinely inside a run stays put (that is a real mid-run cue split).
// Words are then spread over each cue's SPEECH time, skipping silences entirely.
//
// This reproduces E004's hook exactly (its cue boundaries at 3.0 and 6.0 both fall in silences and
// snap to 3.439 / 6.830) while getting E005's CTA right. Verified by `node caption-map.mjs --test`.
//
// Reproduce RUNS with (from inside media/DBX-APP-S01E005/):
//   python3 <episode>/speech-check.py --runs
// `speech-check.py` measures the last speech SAMPLE, not the last `silencedetect` silence_start —
// see its docstring, and skills/06.
//
// Run from the video-master repo root:
//   node series/app-community/episodes/DBX-APP-S01E005-verified-boost-rider/caption-map.mjs
import fs from 'node:fs';
import path from 'node:path';

const EP = 'series/app-community/episodes/DBX-APP-S01E005-verified-boost-rider';
const SRT = 'media/DBX-APP-S01E005/_source/srt';
const OUT = path.join(EP, 'remotion-props');

/** A cue boundary this close to a run's edge is that edge, not a mid-run split. */
const SNAP = 0.20;

// start = global timeline start; trimIn = head silence trimmed; dur = trimmed clip length.
// runs = speech intervals in RAW clip seconds (before trimIn is subtracted).
const BEATS = [
  {f: '01_hook.srt', start: 0.00, trimIn: 0, dur: 11.00,
   runs: [[0.220, 0.590], [1.110, 3.150], [3.830, 3.980], [4.520, 5.740], [6.040, 6.740],
          [7.480, 10.590]],
   brand: ['screaming', 'notch', 'verified', 'boost', 'rider'], harsh: []},

  {f: '02_layers.srt', start: 11.00, trimIn: 0, dur: 12.19,
   runs: [[0.040, 0.430], [0.930, 3.450], [3.960, 7.290], [7.960, 8.470], [8.880, 9.330],
          [9.660, 10.490], [11.010, 12.040]],
   brand: ['dirtbikex', 'flair', 'stats', 'invites', 'insider', 'hacks'], harsh: []},

  {f: '03_flair.srt', start: 23.19, trimIn: 0.30, dur: 7.01,
   runs: [[0.400, 1.500], [1.960, 5.340], [5.840, 7.160]],
   brand: ['membership', 'flair', 'verified'], harsh: []},

  {f: '04_invite.srt', start: 30.20, trimIn: 0, dur: 6.95,
   runs: [[0.170, 2.810], [3.370, 4.460], [5.040, 6.800]],
   brand: ['invite', 'code', 'accepted'], harsh: []},

  {f: '05_stats-intro.srt', start: 37.15, trimIn: 0, dur: 3.30,
   runs: [[0.190, 1.720], [2.100, 2.970]],
   brand: ['pass', 'deeper', 'stats'], harsh: []},

  {f: '06_stats-detail.srt', start: 40.45, trimIn: 0, dur: 5.56,
   runs: [[0.160, 0.830], [1.290, 2.070], [2.560, 5.410]],
   brand: ['months', 'updates', 'engaged'], harsh: []},

  {f: '07_insider.srt', start: 46.01, trimIn: 0, dur: 6.50,
   runs: [[0.220, 2.160], [2.650, 3.150], [3.680, 5.670], [6.000, 6.110]],
   brand: ['chat', 'early', 'first'], harsh: []},

  // the transcriber split the last sentence mid-phrase ("...my link in" / "the bio."), so cue 4 is
  // a sub-span of one run. Largest-gap grouping cannot express that; boundary snapping can.
  {f: '08_cta.srt', start: 52.51, trimIn: 0, dur: 12.95,
   runs: [[0.120, 0.480], [0.930, 2.610], [3.160, 4.860], [5.360, 7.170], [7.990, 10.350],
          [10.860, 12.800]],
   brand: ['rubio', 'follow', 'link', 'bio'], harsh: []},
];

const TOTAL = +BEATS.reduce((a, b) => a + b.dur, 0).toFixed(2); // 65.46

/** For matching against the brand/harsh lists. */
const norm = (w) => w.replace(/^[*_"“”'']+|[*_"“”''.,!?;:]+$/g, '').toLowerCase();
/** For display: the SRT marks emphasis with *asterisks*; they are a cue, not caption text. */
const display = (w) => w.replace(/[*_]/g, '');

const ts2sec = (h, m, s, ms) => +h * 3600 + +m * 60 + +s + +ms / 1000;

const parseSrt = (txt) => {
  const cues = [];
  for (const b of txt.replace(/\r/g, '').split(/\n\n+/)) {
    const m = b.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
    if (!m) continue;
    const text = b.split('\n').slice(2).join(' ').trim();
    if (text) cues.push({text, a: ts2sec(m[1], m[2], m[3], m[4]), b: ts2sec(m[5], m[6], m[7], m[8])});
  }
  return cues;
};

/** Shift runs into trimmed-clip time and clip them to [0, dur]. */
const localRuns = (cfg) =>
  cfg.runs
    .map(([a, b]) => [a - cfg.trimIn, Math.min(b - cfg.trimIn, cfg.dur)])
    .filter(([a, b]) => b - a > 0.05)
    .map(([a, b]) => [Math.max(0, a), b]);

/**
 * Move a cue boundary out of any pause. Inside a silence -> the next run's start. Within SNAP of a
 * run edge -> that edge. Otherwise leave it: a genuine mid-run cue split.
 */
const snap = (t, runs) => {
  if (t <= runs[0][0]) return runs[0][0];
  const last = runs[runs.length - 1][1];
  if (t >= last) return last;
  for (let i = 0; i < runs.length; i++) {
    const [s, e] = runs[i];
    if (t < s) return s;                       // in the silence before run i
    if (t <= e) {
      if (t - s <= SNAP) return s;
      if (e - t <= SNAP && i + 1 < runs.length) return e;
      return t;                                // a real split inside this run
    }
  }
  return last;
};

/** Seconds of SPEECH between two raw times (silences contribute nothing). */
const speechBetween = (runs, a, b) =>
  runs.reduce((acc, [s, e]) => acc + Math.max(0, Math.min(e, b) - Math.max(s, a)), 0);

/** Raw time at `want` seconds of speech after `a`. */
const advance = (runs, a, want) => {
  for (const [s, e] of runs) {
    if (e <= a) continue;
    const from = Math.max(s, a);
    const len = e - from;
    if (want <= len) return from + want;
    want -= len;
  }
  return runs[runs.length - 1][1];
};

// ── self-test (`node caption-map.mjs --test`) ─────────────────────────────────────────────────
// Two fixtures. The first is S01E004's hook, whose grouping shipped and was verified frame by
// frame: boundary snapping must reproduce it exactly. The second is this episode's CTA, the case
// that broke E004's largest-gap rule. If either changes, the algorithm changed.
if (process.argv.includes('--test')) {
  const bounds = (runs, cueStarts) => {
    const b = cueStarts.map((t) => snap(t, runs));
    b.push(runs[runs.length - 1][1]);
    return b.map((x) => +x.toFixed(3));
  };
  const eq = (name, got, want) => {
    const ok = JSON.stringify(got) === JSON.stringify(want);
    console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${name}: ${JSON.stringify(got)}`);
    if (!ok) {
      console.error(`       expected ${JSON.stringify(want)}`);
      process.exitCode = 1;
    }
  };
  // S01E004 01_hook: 4 runs, 3 cues at 0 / 3.0 / 6.0. Both interior boundaries fall in silences.
  eq(
    'E004 hook boundaries reproduce the shipped grouping',
    bounds([[0, 2.754], [3.439, 5.85], [6.83, 9.638], [10.167, 11.87]], [0, 3.0, 6.0]),
    [0, 3.439, 6.83, 11.87],
  );
  // E005 08_cta: 6 runs, 4 cues. Cue 1 spans three runs; cue 4 is a sub-span of run 6.
  eq(
    'E005 cta cue 1 spans its three runs and cue 4 splits inside run 6',
    bounds(
      [[0.12, 0.48], [0.93, 2.61], [3.16, 4.86], [5.36, 7.17], [7.99, 10.35], [10.86, 12.8]],
      [0, 5.32, 8.06, 12.439],
    ),
    [0.12, 5.36, 7.99, 12.439, 12.8],
  );
  // a boundary 0.079s inside a run's start belongs to that run (E005 01_hook, cue 3 at 7.559)
  eq(
    'E005 hook cue 3 snaps back to its run start',
    bounds(
      [[0.22, 0.59], [1.11, 3.15], [3.83, 3.98], [4.52, 5.74], [6.04, 6.74], [7.48, 10.59]],
      [0, 3.439, 7.559],
    ),
    [0.22, 3.83, 7.48, 10.59],
  );
  if (!process.exitCode) console.log('  all boundary fixtures pass');
  process.exit(process.exitCode ?? 0);
}

// ── guards ────────────────────────────────────────────────────────────────────────────────────
// A beat's `dur` must cover its last speech run, or the take is being cut mid-sentence — the bug
// that lost S01E004's hook its last sentence. And the starts must chain exactly.
let acc = 0;
for (const cfg of BEATS) {
  if (Math.abs(cfg.start - acc) > 1e-6) {
    throw new Error(`${cfg.f}: start ${cfg.start} but previous beats end at ${acc.toFixed(2)}`);
  }
  acc = +(acc + cfg.dur).toFixed(6);
  const lastSpeech = cfg.runs[cfg.runs.length - 1][1] - cfg.trimIn;
  if (lastSpeech > cfg.dur + 1e-6) {
    throw new Error(
      `${cfg.f}: speech runs to ${lastSpeech.toFixed(3)}s but dur is ${cfg.dur}s — the cut ` +
      `truncates the take. Set dur >= lastSpeech + ~0.15 (and keep footage-process.sh in step).`,
    );
  }
}

const words = [];
const cueTimes = [];
for (const cfg of BEATS) {
  const brand = new Set(cfg.brand);
  const harsh = new Set(cfg.harsh);
  const cues = parseSrt(fs.readFileSync(path.join(SRT, cfg.f), 'utf8'));
  const runs = localRuns(cfg);

  // cue i spans [bound[i], bound[i+1]] in trimmed-clip seconds, snapped clear of every pause
  const bound = cues.map((c) => snap(c.a - cfg.trimIn, runs));
  bound.push(runs[runs.length - 1][1]);
  for (let i = 0; i < cues.length; i++) {
    const span = speechBetween(runs, bound[i], bound[i + 1]);
    if (span <= 0.01) {
      throw new Error(`${cfg.f}: cue ${i + 1} ("${cues[i].text.slice(0, 32)}...") gets ${span}s ` +
        `of speech between ${bound[i].toFixed(2)} and ${bound[i + 1].toFixed(2)}`);
    }
  }

  cues.forEach((c, ci) => {
    const [a, b] = [bound[ci], bound[ci + 1]];
    const span = speechBetween(runs, a, b);
    const toks = c.text.split(/\s+/).filter(Boolean);
    toks.forEach((tok, i) => {
      const s = +(cfg.start + advance(runs, a, (i / toks.length) * span)).toFixed(2);
      const n = norm(tok);
      const e = brand.has(n) ? 'brand' : harsh.has(n) ? 'harsh' : undefined;
      const t = display(tok);
      words.push(e ? {t, s, e} : {t, s});
    });
    cueTimes.push({a: cfg.start + a, b: cfg.start + b, text: display(c.text)});
  });
}
words.sort((a, b) => a.s - b.s);
const last = words[words.length - 1].s;
if (last >= TOTAL) throw new Error(`last word @${last} >= TOTAL ${TOTAL}`);

fs.mkdirSync(OUT, {recursive: true});
const props = {durationSec: TOTAL, fontScale: 0.95, window: 6, words};
fs.writeFileSync(path.join(OUT, 'captions.all.json'), JSON.stringify(props, null, 2));

const ts = (t) => {
  const ms = Math.max(0, Math.round(t * 1000));
  const h = String(Math.floor(ms / 3600000)).padStart(2, '0');
  const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, '0');
  const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
  return `${h}:${m}:${s},${String(ms % 1000).padStart(3, '0')}`;
};
const srtOut = cueTimes.map(
  (c, i) => `${i + 1}\n${ts(c.a)} --> ${ts(Math.min(TOTAL, c.b))}\n${c.text}\n`,
);
fs.mkdirSync(path.join(EP, 'subtitles'), {recursive: true});
fs.writeFileSync(path.join(EP, 'subtitles', 'en-US.srt'), srtOut.join('\n'));

const emph = words.filter((w) => w.e).map((w) => `${w.t}[${w.e}]@${w.s}`).join(' ');
console.log(`${words.length} words, ${TOTAL}s, first@${words[0].s} last@${last}`);
console.log(`${srtOut.length} srt cues -> subtitles/en-US.srt`);
console.log('beat starts:', BEATS.map((b) => b.start).join(' '));
console.log('emphasis:', emph);
