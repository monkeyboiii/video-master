#!/usr/bin/env bash
# Raw VO take -> en-US VO master (+ a review mix under the music bed).
# Splice, then a short list of named word-level tweaks. No EQ, denoise, gate,
# compression, limiting or overall gain — level stays the take's own.
# Rationale, measurements and every knob: edit-notes.md (## VO audio).
set -euo pipefail

EP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VM="$(cd "$EP_DIR/../../../.." && pwd)"
VID="DBX-APP-S03E001"
VER="v002"
TAKE="${TAKE:-take1}"
MEDIA="$VM/media/$VID/voiceover"
SRC="${1:-$MEDIA/${VID}_en-US_vo-${TAKE}.m4a}"
MUSIC="$VM/media/audio/freek-a-leek-instrumental.mp3"
OUT="$MEDIA/${VID}_en-US_vo_${VER}.wav"
REVIEW="$MEDIA/${VID}_en-US_vo_${VER}_review.mp3"
MIX="$MEDIA/${VID}_en-US_vo_${VER}_review-mix.mp3"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT

# Room-tone peaks sit ~-48 dB on this take; speech peaks ~-20 dB.
THRESHOLD=-34dB
MARGIN=0.06s,0.12s
SMOOTH=0.10s,0.08s
MUSIC_BELOW_VO=10   # dB the bed sits under the measured voice. Smaller = more present.

# Word-level tweaks. Offsets are seconds into the SPLICED audio and were authored
# against a 36.23s splice — if the three params above change they must be re-derived
# (locate words with: auto-editor whisper <file> <model> --split-words). SPLICE_DUR
# guards that. keep A B = pass through · gap D = insert D of silence · fast A B R = R x speed.
SPLICE_DUR=36.23
EDITS=(
  "keep 0 5.42"          # hook + "So the first step, build the app."
  "gap 0.35"             # beat before "Boom" — it landed too quick
  "keep 5.42 23.66"      # "Boom, ready in a minute" ... "go rider to rider" + "bow"
  "gap 0.15"             # separate bow / beg
  "keep 23.66 24.22"     # "beg"
  "gap 0.15"             # separate beg / tear up
  "keep 24.22 24.97"     # "tear up"
  "fast 24.97 26.93 1.15" # "pull out the whole childhood trauma" — rushed for comedy
  "keep 26.93 end"       # "Basically..." through "Mission accomplished."
)

command -v auto-editor >/dev/null || { echo "auto-editor not on PATH" >&2; exit 1; }
[ -f "$SRC" ] || { echo "missing source take: $SRC" >&2; exit 1; }
mkdir -p "$MEDIA"

peak_of() { ffmpeg -hide_banner -nostats -i "$1" -af ebur128=peak=true -f null - 2>&1 \
  | sed -n '/Summary:/,$p' | grep -A1 "True peak:" | grep -oP 'Peak:\s*\K[-0-9.]+'; }
lufs_of() { ffmpeg -hide_banner -nostats -i "$1" -af ebur128 -f null - 2>&1 \
  | sed -n '/Summary:/,$p' | grep -A1 "Integrated loudness:" | grep -oP 'I:\s*\K[-0-9.]+'; }
dur_of()  { ffprobe -v error -show_entries format=duration -of csv=p=0 "$1"; }

echo ">>> splice  $(basename "$SRC")"
auto-editor "$SRC" --edit "audio:threshold=$THRESHOLD" --margin "$MARGIN" --smooth "$SMOOTH" \
  -o "$TMP/spliced.wav"

D=$(dur_of "$TMP/spliced.wav")
if ! awk -v a="$D" -v b="$SPLICE_DUR" 'BEGIN{exit !(a-b<0.15 && b-a<0.15)}'; then
  echo "!! splice is ${D}s but the tweak offsets were authored against ${SPLICE_DUR}s." >&2
  echo "!! Re-derive EDITS before trusting this output." >&2
  exit 1
fi

echo ">>> tweaks: beat before Boom · bow/beg/tear-up spacing · faster childhood-trauma"
: > "$TMP/list.txt"; i=0
for e in "${EDITS[@]}"; do
  set -- $e; i=$((i+1)); P="$TMP/p$(printf %02d $i).wav"
  case "$1" in
    # -ss/-to MUST precede -i: as output options ffmpeg filters the whole stream
    # first and then trims the filtered timeline, which grabs the wrong audio.
    keep) END=$3; [ "$END" = end ] && END="$D"
          ffmpeg -y -v error -ss "$2" -to "$END" -i "$TMP/spliced.wav" -c:a pcm_s24le "$P" ;;
    gap)  ffmpeg -y -v error -f lavfi -i anullsrc=r=48000:cl=mono -t "$2" -c:a pcm_s24le "$P" ;;
    fast) ffmpeg -y -v error -ss "$2" -to "$3" -i "$TMP/spliced.wav" \
            -af "rubberband=tempo=$4:pitchq=quality:transients=crisp:formant=preserved" \
            -c:a pcm_s24le "$P" ;;
  esac
  echo "file '$P'" >> "$TMP/list.txt"
done
ffmpeg -y -v error -f concat -safe 0 -i "$TMP/list.txt" -ar 48000 -c:a pcm_s24le "$OUT"
ffmpeg -y -v error -i "$OUT" -ac 2 -ar 44100 -c:a libmp3lame -b:a 192k "$REVIEW"

if [ -f "$MUSIC" ]; then
  VO_I=$(lufs_of "$OUT"); MUS_I=$(lufs_of "$MUSIC")
  MG=$(awk -v v="$VO_I" -v m="$MUS_I" -v s="$MUSIC_BELOW_VO" 'BEGIN{printf "%.2f", v-s-m}')
  FADE=$(awk -v d="$(dur_of "$OUT")" 'BEGIN{printf "%.3f", (d-1.5>0)?d-1.5:0}')
  echo ">>> review mix: bed ${MUSIC_BELOW_VO} dB under the voice (${MG} dB, flat, no ducking)"
  ffmpeg -y -v error -i "$OUT" -i "$MUSIC" -filter_complex \
    "[0:a]aresample=48000,aformat=channel_layouts=stereo[v];\
[1:a]aresample=48000,aformat=channel_layouts=stereo,volume=${MG}dB,\
afade=t=in:st=0:d=0.5,afade=t=out:st=$FADE:d=1.5[m];\
[v][m]amix=inputs=2:duration=first:normalize=0[out]" \
    -map "[out]" -ar 44100 -c:a libmp3lame -b:a 192k "$MIX"
fi

echo ">>> done"
printf "  master : %s LUFS  peak %s dBFS  %ss  (spliced %ss)\n" \
  "$(lufs_of "$OUT")" "$(peak_of "$OUT")" "$(dur_of "$OUT")" "$D"
[ -f "$MIX" ] && printf "  mix    : %s LUFS  peak %s dBFS\n" "$(lufs_of "$MIX")" "$(peak_of "$MIX")"
