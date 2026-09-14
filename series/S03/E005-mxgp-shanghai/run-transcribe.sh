#!/usr/bin/env bash
# One-off: transcribe S03E005-cn.MP4 with whisper.cpp, then group into words against
# script.txt. Run from the video-master repo root (dbx mac exec already cd's there).
#
# PATH additions, because a non-interactive `ssh host CMD` shell does not source the
# rc files that put node (nvm) and ffmpeg (bundled with @remotion/compositor-darwin-arm64,
# there being no system/homebrew ffmpeg on this box) on PATH.
set -euo pipefail
COMPOSITOR="/Users/calvin/Library/pnpm/store/v11/links/@remotion/compositor-darwin-arm64/4.0.484/8da0cf194efb1a9529543b9560ed425fde4446f4a5a67ddb483bca43edcc0e56/node_modules/@remotion/compositor-darwin-arm64"
export PATH="/Users/calvin/.nvm/versions/node/v24.16.0/bin:$COMPOSITOR:$PATH"
export DYLD_LIBRARY_PATH="$COMPOSITOR"

EP=series/S03/E005-mxgp-shanghai
MEDIA=media/exports/S03E005-cn.MP4

echo "node: $(command -v node) ($(node -v))"
echo "ffmpeg: $(command -v ffmpeg)"

if [ ! -d tools/node_modules/@remotion/install-whisper-cpp ]; then
  echo ">>> tools/node_modules missing @remotion/install-whisper-cpp — installing"
  (cd tools && pnpm install --prod)
fi

node tools/transcribe.mjs "$MEDIA" "$EP/whisper-raw.json" --lang=zh
node tools/group-words.mjs "$EP/whisper-raw.json" "$EP/script.txt" "$EP/words.json"
