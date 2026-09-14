#!/usr/bin/env bash
# Render a version of this episode's zh-CN caption master.
# Usage: bash render-captions.sh <version-suffix>   e.g. v1, v2
# Run from the video-master repo root (dbx mac exec cd's there).
set -euo pipefail
VER="${1:?usage: render-captions.sh <version-suffix>}"
export PATH="/Users/calvin/.nvm/versions/node/v24.16.0/bin:$PATH"

EP=series/S03/E005-mxgp-shanghai
PROPS="$(pwd)/$EP/remotion-props/spoken-captions.zh-CN.${VER}.json"
OUT="$(pwd)/media/S03E005/captions/S03E005_zh-CN_captions_${VER}.mov"

cd packages/remotion-graphics
npx remotion render burst-captions-zh "$OUT" --props="$PROPS" --log=error
ls -la "$OUT"
