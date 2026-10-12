#!/usr/bin/env bash
# S07E001 audio, end to end, from a work dir (gitignored) holding the bed:
#   bgm-hth.mp3   "AC DC - Highway To Hell (Instrumental).mp3"
# The committed JSONs beside this script are the recorded run; this regenerates them.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PY="${DBX_TTS_DIR:-$HOME/.cache/dbx-tts}/venv/bin/python"
cp "$HERE/lines.tsv" .
HF_HOME="${DBX_TTS_DIR:-$HOME/.cache/dbx-tts}/hf" "$PY" "$HERE/tts_take.py"              # TTS stand-in take
ffmpeg -y -v error -i take-tts-24k.wav -af aresample=48000:resampler=soxr -c:a pcm_f32le take48.wav
auto-editor take48.wav --edit audio:-35dB --margin 0.08s,0.09s --export v3 -o cut-35.v3 --no-open
"$PY" "$HERE/segs-from-v3.py" cut-35.v3 segs-35.json
"$PY" "$HERE/lines_cut.py"
ffmpeg -y -v error -i bgm-hth.mp3 -t 100 -af aresample=48000:resampler=soxr -c:a pcm_f32le bgm100.wav
"$PY" "$HERE/bgm-grid.py" bgm100.wav
# anchors: 第一步 on bar 3, 骑电驴 on the drum entry, the CTA on the chorus downbeat
"$PY" "$HERE/place.py" '{"1":6.713,"2":8.800,"16":50.534}'
"$PY" "$HERE/voice_track.py"
"$PY" "$HERE/mix_s07.py"
I=$(ffmpeg -i pre.wav -af loudnorm=print_format=json -f null - 2>&1 | grep '"input_i"' | grep -oE -- '-?[0-9.]+')
G=$(python3 -c "print(round(-14-($I),2))")    # static gain + limiter, never dynamic loudnorm
for x in "pre.wav S07E001-mix.wav" "voice-v1.wav S07E001-voice-tts.wav"; do set -- $x
  ffmpeg -y -v error -i "$1" -af "volume=${G}dB,alimiter=limit=0.8414:attack=5:release=50:level=0" -c:a pcm_s16le "$2"
done
