#!/usr/bin/env bash
# Build the zh-CN caption-only timeline for DBX-APP-S01E002.
#
# This round changes ONE thing vs the en-US cut: the caption overlay is the Chinese (bilingual)
# render. The original English audio and every other overlay are reused unchanged.
# Steps: (1) render the zh-CN kinetic-captions overlay — ProRes 4444 alpha is baked into the
# composition (src/shared.ts), so a bare `remotion render` is correct; (2) assemble the timeline
# from kdenlive-build.zh-CN.repl and make it Kdenlive-native; (3) verify clip positions.
#
# Prereqs (identical to the en-US overlay renders): the episode's footage/overlays/music/sfx
# staged under media/DBX-APP-S01E002/, plus the tracked remotion public/ assets (Noto Sans SC
# fonts render the Chinese line). Run from anywhere.
set -euo pipefail

: "${CONCURRENCY:=1}"   # 1 keeps it inside the ~1.5-CPU shared-box budget; raise on a bigger box
: "${NICE:=nice -n 15}"

EP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VM="$(cd "$EP_DIR/../../../.." && pwd)"
VID="DBX-APP-S01E002"
MEDIA="$VM/media/$VID"
PKG="$VM/packages/remotion-graphics"
REPL="$EP_DIR/kdenlive-build.zh-CN.repl"
KDEN="${VID}_zh-CN_v001.kdenlive"

mkdir -p "$MEDIA/overlays"

# 1. Render the zh-CN caption overlay.  render <comp-id> <props-file> <output-name>
render() {
  echo ">>> render $1  ->  overlays/$3"
  ( cd "$PKG" && $NICE npx remotion render "$1" "$MEDIA/overlays/$3" \
      --props="$EP_DIR/remotion-props/$2" --concurrency="$CONCURRENCY" )
}
render kinetic-captions captions.all.zh-CN.json "${VID}_zh-CN_9x16_kinetic-captions_v001.mov"

# 2. Assemble the timeline. Relative media paths -> run the CLI from inside the media bundle.
cd "$MEDIA"
"$VM/tools/kdenlive-run.sh" "$REPL"
python3 "$VM/tools/kdenlive-nativize.py" "$KDEN" --vertical
python3 "$VM/tools/kdenlive-verify.py" "$REPL" "$KDEN"

echo ">>> done: media/$VID/$KDEN"
