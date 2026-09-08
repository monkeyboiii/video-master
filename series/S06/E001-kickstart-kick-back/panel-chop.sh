#!/usr/bin/env bash
# Chop the source contact sheet into the eight panels the episode renders, and PUBLISH them.
#
# WHY THIS SCRIPT EXISTS RATHER THAN EIGHT COMMITTED PNGs. The panels are DERIVED — the source is
# one 940x1672 sheet under media/, which is outside git by design, and the repo's first rule about
# media is never to commit what a script can regenerate. Publishing is part of chopping: a
# component's `src` resolves against Remotion's public/, never against media/, and a manual copy
# is a step you will forget — the next render then silently reuses the previous asset instead of
# failing. That rule is agents.d/modules/remotion-overlays.md § Rules.
#
# NOT THE CROP SCAR. screen-chop.sh says "NEVER CROP A SCREEN RECORDING — redact and keep the
# frame", because cropping a recording throws away evidence of what was on screen. This is the
# opposite situation: the source IS eight separate drawings printed on one sheet, and the sheet is
# kept whole under media/. Nothing is discarded; the grid is undone.
#
# THE GUTTERS ARE MEASURED, NOT ASSUMED. The sheet is not eight equal eighths — its four rows are
# 372, 412, 411 and 426 px tall. Hardcoding 1/8 would shave the top off two rows and leave a white
# band on another, and it would break silently the moment the artwork is redrawn. So the white
# gutters are detected here every run.
set -euo pipefail
cd "$(dirname "$0")"
REPO=../../..
SRC="$REPO/media/S06E001/_source/kickback-panels-v2.png"
PUB="$REPO/packages/remotion-graphics/public/s06e001"
WIDE=1080          # publish at the frame's width so the browser never upscales at render time

[ -f "$SRC" ] || { echo "no source sheet at $SRC" >&2; exit 1; }
command -v ffmpeg >/dev/null || { echo "ffmpeg is required" >&2; exit 1; }
mkdir -p "$PUB"

W=$(ffprobe -v error -select_streams v:0 -show_entries stream=width  -of default=nw=1:nk=1 "$SRC")
H=$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of default=nw=1:nk=1 "$SRC")
echo "source ${W}x${H}"

# Detect the full-white gutter bands, then emit one `x y w h` rect per panel, reading order.
RECTS=$(ffmpeg -v error -i "$SRC" -vf format=gray -f rawvideo - 2>/dev/null | python3 -c "
import sys
W,H = $W,$H
px = sys.stdin.buffer.read()[:W*H]
def bands(idx):
    out=[]; s=p=idx[0]
    for v in idx[1:]:
        if v!=p+1: out.append((s,p)); s=v
        p=v
    out.append((s,p)); return [b for b in out if b[1]-b[0]>=2]
rows = bands([y for y in range(H) if sum(1 for v in px[y*W:(y+1)*W] if v>245)/W > 0.99]) or []
cols = bands([x for x in range(W) if sum(1 for y in range(H) if px[y*W+x]>245)/H > 0.99]) or []
def spans(n, gut):
    out=[]; start=0
    for a,b in gut:
        if a>start: out.append((start, a-start))
        start=b+1
    if start<n: out.append((start, n-start))
    return out
ys, xs = spans(H, rows), spans(W, cols)
if len(ys)*len(xs) != 8:
    sys.exit(f'expected an 8-panel grid, found {len(xs)} col(s) x {len(ys)} row(s)')
INSET=3   # drops each panel's own printed frame line without eating the drawing
for y,h in ys:
    for x,w in xs:
        print(x+INSET, y+INSET, w-2*INSET, h-2*INSET)
")

i=0
while read -r x y w h; do
  i=$((i+1))
  ffmpeg -v error -y -i "$SRC" -vf "crop=${w}:${h}:${x}:${y},scale=${WIDE}:-2:flags=lanczos" "$PUB/p${i}.png"
  printf '  p%d.png  from %dx%d at %d,%d\n' "$i" "$w" "$h" "$x" "$y"
done <<< "$RECTS"

[ "$i" = 8 ] || { echo "chopped $i panels, expected 8" >&2; exit 1; }
echo "published 8 panels into packages/remotion-graphics/public/s06e001/"
