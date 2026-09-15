#!/usr/bin/env bash
# Full-file transcription without forcing --lang=zh, to test whether whisper picks up
# "What" as a real code-switched token when given the WHOLE take's context, not a short
# isolated clip (which failed auto-detection in probe-what.sh).
set -euo pipefail
export PATH="/opt/homebrew/Cellar/ffmpeg/9.0.1_1/bin:$PATH"

BASE=media/exports/S03E005-cn.MP4
WC=/Users/calvin/.cache/whisper.cpp
TMP=/tmp/probe-full-auto
mkdir -p "$TMP"

ffmpeg -y -v error -i "$BASE" -ar 16000 -ac 1 -c:a pcm_s16le "$TMP/full.wav"

"$WC/main" -m "$WC/ggml-large-v3.bin" -f "$TMP/full.wav" -l auto \
  -dtw large.v3 -owts -oj -ojf -of "$TMP/out-auto" -nt 2>&1 | tail -5
