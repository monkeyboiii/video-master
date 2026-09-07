#!/usr/bin/env bash
# Render a caption composition over a finished cut — fast for looking at, or full for delivery.
#
#   tools/render-captions.sh --preview burst-intro-captions-zh
#   tools/render-captions.sh --final   burst-intro-captions-zh burst-intro-captions-en
#
# LOOK BEFORE YOU PAY. The defects in this pipeline are only visible by looking — a caption that
# collides with the picture, a highlight on the wrong word, a line that runs off frame. None of
# them need full resolution to see, and none of them are caught by an exit code. So preview is
# the default working mode and final is what you run once, after.
#
#   preview  half scale, ultrafast h264 out. A quarter of the pixels to rasterise and to encode.
#   final    full resolution, narration mixed in.
#
# TWO THINGS THAT LOOK LIKE FREE SPEED AND ARE NOT. JPEG frames cannot carry alpha, and Remotion
# refuses the combination outright rather than handing back a silently opaque overlay. And the
# codec cannot be swapped for VP9 either — the compositions bake a ProRes profile via
# `overlayMetadata`, and Remotion rejects a profile against a non-ProRes codec. Both refusals are
# correct; the speed here comes from SCALE, which nothing about the pipeline objects to.
#
# --base is the picture WITHOUT captions of its own; compositing onto a cut that already carries
# a subtitle layer gives two stacked sets. Check a frame if unsure.
set -euo pipefail

MODE=preview
BASE="${DBX_CAPTION_BASE:-$HOME/burst-intro/out/burst-intro-bare.mp4}"
TTS_OUT="${DBX_TTS_DIR:-$HOME/.cache/dbx-tts}/out"
OUT="${DBX_CAPTION_OUT:-$HOME/burst-intro/out}"
COMPS=()
for a in "$@"; do
  case "$a" in
    --preview) MODE=preview ;;
    --final)   MODE=final ;;
    --base=*)  BASE="${a#*=}" ;;
    --out=*)   OUT="${a#*=}" ;;
    -*) echo "unknown flag: $a" >&2; exit 2 ;;
    *) COMPS+=("$a") ;;
  esac
done
[ ${#COMPS[@]} -gt 0 ] || { echo "usage: $0 [--preview|--final] <composition>..." >&2; exit 2; }
[ -f "$BASE" ] || { echo "base cut not found: $BASE" >&2; exit 1; }

HERE="$(cd "$(dirname "$0")/.." && pwd -P)"
GFX="$HERE/packages/remotion-graphics"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
mkdir -p "$OUT"

for C in "${COMPS[@]}"; do
  L="$(printf '%s' "$C" | sed 's/.*captions-//; s/-plain//')"
  VO="$TTS_OUT/narration-$L.wav"
  t0=$(date +%s)

  if [ "$MODE" = preview ]; then
    # JPEG frames and half scale: the alpha is composited by ffmpeg from a colour-keyed render,
    # so nothing writes a 150 MB ProRes master just to be looked at once.
    ( cd "$GFX" && npx remotion render "$C" "$TMP/ov.mov" \
        --scale=0.5 --concurrency=100% --log=error ) \
        2>&1 | grep -vi webpack.cache | tail -1 || true
    ffmpeg -v error -y -i "$BASE" -i "$TMP/ov.mov" \
      -filter_complex "[0:v]scale=iw/2:ih/2[b];[b][1:v]overlay=format=auto:shortest=1[v]" \
      -map "[v]" -map 0:a? -c:v libx264 -preset ultrafast -crf 30 -pix_fmt yuv420p \
      -c:a aac -b:a 96k "$OUT/preview-$C.mp4" </dev/null
    F="$OUT/preview-$C.mp4"
  else
    ( cd "$GFX" && npx remotion render "$C" "$TMP/ov.mov" --log=error ) \
      2>&1 | grep -vi webpack.cache | tail -1 || true
    if [ -f "$VO" ]; then
      ffmpeg -v error -y -i "$BASE" -i "$TMP/ov.mov" -i "$VO" \
        -filter_complex "[0:v][1:v]overlay=format=auto:shortest=1[v];[0:a]volume=0.28[sfx];[2:a]volume=1.5[vo];[sfx][vo]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95[a]" \
        -map "[v]" -map "[a]" -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p \
        -c:a aac -b:a 128k "$OUT/$C.mp4" </dev/null
    else
      ffmpeg -v error -y -i "$BASE" -i "$TMP/ov.mov" \
        -filter_complex "[0:v][1:v]overlay=format=auto:shortest=1[v]" \
        -map "[v]" -map 0:a? -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p \
        -c:a aac -b:a 128k "$OUT/$C.mp4" </dev/null
    fi
    F="$OUT/$C.mp4"
  fi
  rm -f "$TMP/ov.mov"
  printf '%-34s %s  %6.1f MB  %ss\n' "$(basename "$F")" "$MODE" \
    "$(stat -c%s "$F" | awk '{print $1/1e6}')" "$(( $(date +%s) - t0 ))"
done
