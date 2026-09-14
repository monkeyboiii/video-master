#!/usr/bin/env bash
# Downscale the mixed final HERE, on the Mac — so only the small file crosses the tunnel.
# repos.toml: dispatch commands to the Mac, never move bytes this box does not need.
set -euo pipefail
VER="${1:?usage: downscale-preview.sh <version-suffix>}"
export PATH="/opt/homebrew/Cellar/ffmpeg/9.0.1_1/bin:$PATH"
IN="media/S03E005/captions/S03E005_zh-CN_mixed_${VER}.mp4"
OUT="media/S03E005/captions/S03E005_zh-CN_mixed_${VER}_preview.mp4"
ffmpeg -y -i "$IN" -c:v libx264 -preset veryfast -crf 30 -vf scale=720:-2 -c:a aac -b:a 96k "$OUT"
ls -la "$OUT"
