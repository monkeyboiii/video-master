#!/usr/bin/env bash
# Re-transcribe just the 28-33s window in isolation, without the whole-file --lang=zh lock,
# to see if "What" (an English interjection) gets picked up as a real token this time.
set -euo pipefail
export PATH="/opt/homebrew/Cellar/ffmpeg/9.0.1_1/bin:$PATH"

BASE=media/exports/S03E005-cn.MP4
WC=/Users/calvin/.cache/whisper.cpp
TMP=/tmp/probe-what
mkdir -p "$TMP"

ffmpeg -y -v error -i "$BASE" -ss 28 -to 33.5 -ar 16000 -ac 1 -c:a pcm_s16le "$TMP/clip.wav"

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
for LANG in zh en; do
  echo ">>> lang=$LANG"
  "$WC/main" -m "$WC/ggml-large-v3.bin" -f "$TMP/clip.wav" -l "$LANG" \
    -dtw large.v3 -owts -oj -ojf -of "$TMP/out-$LANG" -nt 2>&1 | tail -3
  echo "--- words ---"
  python3 "$HERE/read-probe.py" "$TMP/out-$LANG.json" || true
done
