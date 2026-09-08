#!/usr/bin/env bash
# Make the TTS environment exist, and do nothing if it already does.
#
# KEPT BESIDE THE REPO, NOT INSIDE IT — the same rule `transcribe.mjs` follows for whisper.cpp,
# for the same reason: torch and a model checkpoint are ~1.7 GB, per-box, and reproducible from
# a lockfile. `DBX_TTS_DIR` overrides, default ~/.cache/dbx-tts. Deleting that directory costs a
# re-download and nothing else.
#
# NOTHING IS FETCHED UNTIL NARRATION IS ASKED FOR. This script is the only thing that downloads,
# every entry point calls it first, and a checkout that never narrates never pays for any of it.
set -euo pipefail

TTS_DIR="${DBX_TTS_DIR:-$HOME/.cache/dbx-tts}"
VENV="$TTS_DIR/venv"
export HF_HOME="$TTS_DIR/hf"          # keep the checkpoint in OUR cache, not the user's global one
REPO_ID="${DBX_TTS_REPO:-hexgrad/Kokoro-82M}"
PY_VER=3.12                            # see the note on 3.14 below

say() { printf 'tts: %s\n' "$*" >&2; }

if [ -x "$VENV/bin/python" ] && [ -d "$HF_HOME" ] && [ -z "${DBX_TTS_FORCE:-}" ]; then
  echo "$VENV"; exit 0
fi

# espeak-ng is misaki's fallback phonemiser for out-of-vocabulary words. Not installed silently:
# it is a system package and that is the operator's call.
if ! command -v espeak-ng >/dev/null 2>&1; then
  say "espeak-ng is missing — out-of-vocabulary words will fail to phonemise."
  say "  sudo apt-get install -y espeak-ng"
fi

if ! command -v uv >/dev/null 2>&1; then
  export PATH="$HOME/.local/bin:$PATH"
fi
if ! command -v uv >/dev/null 2>&1; then
  say "installing uv (needed for a pinned interpreter; nothing else uses it)"
  curl -LsSf https://astral.sh/uv/install.sh | sh >/dev/null
  export PATH="$HOME/.local/bin:$PATH"
fi

# --python 3.12 is NOT incidental. Ubuntu 26.04 ships Python 3.14 as its only interpreter and this
# stack has no wheels for it; uv fetches a standalone 3.12 without touching the system one.
mkdir -p "$TTS_DIR"
say "creating $VENV (python $PY_VER)"
uv venv --python "$PY_VER" "$VENV" >/dev/null

say "installing torch (CPU build — this box has no GPU and the model is 82M params)"
VIRTUAL_ENV="$VENV" uv pip install --quiet torch --index-url https://download.pytorch.org/whl/cpu
say "installing kokoro + misaki[zh]"
VIRTUAL_ENV="$VENV" uv pip install --quiet "kokoro>=0.9.4" "misaki[zh]" soundfile numpy

# en_core_web_sm is misaki's ENGLISH tokenizer model, and without it en-US synthesis dies on the
# first call. misaki does try to fetch it itself — `G2P.__init__` calls `spacy.cli.download()` —
# but that shells out to `uv pip install` with no VIRTUAL_ENV set and fails with "No virtual
# environment found", which surfaces at synthesis time as a wall of unrelated torch warnings and
# no audio. It is pinned by URL rather than by `spacy download` for the same reason: that command
# is the one that does not work here. Match the wheel to spacy's own major.minor.
say "installing en_core_web_sm (misaki's en tokenizer — en-US synthesis fails without it)"
VIRTUAL_ENV="$VENV" uv pip install --quiet \
  "en_core_web_sm@https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.8.0/en_core_web_sm-3.8.0-py3-none-any.whl"

say "fetching $REPO_ID into $HF_HOME"
"$VENV/bin/python" - "$REPO_ID" <<'PYEOF'
import sys
from huggingface_hub import snapshot_download
snapshot_download(sys.argv[1], allow_patterns=['*.json', '*.pth', 'voices/*'])
PYEOF

say "ready — $(du -sh "$TTS_DIR" | cut -f1) in $TTS_DIR"
echo "$VENV"
