#!/usr/bin/env bash
# Silence/onset boundaries over the whole base export, absolute timestamps (no -ss seeking,
# whose semantics are easy to get backwards). Filter the region you care about from the output.
set -euo pipefail
export PATH="/opt/homebrew/Cellar/ffmpeg/9.0.1_1/bin:$PATH"
BASE=media/exports/S03E005-cn.MP4

echo ">>> silencedetect -30dB, d=0.05"
ffmpeg -hide_banner -i "$BASE" -af "silencedetect=noise=-30dB:d=0.05" -f null - 2>&1 | grep silence
