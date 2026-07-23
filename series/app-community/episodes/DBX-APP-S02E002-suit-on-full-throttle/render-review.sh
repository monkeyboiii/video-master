#!/usr/bin/env bash
# Deterministic review render for DBX-APP-S02E002.
# Run from anywhere:
#   bash video-master/series/app-community/episodes/DBX-APP-S02E002-suit-on-full-throttle/render-review.sh
#
# Same colour contract as S02E001: graphics are sRGB, the timeline is HLG/BT.2020, so every
# graphic layer is converted ($SRGB_TO_HLG, npl=203 = BT.2408 reference white) and composited in
# 10-bit RGB. No grading, no opacity fudging. Rationale: storyboard.md / edit-notes.md.
#
# The animated props are Remotion overlays (ProRes 4444 alpha), rendered by
# scratchpad/render-e202-overlays.sh from remotion-props/*.json:
#   palm-x-pop   the mark appearing as the palm opens (it pops, it does not drift in)
#   brand-form   four corner marks -> collapse to centre -> become the logo's X -> lockup expands
#   finale-logo  closing wordmark, fading up like the profile card so the two land as a pair
# Only the palm-zoom X is still a flat SVG stamp — it is static by design.
set -euo pipefail

: "${FF:=ffmpeg}"
: "${THREADS:=1}"          # <=1.5 CPU: one encode thread, one filter thread, one job at a time
NICE="nice -n 15"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VIDEO_MASTER_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
MEDIA_DIR="$VIDEO_MASTER_ROOT/media/DBX-APP-S02E002"

SRC="$MEDIA_DIR/footage/01_synced.MP4"
X_SVG="$MEDIA_DIR/assets/orange-X.svg"
OVL="$MEDIA_DIR/overlays"
PALM_POP="$OVL/DBX-APP-S02E002_en-US_9x16_mark-pop-palm_v001.mov"
BRAND_FORM="$OVL/DBX-APP-S02E002_en-US_9x16_brand-form_v001.mov"
FINALE_LOGO="$OVL/DBX-APP-S02E002_en-US_9x16_mark-pop-finale_v001.mov"
PROFILE="$OVL/DBX-APP-S02E002_en-US_9x16_profile-card_v001.mov"
OUT="$MEDIA_DIR/exports/DBX-APP-S02E002_en-US_tiktok_9x16_v001_review.mp4"

END=27.133

# palm zoom (16.733-17.567): the same mark 3.3x closer — palm ~500px wide, centre (550,1270)
ZX_W=376; ZX_H=412
ZX_X=362; ZX_Y=1064

SRGB_TO_HLG="zscale=transferin=iec61966-2-1:primariesin=bt709:matrixin=gbr:rangein=full:transfer=arib-std-b67:primaries=bt2020:matrix=gbr:range=full:npl=203"
GFX="format=rgba,$SRGB_TO_HLG,format=gbrap10le"

mkdir -p "$(dirname "$OUT")"
for f in "$PALM_POP" "$BRAND_FORM" "$FINALE_LOGO" "$PROFILE"; do
  [ -f "$f" ] || { echo "missing overlay: $f — run scratchpad/render-e202-overlays.sh first" >&2; exit 1; }
done

$NICE "$FF" -hide_banner -y \
  -i "$SRC" \
  -loop 1 -framerate 30 -width $ZX_W -height $ZX_H -i "$X_SVG" \
  -i "$PALM_POP" \
  -i "$BRAND_FORM" \
  -i "$FINALE_LOGO" \
  -i "$PROFILE" \
  -filter_complex "\
[0:v]trim=0:$END,setpts=PTS-STARTPTS,scale=1080:1920:flags=lanczos,fps=30,\
zscale=matrixin=bt2020nc:matrix=gbr:rangein=tv:range=full,format=gbrp10le[base];\
[2:v]$GFX,setpts=PTS-STARTPTS+16.230/TB[palm];\
[base][palm]overlay=x=0:y=0:enable='gte(t,16.230)*lt(t,16.733)':eof_action=pass:format=auto,format=gbrp10le[v1];\
[1:v]$GFX[xzoom];\
[v1][xzoom]overlay=x=$ZX_X:y=$ZX_Y:enable='gte(t,16.733)*lt(t,17.567)':format=auto,format=gbrp10le[v2];\
[3:v]$GFX,setpts=PTS-STARTPTS+17.670/TB[form];\
[v2][form]overlay=x=0:y=0:enable='gte(t,17.670)*lt(t,21.950)':eof_action=pass:format=auto,format=gbrp10le[v3];\
[4:v]$GFX,setpts=PTS-STARTPTS+25.600/TB[fin];\
[v3][fin]overlay=x=0:y=0:enable='gte(t,25.600)*lt(t,$END)':eof_action=pass:format=auto,format=gbrp10le[v4];\
[5:v]$GFX,setpts=PTS-STARTPTS+26.300/TB[prof];\
[v4][prof]overlay=x=0:y=0:enable='gte(t,26.300)*lt(t,$END)':eof_action=pass:format=auto,format=gbrp10le[v5];\
[v5]zscale=matrixin=gbr:matrix=bt2020nc:rangein=full:range=tv,format=yuv420p10le[vfinal]" \
  -map "[vfinal]" -map 0:a:0 \
  -t "$END" -r 30 \
  -threads "$THREADS" -filter_threads "$THREADS" -filter_complex_threads "$THREADS" \
  -c:v libx265 -crf 18 -preset medium -pix_fmt yuv420p10le -profile:v main10 -tag:v hvc1 \
  -x265-params "pools=1:frame-threads=1:repeat-headers=1:colorprim=bt2020:transfer=arib-std-b67:colormatrix=bt2020nc" \
  -colorspace bt2020nc -color_primaries bt2020 -color_trc arib-std-b67 \
  -c:a aac -b:a 192k -ac 2 -ar 48000 \
  -movflags +faststart \
  "$OUT"

echo "Wrote $OUT"
