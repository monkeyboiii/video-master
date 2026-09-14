#!/usr/bin/env bash
# Composite a rendered zh-CN caption master onto the real cut, audio untouched.
# Usage: bash mix-captions.sh <version-suffix>   e.g. v1, v2
# Run from the video-master repo root (dbx mac exec cd's there).
set -euo pipefail
VER="${1:?usage: mix-captions.sh <version-suffix>}"

# The Remotion-bundled ffmpeg (used for whisper's audio extraction) is a stripped build with
# no 'overlay' filter. Real ffmpeg (brew), full path since /opt/homebrew/bin isn't on a
# non-interactive shell's PATH here.
export PATH="/opt/homebrew/Cellar/ffmpeg/9.0.1_1/bin:$PATH"

BASE=media/exports/S03E005-cn.MP4
CAP="media/S03E005/captions/S03E005_zh-CN_captions_${VER}.mov"
OUT="media/S03E005/captions/S03E005_zh-CN_mixed_${VER}.mp4"

ffmpeg -y -i "$BASE" -i "$CAP" \
  -filter_complex "[0:v][1:v]overlay=format=auto:shortest=1[v]" \
  -map "[v]" -map 0:a? -c:a copy -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p "$OUT"

ls -la "$OUT"
