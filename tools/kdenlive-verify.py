#!/usr/bin/env python3
"""Assert an exported .kdenlive actually places clips where its build.repl said to.

WHY THIS EXISTS

`timeline add-clip <track> <clip> -p <seconds>` writes into an MLT *playlist*, which is a strictly
sequential list of `<blank>`/`<entry>` elements. A playlist cannot represent two clips that overlap
in time. When a clip's position lands inside the previous clip on the same track, the CLI silently
APPENDS it and every later clip on that track ripples forward. It prints no warning and exits 0.

On S01E004 the three fan-out cards overlap by design. The export put the splash card at 49.37s
instead of 40.73s, the stats card at 61.67s instead of 53.03s, and the "PASS" whoosh 0.38s late.
The flatten preview was correct — it is composited by a separate ffmpeg script — so nothing looked
wrong until someone opened the project. The fix is one track per overlapping clip; this script is
what stops it from regressing.

USAGE
    python3 tools/kdenlive-verify.py <build.repl> <exported.kdenlive> [--fps 30] [--tol 0.05]

Run it from inside the episode media bundle, right after `kdenlive-nativize.py`.
Exits 1 on any mismatch, missing clip, or extra clip.
"""
import argparse
import re
import sys
import xml.etree.ElementTree as ET
from collections import defaultdict


def parse_repl(path):
    """-> {track_index: [(position_sec, duration_sec, bin_name), ...]} and {clipN: bin_name}."""
    names, tracks, order = {}, defaultdict(list), []
    n = 0
    for line in open(path):
        line = line.strip()
        m = re.match(r"bin import (\S+).*?-n (\S+)", line)
        if m:
            names[f"clip{n}"] = m.group(1).split("/")[-1]
            n += 1
            continue
        m = re.match(r"timeline add-clip (\d+) (clip\d+) -p ([\d.]+).*--out ([\d.]+)", line)
        if m:
            t, clip, pos, out = int(m.group(1)), m.group(2), float(m.group(3)), float(m.group(4))
            tracks[t].append((pos, out, names.get(clip, clip)))
            order.append(t)
    return tracks, names


def parse_kdenlive(path, fps):
    """-> {playlist_id: [(position_sec, duration_sec, resource_basename), ...]}."""
    root = ET.parse(path).getroot()
    res = {}
    for p in root.iter():
        if p.tag in ("producer", "chain"):
            for pr in p.findall("property"):
                if pr.get("name") == "resource":
                    res[p.get("id")] = pr.text.split("/")[-1]
    out = {}
    for pl in root.findall("playlist"):
        pid = pl.get("id")
        if pid in ("main_bin", "main-bin"):
            continue
        items, t0 = [], 0
        for e in pl:
            if e.tag == "blank":
                t0 += int(e.get("length"))
            elif e.tag == "entry":
                ln = int(e.get("out")) - int(e.get("in")) + 1
                items.append((t0 / fps, ln / fps, res.get(e.get("producer"), e.get("producer"))))
                t0 += ln
        if items:
            out[pid] = items
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("repl")
    ap.add_argument("kdenlive")
    ap.add_argument("--fps", type=float, default=30.0)
    ap.add_argument("--tol", type=float, default=0.05, help="seconds; one frame at 30fps is 0.033")
    a = ap.parse_args()

    want, _ = parse_repl(a.repl)
    got = parse_kdenlive(a.kdenlive, a.fps)

    # 1. overlap check on the SOURCE OF TRUTH — catch the bug before the export even runs
    bad = 0
    for t, clips in sorted(want.items()):
        for (p1, d1, n1), (p2, _, n2) in zip(sorted(clips), sorted(clips)[1:]):
            if p2 < p1 + d1 - 1e-9:
                print(f"  track {t}: {n1} @{p1:.2f}+{d1:.2f} OVERLAPS {n2} @{p2:.2f} "
                      f"— a playlist cannot hold this; give one of them its own track", file=sys.stderr)
                bad += 1

    # 2. positional check on the EXPORT
    playlists = [got[k] for k in sorted(got, key=lambda k: int(re.sub(r"\D", "", k) or 0))]
    if len(playlists) != len(want):
        print(f"  {len(want)} tracks in the repl but {len(playlists)} non-empty playlists in the "
              f"export", file=sys.stderr)
        bad += 1

    for t, clips in sorted(want.items()):
        if t >= len(playlists):
            continue
        exp, act = sorted(clips), playlists[t]
        if len(exp) != len(act):
            print(f"  track {t}: repl has {len(exp)} clips, export has {len(act)}", file=sys.stderr)
            bad += 1
            continue
        for (wp, wd, wn), (gp, gd, gn) in zip(exp, act):
            if abs(wp - gp) > a.tol:
                print(f"  track {t}: {wn} should start at {wp:.2f}s, export has "
                      f"{gn} at {gp:.2f}s  (drift {gp - wp:+.2f}s)", file=sys.stderr)
                bad += 1

    if bad:
        print(f"\nFATAL: {bad} problem(s). The .kdenlive does NOT match {a.repl}. "
              f"A render from it will be wrong even if the flatten preview looks right.",
              file=sys.stderr)
        return 1
    total = sum(len(c) for c in want.values())
    print(f"  kdenlive-verify: {total} clips across {len(want)} tracks, all within {a.tol}s")
    return 0


if __name__ == "__main__":
    sys.exit(main())
