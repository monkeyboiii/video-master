#!/usr/bin/env python3
"""Assert no beat's cut point truncates its own take.

`silencedetect` only reports a silence at least `d` long. On S01E004, 01_hook ended with 0.24s of
silence, so it reported NO trailing silence, and its last `silence_start` was an interior breath —
the one before "and honestly, that'd be the easy way out." Reading that as the end of speech cut
the sentence off the episode for three builds. This gate finds the last SPEECH sample with an RMS
gate and fails if any beat's `cutOut` lands before it. Every E005 take has 0.5-1.0s of trailing
silence, so none is at risk today; the gate is here so that stays true.

Run from inside media/DBX-APP-S01E005/.  Exit 1 on any truncation.
"""
import math, struct, subprocess, sys

SR, HOP = 8000, 80          # 10 ms buckets
GATE_DB, MIN_SIL, MIN_RUN, TAIL = -32.0, 0.30, 0.10, 0.15

# beat : narration file : trimIn : cutOut   — keep in step with footage-process.sh CLIPS
CLIPS = [
    ("01_hook", "01_hook.MOV", 0.0, 11.00), ("02_layers", "02_layers.MOV", 0.0, 12.19),
    ("03_flair", "03_flair.MOV", 0.30, 7.31), ("04_invite", "04_invite.MOV", 0.0, 6.95),
    ("05_stats-intro", "05_stats-intro.MOV", 0.0, 3.12),
    ("06_stats-detail", "06_stats-detail.MOV", 0.0, 5.56),
    ("07_insider", "07_insider.MOV", 0.0, 6.50), ("08_cta", "08_cta.MOV", 0.0, 12.95),
]


def envelope(path):
    out = subprocess.run(
        ["nice", "-n", "15", "ffmpeg", "-v", "error", "-threads", "1", "-i", f"narration/{path}",
         "-map", "0:a:0", "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
        capture_output=True, check=True).stdout
    x = struct.unpack(f"{len(out)//4}f", out)
    return [20 * math.log10(math.sqrt(sum(v * v for v in x[i:i + HOP]) / HOP) + 1e-12)
            for i in range(0, len(x) - HOP, HOP)]


def runs(env):
    loud, out, i = [d > GATE_DB for d in env], [], 0
    while i < len(loud):
        if not loud[i]:
            i += 1
            continue
        j = i
        while j < len(loud):
            if loud[j]:
                j += 1
                continue
            k = j
            while k < len(loud) and not loud[k]:
                k += 1
            if (k - j) * 0.01 < MIN_SIL and k < len(loud):
                j = k
            else:
                break
        if (j - i) * 0.01 >= MIN_RUN:
            out.append((i * 0.01, j * 0.01))
        i = j
    return out


SHOW_RUNS = "--runs" in sys.argv

bad = 0
for beat, src, tin, tout in CLIPS:
    env = envelope(src)
    r = runs(env)
    end = r[-1][1] if r else 0.0
    src_dur = len(env) * 0.01
    ok = end <= tout + 0.02
    bad += 0 if ok else 1
    print(f"  {beat:16} speech ends {end:6.2f}  cutOut {tout:6.2f}  "
          f"{'ok' if ok else f'TRUNCATED — set cutOut to {min(end + TAIL, src_dur):.2f}'}")
    if SHOW_RUNS:
        # paste straight into caption-map.mjs BEATS[].runs (RAW clip seconds, before trimIn)
        print("                   runs: [" +
              ", ".join(f"[{a:.3f}, {b:.3f}]" for a, b in r) + "]")

if bad:
    print(f"\nFATAL: {bad} beat(s) cut mid-sentence. Fix CLIPS here, in footage-process.sh, "
          f"and in caption-map.mjs BEATS (all three are the same numbers).", file=sys.stderr)
    sys.exit(1)
print("  all beats keep their full take")
if not SHOW_RUNS:
    print("  (pass --runs to print each beat's speech runs for caption-map.mjs BEATS)")
