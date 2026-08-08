#!/usr/bin/env bash
# Takes 1 + 4 -> two en-US soundtracks (+ review mixes under the music bed).
#
# The hook and first-step lines were never re-recorded for take 4, so they come from
# take 1, which uses take 4's wording ("...Thanks to my nerdy side"). Take 1 was recorded
# quieter, so its pieces get a linear gain to match take 4 — measured, not guessed.
#
# Each script line is one entry below and may list several sub-phrases. Sub-phrases join
# at INTRA, lines join at 2*PAD. Offsets are absolute positions in the raw takes, so
# editing one range never shifts another. Blips (breaths, mouth clicks) are excluded from
# the ranges, which is what keeps dead air off the end of a line.
#
# No EQ, denoise, gate, compression, limiting or tempo. The only levels set anywhere are
# take 1's match gain and the music bed's.
# Rationale and the line table: edit-notes.md (## VO audio).
set -euo pipefail

EP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VM="$(cd "$EP_DIR/../../../.." && pwd)"
VID="DBX-APP-S03E001"
VER="v005"
MEDIA="$VM/media/$VID/voiceover"
T1="$MEDIA/${VID}_en-US_vo-take1.m4a"
T4="$MEDIA/${VID}_en-US_vo-take4-enfull.m4a"
CN="$MEDIA/${VID}_en-US_vo-take4-cnhook.m4a"
MUSIC="$VM/media/audio/freek-a-leek-instrumental.mp3"
OUT_EN="$MEDIA/${VID}_en-US_vo_${VER}.wav"
OUT_CN="$MEDIA/${VID}_en-US_vo-cnhook_${VER}.wav"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT

PAD=0.15            # kept either side of a line   -> 0.30s between lines
INTRA=0.06          # kept either side of a phrase -> 0.12s inside a line
MUSIC_BELOW_VO=7    # dB the bed sits under the measured voice

# "<src> a b [a b ...]" — one entry per spoken script line.
HOOK_EN=("t1 1.43 5.00")                                # I'm gonna be building the best community...
FIRST=("t1 6.63 7.42 8.97 9.55"                         # First step, build the app.
       "t1 11.46 12.00 12.83 13.62 15.43 16.62")        # Boom. Ready in a minute. Thanks to my nerdy side.
BODY=("t4 0.88 1.49 1.97 4.69"                          # Second step, get your girlfriend to the best track...
      "t4 5.54 6.62"                                    # Which apparently means...
      "t4 10.43 11.18"                                  # (drums rolling) — the spoken line only
      "t4 12.89 13.44"                                  # Huzhou
      "t4 14.74 15.28 15.67 16.58"                      # Alright~ Track number one!
      "t4 18.73 19.81 20.17 22.18"                      # And five minutes in, everybody keeps pointing...
      "t4 23.34 23.89 24.14 26.72"                      # Turns out, this guy grew up on this track (literally)
      "t4 28.11 28.73 28.97 29.54 30.13 30.96"          # every jump, every line, he knows it by heart.
      "t4 32.80 34.20"                                  # That's what I'm talking about!
      "t4 35.60 37.21 37.61 39.37"                      # And yeah to a rookie like myself, one day barely...
      "t4 41.08 42.39 42.50 42.85"                      # A track is way more than just dirt.
      "t4 43.51 47.03"                                  # There are enough riders and stories here...
      "t4 47.86 50.26 50.51 51.30"                      # And don't forget the track mascot, the track dog!
      "t4 51.87 52.93"                                  # What's up you little cutie~
      "t4 53.71 54.17 54.43 55.76")                     # That's it. Track one down.
CN_HOOK=("cn 0.84 3.06" "cn 4.31 6.38")

for f in "$T1" "$T4" "$CN"; do [ -f "$f" ] || { echo "missing take: $f" >&2; exit 1; }; done
mkdir -p "$MEDIA"

lufs_of() { ffmpeg -hide_banner -nostats -i "$1" -af ebur128 -f null - 2>&1 \
  | sed -n '/Summary:/,$p' | grep -A1 "Integrated loudness:" | grep -oP 'I:\s*\K[-0-9.]+'; }
peak_of() { ffmpeg -hide_banner -nostats -i "$1" -af ebur128=peak=true -f null - 2>&1 \
  | sed -n '/Summary:/,$p' | grep -A1 "True peak:" | grep -oP 'Peak:\s*\K[-0-9.]+'; }
dur_of()  { ffprobe -v error -show_entries format=duration -of csv=p=0 "$1"; }
fadd() { awk -v a="$1" -v b="$2" 'BEGIN{printf "%.3f", (a+b<0)?0:a+b}'; }

GAIN_T1=$(awk -v a="$(lufs_of "$T4")" -v b="$(lufs_of "$T1")" 'BEGIN{printf "%.2f", a-b}')
echo ">>> take 1 gain-matched to take 4: ${GAIN_T1} dB (linear, no dynamics)"

IDX=0
emit() {  # emit <listfile> <entry>
  local lf="$1"; set -- $2; local src="$1"; shift
  local file gain=0
  case "$src" in t1) file="$T1"; gain="$GAIN_T1";; t4) file="$T4";; cn) file="$CN";; esac
  local nsub=$(( $# / 2 )) i=0
  while [ $# -ge 2 ]; do
    i=$((i+1)); IDX=$((IDX+1))
    local lead=$INTRA tail=$INTRA
    [ $i -eq 1 ] && lead=$PAD
    [ $i -eq $nsub ] && tail=$PAD
    local P="$TMP/p$(printf %04d $IDX).wav"
    ffmpeg -y -v error -ss "$(fadd "$1" "-$lead")" -to "$(fadd "$2" "$tail")" -i "$file" \
      -af "volume=${gain}dB" -ar 48000 -ac 1 -c:a pcm_s24le "$P"
    echo "file '$P'" >> "$lf"
    shift 2
  done
}

build() { local lf="$TMP/l$$.txt"; : > "$lf"; local out="$1"; shift
  for e in "$@"; do emit "$lf" "$e"; done
  ffmpeg -y -v error -f concat -safe 0 -i "$lf" -ar 48000 -c:a pcm_s24le "$out"; rm -f "$lf"; }

echo ">>> english: hook + first step (take 1) + body (take 4)"
build "$OUT_EN" "${HOOK_EN[@]}" "${FIRST[@]}" "${BODY[@]}"
echo ">>> chinese hook replaces the english hook"
build "$OUT_CN" "${CN_HOOK[@]}" "${FIRST[@]}" "${BODY[@]}"

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
