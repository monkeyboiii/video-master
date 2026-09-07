#!/usr/bin/env bash
# Take 1 zh-CN -> the soundtrack, plus a review mix under the bed.
#
# One continuous read and — for the first time in S03 — nothing to step over: no click, no
# stray breath, no handling noise above the threshold. So this is a single region, which is
# what the house settings were written for.
#
# No EQ, denoise, gate, compression, limiting, tempo or gain. The only level set anywhere is
# the bed's. Rationale and measurements: edit-notes.md (## VO audio).
set -euo pipefail

EP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VM="$(cd "$EP_DIR/../../../.." && pwd)"
VID="S05E001"
VER="v001"
MEDIA="$VM/media/$VID/voiceover"
TAKE="$MEDIA/${VID}_zh-CN_vo-take1.m4a"
OUT="$MEDIA/${VID}_zh-CN_vo_${VER}.wav"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT

# House settings, unchanged since S03E002 v004. Room tone peaks -44 to -49 dB on this take.
THRESHOLD=-34dB
MARGIN=0.06s,0.12s
SMOOTH=0.10s,0.08s
MUSIC_BELOW_VO=8.5  # dB the bed sits under the measured voice, as set on S03E003
# Candidate beds, "<file> <start_s>". The FIRST is the chosen one and writes the plain
# _review-mix.mp3; the rest write _review-mix-<name>.mp3 for A/B.
#
# Neither track is level with itself, so the start is chosen, not defaulted to 0:
#   show-me   ~20s intro 10 dB down, breakdowns at 40/100/130/170/190s. 50s begins the
#             flattest 49s window in the file (2.4 dB spread).
#   magnolia  only 70.09s long, and the drop is at 23s. 21s is the latest start that still
#             covers the full 49s master (21+49 = 70.0), so the bed swells in over ~2s under
#             the hook and is at full level from there.
#   freek     E001's bed, and the only one here that is flat from the first bar — 0.6 dB
#             spread across its first 49s, so 0 is a measured choice, not a default.
BEDS=(
  "show-me-instrumental.mp3 50"
  "playboi-carti-magnolia.mp3 21"
  "freek-a-leek-instrumental.mp3 0"
)

REGION="0.60 69.39"   # the whole read; the -38.7 dB handling noise at the tail is under
                      # threshold, so auto-editor drops it without help

command -v auto-editor >/dev/null || { echo "auto-editor not on PATH" >&2; exit 1; }
[ -f "$TAKE" ] || { echo "missing source: $TAKE" >&2; exit 1; }
mkdir -p "$MEDIA"

lufs_of() { ffmpeg -hide_banner -nostats ${2:+-ss "$2"} ${3:+-t "$3"} -i "$1" -af ebur128 \
  -f null - 2>&1 | sed -n '/Summary:/,$p' | grep -A1 "Integrated loudness:" \
  | grep -oP 'I:\s*\K[-0-9.]+'; }
peak_of() { ffmpeg -hide_banner -nostats -i "$1" -af ebur128=peak=true -f null - 2>&1 \
  | sed -n '/Summary:/,$p' | grep -A1 "True peak:" | grep -oP 'Peak:\s*\K[-0-9.]+'; }
dur_of()  { ffprobe -v error -show_entries format=duration -of csv=p=0 "$1"; }

set -- $REGION
echo ">>> splice"
ffmpeg -y -v error -ss "$1" -to "$2" -i "$TAKE" -ar 48000 -ac 1 -c:a pcm_s24le "$TMP/raw.wav"
auto-editor "$TMP/raw.wav" --edit "audio:threshold=$THRESHOLD" \
  --margin "$MARGIN" --smooth "$SMOOTH" -o "$TMP/cut.wav" >/dev/null
ffmpeg -y -v error -i "$TMP/cut.wav" -ar 48000 -ac 1 -c:a pcm_s24le "$OUT"

BASE="${OUT%.wav}"
DUR="$(dur_of "$OUT")"
VO_I="$(lufs_of "$OUT")"
FADE=$(awk -v d="$DUR" 'BEGIN{printf "%.3f", (d-1.5>0)?d-1.5:0}')
ffmpeg -y -v error -i "$OUT" -ac 2 -ar 44100 -c:a libmp3lame -b:a 192k "${BASE}_review.mp3"

for i in "${!BEDS[@]}"; do
  set -- ${BEDS[$i]}
  MUSIC="$VM/media/audio/$1"; MUSIC_START="$2"
  [ -f "$MUSIC" ] || { echo "    missing bed: $MUSIC" >&2; continue; }
  # Measure the bed over the WINDOW ACTUALLY USED, not the whole file: on a track with
  # breakdowns the two differ by several dB, and the whole-file figure silently leaves the
  # bed at the wrong level.
  MUSIC_I="$(lufs_of "$MUSIC" "$MUSIC_START" "$DUR")"
  MG=$(awk -v v="$VO_I" -v m="$MUSIC_I" -v s="$MUSIC_BELOW_VO" 'BEGIN{printf "%.2f", v-s-m}')
  if [ "$i" = 0 ]; then MIX="${BASE}_review-mix.mp3"
  else MIX="${BASE}_review-mix-$(echo "${1%%-instrumental*}" | sed 's/\.mp3$//;s/^playboi-carti-//').mp3"; fi
  echo ">>> $(basename "$MIX"): $1 from ${MUSIC_START}s, window ${MUSIC_I} LUFS, gain ${MG} dB"
  ffmpeg -y -v error -i "$OUT" -ss "$MUSIC_START" -i "$MUSIC" -filter_complex \
    "[0:a]aresample=48000,aformat=channel_layouts=stereo[v];\
[1:a]aresample=48000,aformat=channel_layouts=stereo,volume=${MG}dB,\
afade=t=in:st=0:d=0.5,afade=t=out:st=$FADE:d=1.5[m];\
[v][m]amix=inputs=2:duration=first:normalize=0[out]" \
    -map "[out]" -ar 44100 -c:a libmp3lame -b:a 192k "$MIX"
done

echo ">>> done"
printf "  %-42s %s LUFS  peak %s dBFS  %ss\n" "$(basename "$OUT")" \
  "$(lufs_of "$OUT")" "$(peak_of "$OUT")" "$(dur_of "$OUT")"
