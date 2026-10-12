#!/usr/bin/env bash
# S05E003 audio, end to end. Run from a work dir holding the inputs (gitignored, not committed):
#   S05E003-cn.m4a              the operator's take (it reached the Mac misnamed S05E002-cn.m4a)
#   ACDC_-_TNT_Instrumental.wav the bed
#   tts-49er-48k.wav            Kokoro zm_yunxi, speed 1.15: 这就是四九年入国军吗？
#   tts-ganma-xx-48k.wav        Kokoro zf_xiaoxiao, speed 1.15: 你想干嘛？
# Python is the TTS venv (numpy + soundfile): ${DBX_TTS_DIR:-~/.cache/dbx-tts}/venv/bin/python
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PY="${DBX_TTS_DIR:-$HOME/.cache/dbx-tts}/venv/bin/python"
ffmpeg -y -v error -i S05E003-cn.m4a -ar 48000 -ac 1 -af "$(cat "$HERE/eq-chain.txt")" -c:a pcm_f32le take48e.wav
"$PY" "$HERE/build-voice.py" take48e.wav voice.wav
"$PY" "$HERE/mix-bed.py" voice.wav pre.wav
I=$(ffmpeg -i pre.wav -af loudnorm=print_format=json -f null - 2>&1 | grep '"input_i"' | grep -oE -- '-?[0-9.]+')
G=$(python3 -c "print(round(-14-($I),2))")    # static gain + limiter, never dynamic loudnorm
for x in "pre.wav S05E003-mix.wav" "voice.wav S05E003-voice-only.wav"; do set -- $x
  ffmpeg -y -v error -i "$1" -af "volume=${G}dB,alimiter=limit=0.8414:attack=5:release=50:level=0" -c:a pcm_s16le "$2"
done
