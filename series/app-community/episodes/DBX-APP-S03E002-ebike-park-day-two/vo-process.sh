#!/usr/bin/env bash
# Raw VO take -> en-US VO master (+ a review mix under the music bed).
# PURE SPLICE: dead air is cut and nothing else is touched — no EQ, denoise, gate,
# compression, limiting, tempo or gain. The only level set anywhere is the music bed's.
# Rationale, measurements and every knob: edit-notes.md (## VO audio).
set -euo pipefail

EP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VM="$(cd "$EP_DIR/../../../.." && pwd)"
VID="DBX-APP-S03E002"
VER="v004"
TAKE="${TAKE:-take2}"
MEDIA="$VM/media/$VID/voiceover"
SRC="${1:-$MEDIA/${VID}_en-US_vo-${TAKE}.m4a}"
MUSIC="$VM/media/audio/50-cent-just-a-lil-bit-instrumental.mp3"
OUT="$MEDIA/${VID}_en-US_vo_${VER}.wav"
REVIEW="$MEDIA/${VID}_en-US_vo_${VER}_review.mp3"
MIX="$MEDIA/${VID}_en-US_vo_${VER}_review-mix.mp3"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT

# Room-tone peaks sit ~-47 dB on both takes; speech peaks ~-17 dB.
# mincut under ~0.15s is what removes the short in-phrase pauses ("jumps, berms").
THRESHOLD=-34dB
MARGIN=0.06s,0.12s
SMOOTH=0.10s,0.08s
TEMPO=1.0           # 1.0 = off (pure splice). Set e.g. 1.05 to re-enable the speed-up.
MUSIC_BELOW_VO=10   # dB the bed sits under the measured voice. Smaller = more present.

command -v auto-editor >/dev/null || { echo "auto-editor not on PATH" >&2; exit 1; }
[ -f "$SRC" ] || { echo "missing source take: $SRC" >&2; exit 1; }
mkdir -p "$MEDIA"

peak_of() { ffmpeg -hide_banner -nostats -i "$1" -af ebur128=peak=true -f null - 2>&1 \
  | sed -n '/Summary:/,$p' | grep -A1 "True peak:" | grep -oP 'Peak:\s*\K[-0-9.]+'; }
lufs_of() { ffmpeg -hide_banner -nostats -i "$1" -af ebur128 -f null - 2>&1 \
  | sed -n '/Summary:/,$p' | grep -A1 "Integrated loudness:" | grep -oP 'I:\s*\K[-0-9.]+'; }

echo ">>> splice  $(basename "$SRC")"
auto-editor "$SRC" --edit "audio:threshold=$THRESHOLD" --margin "$MARGIN" --smooth "$SMOOTH" \
  -o "$TMP/spliced.wav"

if [ "$TEMPO" = "1.0" ]; then
  echo ">>> no tempo / no gain / no correction -> $(basename "$OUT")"
  ffmpeg -y -v error -i "$TMP/spliced.wav" -ar 48000 -c:a pcm_s24le "$OUT"
else
  echo ">>> tempo ${TEMPO}x (pitch + formants preserved) -> $(basename "$OUT")"
  ffmpeg -y -v error -i "$TMP/spliced.wav" \
    -af "rubberband=tempo=$TEMPO:pitchq=quality:transients=crisp:formant=preserved" \
    -ar 48000 -c:a pcm_s24le "$OUT"
fi
ffmpeg -y -v error -i "$OUT" -ac 2 -ar 44100 -c:a libmp3lame -b:a 192k "$REVIEW"

if [ -f "$MUSIC" ]; then
  VO_I=$(lufs_of "$OUT"); MUS_I=$(lufs_of "$MUSIC")
  MG=$(awk -v v="$VO_I" -v m="$MUS_I" -v s="$MUSIC_BELOW_VO" 'BEGIN{printf "%.2f", v-s-m}')
  DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT")
  FADE=$(awk -v d="$DUR" 'BEGIN{printf "%.3f", (d-1.5>0)?d-1.5:0}')
  echo ">>> review mix: bed ${MUSIC_BELOW_VO} dB under the voice (${MG} dB, flat, no ducking)"
  ffmpeg -y -v error -i "$OUT" -i "$MUSIC" -filter_complex \
    "[0:a]aresample=48000,aformat=channel_layouts=stereo[v];\
[1:a]aresample=48000,aformat=channel_layouts=stereo,volume=${MG}dB,\
afade=t=in:st=0:d=0.5,afade=t=out:st=$FADE:d=1.5[m];\
[v][m]amix=inputs=2:duration=first:normalize=0[out]" \
    -map "[out]" -ar 44100 -c:a libmp3lame -b:a 192k "$MIX"
fi

echo ">>> done"
printf "  master : %s LUFS  peak %s dBFS  %ss  (untouched level)\n" \
  "$(lufs_of "$OUT")" "$(peak_of "$OUT")" \
  "$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT")"
[ -f "$MIX" ] && printf "  mix    : %s LUFS  peak %s dBFS\n" "$(lufs_of "$MIX")" "$(peak_of "$MIX")"
