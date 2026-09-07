#!/usr/bin/env bash
# Take 1 en-US + take 1 zh-CN -> two soundtracks, each with a review mix under the bed.
#
# Sibling variants, not a translation pair: two separately authored reads of the same
# five beats. They are processed identically but never mixed with each other, and each
# bed gain is computed from its own voice level (the zh take is ~3 LU quieter).
#
# One continuous read per locale, so this is a straight splice — no takes to join. The
# en-US region stops short of the file end to drop a -33.3 dB handling noise at 35.45s
# after the last word.
#
# No EQ, denoise, gate, compression, limiting or tempo. The only level set anywhere is the
# bed's. Rationale, region table and measurements: edit-notes.md (## VO audio).
set -euo pipefail

EP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VM="$(cd "$EP_DIR/../../../.." && pwd)"
VID="S04E001"
VER="v001"
MEDIA="$VM/media/$VID/voiceover"
MUSIC="$VM/media/audio/california-love.mp3"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT

# House settings, unchanged since S03E002 v004.
THRESHOLD=-34dB
MARGIN=0.06s,0.12s
SMOOTH=0.10s,0.08s
MUSIC_BELOW_VO=8.5  # dB the bed sits under the measured voice (10 read quiet, 7 read loud)
MUSIC_START=0       # s into the track

# Regions are absolute seconds into each take, cut a little wide; auto-editor trims the
# edges to MARGIN.
R_EN="$MEDIA/${VID}_en-US_vo-take1.m4a 0.60 35.20"   # ...stops before the handling noise
R_ZH="$MEDIA/${VID}_zh-CN_vo-take1.m4a 0.60 30.81"

command -v auto-editor >/dev/null || { echo "auto-editor not on PATH" >&2; exit 1; }
mkdir -p "$MEDIA"

lufs_of() { ffmpeg -hide_banner -nostats -i "$1" -af ebur128 -f null - 2>&1 \
  | sed -n '/Summary:/,$p' | grep -A1 "Integrated loudness:" | grep -oP 'I:\s*\K[-0-9.]+'; }
peak_of() { ffmpeg -hide_banner -nostats -i "$1" -af ebur128=peak=true -f null - 2>&1 \
  | sed -n '/Summary:/,$p' | grep -A1 "True peak:" | grep -oP 'Peak:\s*\K[-0-9.]+'; }
dur_of()  { ffprobe -v error -show_entries format=duration -of csv=p=0 "$1"; }

splice() {  # splice <out.wav> <"file start end">; cut dead air at unity
  local out="$1"; set -- $2
  [ -f "$1" ] || { echo "missing source: $1" >&2; exit 1; }
  ffmpeg -y -v error -ss "$2" -to "$3" -i "$1" -ar 48000 -ac 1 -c:a pcm_s24le "$TMP/raw.wav"
  auto-editor "$TMP/raw.wav" --edit "audio:threshold=$THRESHOLD" \
    --margin "$MARGIN" --smooth "$SMOOTH" -o "$TMP/cut.wav" >/dev/null
  ffmpeg -y -v error -i "$TMP/cut.wav" -ar 48000 -ac 1 -c:a pcm_s24le "$out"
}

mixdown() {  # mixdown <master.wav>; writes the dry review mp3 and the bed mix
  local out="$1" base="${1%.wav}" mg fade
  ffmpeg -y -v error -i "$out" -ac 2 -ar 44100 -c:a libmp3lame -b:a 192k "${base}_review.mp3"
  [ -f "$MUSIC" ] || return 0
  mg=$(awk -v v="$(lufs_of "$out")" -v m="$(lufs_of "$MUSIC")" -v s="$MUSIC_BELOW_VO" \
        'BEGIN{printf "%.2f", v-s-m}')
  fade=$(awk -v d="$(dur_of "$out")" 'BEGIN{printf "%.3f", (d-1.5>0)?d-1.5:0}')
  echo "    bed at ${mg} dB from ${MUSIC_START}s"
  ffmpeg -y -v error -i "$out" -ss "$MUSIC_START" -i "$MUSIC" -filter_complex \
    "[0:a]aresample=48000,aformat=channel_layouts=stereo[v];\
[1:a]aresample=48000,aformat=channel_layouts=stereo,volume=${mg}dB,\
afade=t=in:st=0:d=0.5,afade=t=out:st=$fade:d=1.5[m];\
[v][m]amix=inputs=2:duration=first:normalize=0[out]" \
    -map "[out]" -ar 44100 -c:a libmp3lame -b:a 192k "${base}_review-mix.mp3"
}

for LOC in en-US zh-CN; do
  [ "$LOC" = en-US ] && REGION="$R_EN" || REGION="$R_ZH"
  OUT="$MEDIA/${VID}_${LOC}_vo_${VER}.wav"
  echo ">>> $LOC"
  splice "$OUT" "$REGION"
  mixdown "$OUT"
  printf "    %-40s %s LUFS  peak %s dBFS  %ss\n" "$(basename "$OUT")" \
    "$(lufs_of "$OUT")" "$(peak_of "$OUT")" "$(dur_of "$OUT")"
done
