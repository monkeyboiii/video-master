#!/usr/bin/env bash
# Full-file transcription forced to English, to test whether an en-forced pass can locate
# a code-switched interjection ("What") in an otherwise all-Chinese take, as a general probe
# for O69/O71's fix — not auto: whisper picks one language from the opening window and applies
# it to the whole file, so -l auto on a 44s mostly-Chinese take would just pick zh again and
# tell us nothing (dbx-oracle's point). -l en is the direct test instead.
set -euo pipefail
export PATH="/opt/homebrew/Cellar/ffmpeg/9.0.1_1/bin:$PATH"

BASE=media/exports/S03E005-cn.MP4
WC=/Users/calvin/.cache/whisper.cpp
TMP=/tmp/probe-full-auto
mkdir -p "$TMP"

ffmpeg -y -v error -i "$BASE" -ar 16000 -ac 1 -c:a pcm_s16le "$TMP/full.wav"

"$WC/main" -m "$WC/ggml-large-v3.bin" -f "$TMP/full.wav" -l en \
  -dtw large.v3 -owts -oj -ojf -of "$TMP/out-en" -nt 2>&1 | tail -5
