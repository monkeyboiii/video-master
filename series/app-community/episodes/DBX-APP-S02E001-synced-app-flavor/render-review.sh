#!/usr/bin/env bash
# Deterministic review render for DBX-APP-S02E001.
# Run from anywhere:
#   bash video-master/series/app-community/episodes/DBX-APP-S02E001-synced-app-flavor/render-review.sh
#
# Graphics are sRGB and the timeline is HLG/BT.2020. Every graphic layer is converted
# colorimetrically ($SRGB_TO_HLG, npl=203 = BT.2408 HDR reference white) instead of being
# hand-graded. Rationale and measurements: edit-notes.md.
set -euo pipefail

: "${FF:=ffmpeg}"
: "${THREADS:=1}"          # <=1.5 CPU: one encode thread, one filter thread, one job at a time
NICE="nice -n 15"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VIDEO_MASTER_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
MEDIA_DIR="$VIDEO_MASTER_ROOT/media/DBX-APP-S02E001"

SRC="$MEDIA_DIR/footage/01_synced.MP4"
X_SVG="$MEDIA_DIR/assets/orange-X.svg"
WORD_SVG="$MEDIA_DIR/assets/DirtBikeX.svg"
FEATURE="$MEDIA_DIR/overlays/DBX-APP-S02E001_en-US_9x16_feature-phones-built-it_v001.mov"
PROFILE="$MEDIA_DIR/overlays/DBX-APP-S02E001_en-US_9x16_profile-card_v001.mov"
APP_ICON="$MEDIA_DIR/assets/AppIcon-ios-card.png"
OUT="$MEDIA_DIR/exports/DBX-APP-S02E001_en-US_tiktok_9x16_v001_review.mp4"

# Source hard cuts (60fps frame-exact), from scdet. Every opening prop runs edge to edge
# of its own still so it clears with the picture, never before it.
CUT1=0.466667      # frame 28
CUT2=1.350000      # frame 81
CUT3=1.983333      # frame 119
CUT4=2.766667      # frame 166
END=22.550         # first true black frame

# sRGB graphic -> HLG/BT.2020 timeline. Alpha passes through untouched.
SRGB_TO_HLG="zscale=transferin=iec61966-2-1:primariesin=bt709:matrixin=gbr:rangein=full:transfer=arib-std-b67:primaries=bt2020:matrix=gbr:range=full:npl=203"
GFX="format=rgba,$SRGB_TO_HLG,format=gbrap10le"

mkdir -p "$(dirname "$OUT")"

$NICE "$FF" -hide_banner -y \
  -i "$SRC" \
  -loop 1 -framerate 60 -width 58  -height 64  -i "$X_SVG" \
  -loop 1 -framerate 60 -width 124 -height 136 -i "$X_SVG" \
  -loop 1 -framerate 60 -width 208 -height 228 -i "$X_SVG" \
  -loop 1 -framerate 60 -width 500 -height 238 -i "$WORD_SVG" \
  -i "$FEATURE" \
  -loop 1 -framerate 60 -width 560 -height 267 -i "$WORD_SVG" \
  -loop 1 -framerate 60 -width 460 -height 219 -i "$WORD_SVG" \
  -i "$PROFILE" \
  -loop 1 -framerate 60 -i "$APP_ICON" \
  -filter_complex "\
[0:v]trim=0:$END,setpts=PTS-STARTPTS,scale=1080:1920:flags=lanczos,fps=60,\
zscale=matrixin=bt2020nc:matrix=gbr:rangein=tv:range=full,format=gbrp10le[base];\
[1:v]$GFX[x1];\
[base][x1]overlay=x=693:y=1051:enable='lt(t,$CUT1)':format=auto,format=gbrp10le[v1];\
[2:v]$GFX[x2];\
[v1][x2]overlay=x=315:y=1119:enable='gte(t,$CUT1)*lt(t,$CUT2)':format=auto,format=gbrp10le[v2];\
[3:v]$GFX[x3];\
[v2][x3]overlay=x=193:y=1117:enable='gte(t,$CUT2)*lt(t,$CUT3)':format=auto,format=gbrp10le[v3];\
[4:v]$GFX[w0];\
[v3][w0]overlay=x=550:y=1350:enable='gte(t,$CUT3)*lt(t,$CUT4)':format=auto,format=gbrp10le[v4];\
[5:v]$GFX,setpts=PTS-STARTPTS+10.550/TB[feat];\
[v4][feat]overlay=x=0:y=0:enable='gte(t,10.550)*lt(t,14.033)':eof_action=pass:format=auto,format=gbrp10le[v5];\
[6:v]$GFX[wc];\
[v5][wc]overlay=x='(W-w)/2':y=155:enable='gte(t,14.033)*lt(t,15.400)':format=auto,format=gbrp10le[v6];\
[7:v]$GFX[ww];\
[v6][ww]overlay=x='(W-w)/2':y=235:enable='gte(t,15.400)*lt(t,16.883)':format=auto,format=gbrp10le[v7];\
[8:v]trim=0:2.317,setpts=PTS-STARTPTS,$GFX,fade=t=out:st=1.917:d=0.400:alpha=1,setpts=PTS+16.883/TB[prof];\
[v7][prof]overlay=x=0:y=0:enable='gte(t,16.883)*lt(t,19.200)':eof_action=pass:format=auto,format=gbrp10le[v8];\
[9:v]$GFX,fade=t=in:st=0:d=0.450:alpha=1,setpts=PTS-STARTPTS+19.200/TB[icon];\
[v8][icon]overlay=x=610:y=720:enable='gte(t,19.200)*lt(t,$END)':format=auto,format=gbrp10le[v9];\
[v9]zscale=matrixin=gbr:matrix=bt2020nc:rangein=full:range=tv,format=yuv420p10le[vfinal]" \
  -map "[vfinal]" -map 0:a:0 \
  -t "$END" -r 60 \
  -threads "$THREADS" -filter_threads "$THREADS" -filter_complex_threads "$THREADS" \
  -c:v libx265 -crf 18 -preset medium -pix_fmt yuv420p10le -profile:v main10 -tag:v hvc1 \
  -x265-params "pools=1:frame-threads=1:repeat-headers=1:colorprim=bt2020:transfer=arib-std-b67:colormatrix=bt2020nc" \
  -colorspace bt2020nc -color_primaries bt2020 -color_trc arib-std-b67 \
  -af "volume=-4.5dB" \
  -c:a aac -b:a 192k -ac 2 -ar 48000 \
  -movflags +faststart \
  "$OUT"

echo "Wrote $OUT"
