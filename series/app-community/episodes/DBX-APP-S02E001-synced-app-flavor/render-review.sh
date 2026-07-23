#!/usr/bin/env bash
# Deterministic review render for DBX-APP-S02E001.
# Run from anywhere:
#   bash video-master/series/app-community/episodes/DBX-APP-S02E001-synced-app-flavor/render-review.sh
set -euo pipefail

: "${FF:=ffmpeg}"
: "${THREADS:=2}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VIDEO_MASTER_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
MEDIA_DIR="$VIDEO_MASTER_ROOT/media/DBX-APP-S02E001"

SRC="$MEDIA_DIR/footage/01_synced.MP4"
X_MARK_1="$MEDIA_DIR/assets/orange-X-64-balanced.png"
X_MARK_2="$MEDIA_DIR/assets/orange-X-136-balanced.png"
X_MARK_3="$MEDIA_DIR/assets/orange-X-228-balanced.png"
HOOK_WORDMARK="$MEDIA_DIR/assets/DirtBikeX-500-balanced.png"
FEATURE="$MEDIA_DIR/overlays/DBX-APP-S02E001_en-US_9x16_feature-phones-built-it_v001.mov"
WORDMARK_CLOSE="$MEDIA_DIR/assets/DirtBikeX-560-balanced.png"
WORDMARK_WIDE="$MEDIA_DIR/assets/DirtBikeX-460-balanced.png"
PROFILE="$MEDIA_DIR/overlays/DBX-APP-S02E001_en-US_9x16_profile-card_v001.mov"
APP_ICON="$MEDIA_DIR/assets/AppIcon-ios-card-balanced.png"
OUT="$MEDIA_DIR/exports/DBX-APP-S02E001_en-US_tiktok_9x16_v001_review.mp4"

mkdir -p "$(dirname "$OUT")"

"$FF" -hide_banner -y \
  -i "$SRC" \
  -loop 1 -framerate 60 -i "$X_MARK_1" \
  -loop 1 -framerate 60 -i "$X_MARK_2" \
  -loop 1 -framerate 60 -i "$X_MARK_3" \
  -loop 1 -framerate 60 -i "$HOOK_WORDMARK" \
  -i "$FEATURE" \
  -loop 1 -framerate 60 -i "$WORDMARK_CLOSE" \
  -loop 1 -framerate 60 -i "$WORDMARK_WIDE" \
  -i "$PROFILE" \
  -loop 1 -framerate 60 -i "$APP_ICON" \
  -filter_complex "\
[0:v]trim=0:22.550,setpts=PTS-STARTPTS,scale=1080:1920:flags=lanczos,format=yuv420p10le,fps=60[base];\
[1:v]format=rgba[x0];\
[base][x0]overlay=x=701:y=1034:enable='gte(t,0.000)*lt(t,0.467)'[v1];\
[2:v]format=rgba[x1];\
[v1][x1]overlay=x=294:y=1107:enable='gte(t,0.467)*lt(t,1.350)'[v2];\
[3:v]format=rgba[x2];\
[v2][x2]overlay=x=200:y=1049:enable='gte(t,1.350)*lt(t,1.983)'[v3];\
[4:v]format=rgba[hookmark];\
[v3][hookmark]overlay=x=550:y=1350:enable='gte(t,1.983)*lt(t,2.683)'[v4];\
[5:v]setpts=PTS-STARTPTS+10.550/TB,format=rgba,eq=contrast=0.86:saturation=0.82:brightness=-0.006,colorchannelmixer=aa=0.86[feature];\
[v4][feature]overlay=x=0:y=0:enable='gte(t,10.550)*lt(t,14.033)':eof_action=pass[v5];\
[6:v]format=rgba[wordmark_close];\
[v5][wordmark_close]overlay=x='(W-w)/2':y=155:enable='gte(t,14.033)*lt(t,15.400)'[v6];\
[7:v]format=rgba[wordmark_wide];\
[v6][wordmark_wide]overlay=x='(W-w)/2':y=235:enable='gte(t,15.400)*lt(t,16.883)'[v7];\
[8:v]trim=0:2.317,setpts=PTS-STARTPTS,format=rgba,eq=contrast=0.94:saturation=0.92:brightness=-0.006,colorchannelmixer=aa=0.96,fade=t=out:st=1.917:d=0.400:alpha=1,setpts=PTS+16.883/TB[profile];\
[v7][profile]overlay=x=0:y=0:enable='gte(t,16.883)*lt(t,19.200)':eof_action=pass[v8];\
[9:v]format=rgba,setpts=PTS-STARTPTS+19.200/TB,fade=t=in:st=19.200:d=0.450:alpha=1[appicon];\
[v8][appicon]overlay=x=610:y=720:enable='gte(t,19.200)*lt(t,22.550)'[vout];\
[vout]format=yuv420p10le[vfinal]" \
  -map "[vfinal]" -map 0:a:0 \
  -t 22.550 -r 60 \
  -threads "$THREADS" -filter_threads "$THREADS" -filter_complex_threads "$THREADS" \
  -c:v libx265 -crf 18 -preset medium -pix_fmt yuv420p10le -profile:v main10 -tag:v hvc1 \
  -x265-params "repeat-headers=1:colorprim=bt2020:transfer=arib-std-b67:colormatrix=bt2020nc" \
  -colorspace bt2020nc -color_primaries bt2020 -color_trc arib-std-b67 \
  -af "volume=-4.5dB" \
  -c:a aac -b:a 192k -ac 2 -ar 48000 \
  -movflags +faststart \
  "$OUT"

echo "Wrote $OUT"
