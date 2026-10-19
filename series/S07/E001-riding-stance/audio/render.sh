#!/usr/bin/env bash
# S07E001 audio, end to end, from a work dir (gitignored) holding the bed and the operator's take:
#   bgm-hth.mp3   "AC DC - Highway To Hell (Instrumental).mp3"
#   take.m4a      the operator's read of lines 1-17 ("New Recording.m4a", 2026-10-12); the hook stays TTS
# The committed JSONs beside this script are the recorded run; this regenerates them.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PY="${DBX_TTS_DIR:-$HOME/.cache/dbx-tts}/venv/bin/python"
cp "$HERE/lines.tsv" "$HERE/take-lines.json" .
echo "f7391e787bd116321183150d871a355a22bba4747af876e9d7f7161ce44c9dd3  take.m4a" | sha256sum -c --quiet
ffmpeg -y -v error -i take.m4a -af aresample=48000:resampler=soxr -c:a pcm_f32le take48.wav
# -40 dB: the take is -29.0 LUFS, about S05E003's phone take (-29.8, cut at -40); the stand-in, 5 dB hotter, took -35
auto-editor take48.wav --edit audio:-40dB --margin 0.08s,0.10s --export v3 -o cut-40.v3 --no-open
"$PY" "$HERE/segs-from-v3.py" cut-40.v3 segs-40.json
"$PY" "$HERE/take_meta.py"
"$PY" "$HERE/lines_cut.py" segs-40.json -40
ffmpeg -y -v error -i bgm-hth.mp3 -t 100 -af aresample=48000:resampler=soxr -c:a pcm_f32le bgm100.wav
"$PY" "$HERE/bgm-grid.py" bgm100.wav
ffmpeg -y -v error -i bgm-hth.mp3 -t 130 -af aresample=48000:resampler=soxr -c:a pcm_f32le bgm130.wav
"$PY" "$HERE/bed_edit.py"                       # verse 1 into verse 2: chorus 2 lifts on bar 28
# anchors, on the (edited) bed's clock: 第一步 after the riff's long last hit (7.5-7.9s), so the full-volume riff
# does not mask the header; 没问题 on chorus 2's lift (bar 28). The stand-in also pinned 骑电驴 to the beat after
# the drum entry; the take's 第一步，注意我们的脚 runs past it, so 骑电驴 follows at place.py's gap.
"$PY" "$HERE/place.py" '{"1":7.92,"16":58.88}'
HF_HOME="${DBX_TTS_DIR:-$HOME/.cache/dbx-tts}/hf" "$PY" "$HERE/hook_phrases.py"
for i in 0 1 2; do ffmpeg -y -v error -i hook$i-24k.wav -af aresample=48000:resampler=soxr -c:a pcm_f32le hook$i.wav; done
"$PY" "$HERE/voice_track.py"
# the intro riff at the voice's loudness: v1's measurement (voice -24.83, music 0-56s -12.51 LUFS), the level
# the operator approved; re-deriving it from each version's voice would move it with every edit to the hook
"$PY" "$HERE/levels.py" -12.32
# the pop: Freesound 202230 "Pop sound" by deraj, CC0 (https://freesound.org/s/202230/), its HQ preview
curl -sS -o sfx-pop.mp3 https://cdn.freesound.org/previews/202/202230_3725006-hq.mp3
echo "f710da77f4fcafb1dafb16b677b108469ee4127f03198738c3c0d3f39608aec7  sfx-pop.mp3" | sha256sum -c --quiet
"$PY" "$HERE/mix-bed.py"
I=$(ffmpeg -i pre.wav -af loudnorm=print_format=json -f null - 2>&1 | grep '"input_i"' | grep -oE -- '-?[0-9.]+')
G=$(python3 -c "print(round(-14-($I),2))")    # static gain + limiter, never dynamic loudnorm
for x in "pre.wav S07E001-mix.wav" "voice.wav S07E001-voice-tts.wav"; do set -- $x
  ffmpeg -y -v error -i "$1" -af "volume=${G}dB,alimiter=limit=0.8414:attack=5:release=50:level=0" -c:a pcm_s16le "$2"
done
