#!/usr/bin/env bash
# Find video scene cuts (not audio) in a window — the operator says "What" should span when
# a meme/cutaway cuts in, not when the word is spoken.
set -euo pipefail
export PATH="/opt/homebrew/Cellar/ffmpeg/9.0.1_1/bin:$PATH"
BASE=media/exports/S03E005-cn.MP4

ffmpeg -hide_banner -i "$BASE" -vf "select='gt(scene,0.04)',metadata=print" -an -f null - 2>&1 | grep -E "pts_time|frame="
