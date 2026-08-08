#!/usr/bin/env bash
# Take 4 -> two en-US soundtracks (+ review mixes under the music bed).
#
# Cuts are LINE-BOUNDARY ONLY: every script line is kept whole with PAD either side, so
# consecutive lines land 2*PAD apart and pauses *inside* a line survive as delivered.
# Offsets are seconds into the raw takes, so nothing shifts when a range is edited.
#
# One line is special. "Which apparently means (drums rolling...) Huzhou" was delivered as
# the drumroll sound and the words "drum rolling" back to back; they are MIXED ON TOP OF
# EACH OTHER here (`mix`), not played in sequence.
#
# No EQ, denoise, gate, compression, limiting, tempo or gain — level stays the take's own.
# The only level set anywhere is the music bed's.
# Rationale and the line table: edit-notes.md (## VO audio).
set -euo pipefail

EP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VM="$(cd "$EP_DIR/../../../.." && pwd)"
VID="DBX-APP-S03E001"
VER="v004"
MEDIA="$VM/media/$VID/voiceover"
EN_SRC="$MEDIA/${VID}_en-US_vo-take4-enfull.m4a"
CN_SRC="$MEDIA/${VID}_en-US_vo-take4-cnhook.m4a"
MUSIC="$VM/media/audio/freek-a-leek-instrumental.mp3"
OUT_EN="$MEDIA/${VID}_en-US_vo_${VER}.wav"
OUT_CN="$MEDIA/${VID}_en-US_vo-cnhook_${VER}.wav"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT

PAD=0.15            # kept either side of every line -> 0.30s between lines
MUSIC_BELOW_VO=7    # dB the bed sits under the measured voice. Smaller = more present.

# One entry per spoken script line, in order. `mix A B C D` overlays [A,B] with [C,D].
EN_LINES=(
  "0.88 4.69"     # Second step, get your girlfriend to drive you to the best track...
  "5.54 6.62"     # Which apparently means...
  "mix 8.37 9.12 10.43 11.18"   # [drumroll] + "drum rolling" — layered, not sequential
  "12.89 13.44"   # Huzhou
  "14.74 16.58"   # Alright~ Track number one!
  "18.73 22.18"   # And five minutes in, everybody keeps pointing me toward this guy.
  "23.34 26.72"   # Turns out, this guy basically grew up on this track (literally)
  "27.80 31.47"   # every jump, every line, he knows it by heart.
  "32.80 34.20"   # That's what I'm talking about!
  "35.60 39.73"   # And yeah to a rookie like myself, one day barely scratches the surface.
  "40.25 42.85"   # A track is way more than just dirt.
  "43.51 47.03"   # There are enough riders and stories here to keep me coming back...
  "47.86 51.30"   # And don't forget to pay a visit to the track mascot, the track dog!
  "51.87 52.93"   # What's up you little cutie~
  "53.71 55.76"   # That's it. Track one down.
)
CN_LINES=("0.84 3.06" "4.31 6.38")

[ -f "$EN_SRC" ] || { echo "missing take: $EN_SRC" >&2; exit 1; }
[ -f "$CN_SRC" ] || { echo "missing take: $CN_SRC" >&2; exit 1; }
mkdir -p "$MEDIA"

lufs_of() { ffmpeg -hide_banner -nostats -i "$1" -af ebur128 -f null - 2>&1 \
  | sed -n '/Summary:/,$p' | grep -A1 "Integrated loudness:" | grep -oP 'I:\s*\K[-0-9.]+'; }
peak_of() { ffmpeg -hide_banner -nostats -i "$1" -af ebur128=peak=true -f null - 2>&1 \
  | sed -n '/Summary:/,$p' | grep -A1 "True peak:" | grep -oP 'Peak:\s*\K[-0-9.]+'; }
dur_of()  { ffprobe -v error -show_entries format=duration -of csv=p=0 "$1"; }
sub() { awk -v a="$1" -v b="$2" 'BEGIN{printf "%.3f", (a-b<0)?0:a-b}'; }
add() { awk -v a="$1" -v b="$2" 'BEGIN{printf "%.3f", a+b}'; }

# build SRC OUT LINE...  — one PCM piece per line, concatenated in order
build() {
  local src="$1" out="$2"; shift 2
  local i=0; : > "$TMP/list.txt"
  for spec in "$@"; do
    set -- $spec; i=$((i+1)); local P="$TMP/$(basename "$out" .wav)_$(printf %02d $i).wav"
    if [ "$1" = mix ]; then
      ffmpeg -y -v error -ss "$(sub "$2" $PAD)" -to "$(add "$3" $PAD)" -i "$src" \
        -ar 48000 -ac 1 -c:a pcm_s24le "$TMP/mx_a.wav"
      ffmpeg -y -v error -ss "$(sub "$4" $PAD)" -to "$(add "$5" $PAD)" -i "$src" \
        -ar 48000 -ac 1 -c:a pcm_s24le "$TMP/mx_b.wav"
      ffmpeg -y -v error -i "$TMP/mx_a.wav" -i "$TMP/mx_b.wav" \
        -filter_complex "[0:a][1:a]amix=inputs=2:duration=longest:normalize=0[o]" \
        -map "[o]" -ar 48000 -ac 1 -c:a pcm_s24le "$P"
    else
      ffmpeg -y -v error -ss "$(sub "$1" $PAD)" -to "$(add "$2" $PAD)" -i "$src" \
        -ar 48000 -ac 1 -c:a pcm_s24le "$P"
    fi
    echo "file '$P'" >> "$TMP/list.txt"
  done
  ffmpeg -y -v error -f concat -safe 0 -i "$TMP/list.txt" -ar 48000 -c:a pcm_s24le "$out"
}

echo ">>> english: ${#EN_LINES[@]} script lines, drumroll layered"
build "$EN_SRC" "$OUT_EN" "${EN_LINES[@]}"
echo ">>> chinese hook + english body"
build "$CN_SRC" "$TMP/cn_hook.wav" "${CN_LINES[@]}"
printf "file '%s'\n" "$TMP/cn_hook.wav" "$OUT_EN" > "$TMP/join.txt"
ffmpeg -y -v error -f concat -safe 0 -i "$TMP/join.txt" -ar 48000 -c:a pcm_s24le "$OUT_CN"

for OUT in "$OUT_EN" "$OUT_CN"; do
  BASE="${OUT%.wav}"
  ffmpeg -y -v error -i "$OUT" -ac 2 -ar 44100 -c:a libmp3lame -b:a 192k "${BASE}_review.mp3"
  [ -f "$MUSIC" ] || continue
  MG=$(awk -v v="$(lufs_of "$OUT")" -v m="$(lufs_of "$MUSIC")" -v s="$MUSIC_BELOW_VO" \
        'BEGIN{printf "%.2f", v-s-m}')
  FADE=$(awk -v d="$(dur_of "$OUT")" 'BEGIN{printf "%.3f", (d-1.5>0)?d-1.5:0}')
  ffmpeg -y -v error -i "$OUT" -i "$MUSIC" -filter_complex \
    "[0:a]aresample=48000,aformat=channel_layouts=stereo[v];\
[1:a]aresample=48000,aformat=channel_layouts=stereo,volume=${MG}dB,\
afade=t=in:st=0:d=0.5,afade=t=out:st=$FADE:d=1.5[m];\
[v][m]amix=inputs=2:duration=first:normalize=0[out]" \
    -map "[out]" -ar 44100 -c:a libmp3lame -b:a 192k "${BASE}_review-mix.mp3"
done

echo ">>> done"
for OUT in "$OUT_EN" "$OUT_CN"; do
  printf "  %-46s %s LUFS  peak %s dBFS  %ss\n" "$(basename "$OUT")" \
    "$(lufs_of "$OUT")" "$(peak_of "$OUT")" "$(dur_of "$OUT")"
done
