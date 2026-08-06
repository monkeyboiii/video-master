#!/usr/bin/env bash
# Raw VO takes -> two en-US soundtracks (+ review mixes under the music bed).
#
# Cuts are LINE-BOUNDARY ONLY: silence is trimmed where script.en-US.md starts a new
# line, and every pause inside a line is left exactly as delivered. That is why this
# episode uses auto-editor's manual ranges (--edit 1 --cut) instead of --edit audio,
# which would flatten in-sentence pauses too.
#
# No EQ, denoise, gate, compression, limiting, tempo or gain — level stays the take's
# own. The only level set anywhere is the music bed's.
# Rationale, measurements and the boundary table: edit-notes.md (## VO audio).
set -euo pipefail

EP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VM="$(cd "$EP_DIR/../../../.." && pwd)"
VID="DBX-APP-S03E000"
VER="v002"
MEDIA="$VM/media/$VID/voiceover"
EN_SRC="$MEDIA/${VID}_en-US_vo-take1-enfull.m4a"
CN_SRC="$MEDIA/${VID}_en-US_vo-take1-cnhook.m4a"
MUSIC="$VM/media/audio/praise-the-lord-instrumental.mp3"
OUT_EN="$MEDIA/${VID}_en-US_vo_${VER}.wav"          # English hook + body
OUT_CN="$MEDIA/${VID}_en-US_vo-cnhook_${VER}.wav"   # Chinese hook + English body
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT

BOUNDARY=0.30       # seconds of silence left at each script line break
MUSIC_BELOW_VO=7    # dB the bed sits under the measured voice. Smaller = more present.

# Ranges are seconds into each raw take and were derived by aligning a whisper
# transcript to the script's lines, then snapping to the real silence edges either
# side (see edit-notes.md). Re-derive them if a take is re-recorded.
# 5.62,7.29 is the hook's own line break ("...to the rest of the world," / "this whole
# scene..."), split in script.en-US.md so it trims like any other boundary.
EN_CUTS=(0,1.06sec 5.62sec,7.29sec 9.63sec,10.75sec 15.38sec,16.00sec 19.47sec,19.82sec
         22.45sec,22.57sec 23.81sec,23.99sec 26.29sec,27.46sec 30.33sec,31.19sec
         33.00sec,33.14sec 36.08sec,37.25sec 39.19sec,end)
# Same, but the whole English hook (line 1) is dropped so the Chinese hook can lead.
BODY_CUTS=(0,10.75sec 15.38sec,16.00sec 19.47sec,19.82sec 22.45sec,22.57sec
           23.81sec,23.99sec 26.29sec,27.46sec 30.33sec,31.19sec 33.00sec,33.14sec
           36.08sec,37.25sec 39.19sec,end)
CN_CUTS=(0,1.86sec 4.81sec,5.78sec 8.85sec,end)

command -v auto-editor >/dev/null || { echo "auto-editor not on PATH" >&2; exit 1; }
for f in "$EN_SRC" "$CN_SRC"; do [ -f "$f" ] || { echo "missing take: $f" >&2; exit 1; }; done
mkdir -p "$MEDIA"

lufs_of() { ffmpeg -hide_banner -nostats -i "$1" -af ebur128 -f null - 2>&1 \
  | sed -n '/Summary:/,$p' | grep -A1 "Integrated loudness:" | grep -oP 'I:\s*\K[-0-9.]+'; }
peak_of() { ffmpeg -hide_banner -nostats -i "$1" -af ebur128=peak=true -f null - 2>&1 \
  | sed -n '/Summary:/,$p' | grep -A1 "True peak:" | grep -oP 'Peak:\s*\K[-0-9.]+'; }
dur_of()  { ffprobe -v error -show_entries format=duration -of csv=p=0 "$1"; }

# splice SRC OUT CUT...   — manual ranges only, no automatic silence detection
splice() {
  local src="$1" out="$2"; shift 2
  local args=(); for r in "$@"; do args+=(--cut "$r"); done
  auto-editor "$src" --edit 1 "${args[@]}" -o "$out" >/dev/null 2>&1
}

echo ">>> splice english take at line boundaries"
splice "$EN_SRC" "$TMP/en_full.wav" "${EN_CUTS[@]}"
echo ">>> splice english body (hook dropped)"
splice "$EN_SRC" "$TMP/en_body.wav" "${BODY_CUTS[@]}"
echo ">>> splice chinese hook"
splice "$CN_SRC" "$TMP/cn_hook.wav" "${CN_CUTS[@]}"

ffmpeg -y -v error -i "$TMP/en_full.wav" -ar 48000 -c:a pcm_s24le "$OUT_EN"

echo ">>> soundtrack 2: chinese hook + english body"
# No silence is inserted at the join: the hook already ends with 0.30s of trail and the
# body opens with 0.15s of lead, so the language switch lands at ~0.45s on its own.
# concat demuxer needs byte-identical stream params; auto-editor emits pcm_s16le,
# so every piece gets normalised to one format before joining.
for p in cn_hook en_body; do
  ffmpeg -y -v error -i "$TMP/$p.wav" -ar 48000 -ac 1 -c:a pcm_s24le "$TMP/n_$p.wav"
done
printf "file '%s'\n" "$TMP/n_cn_hook.wav" "$TMP/n_en_body.wav" > "$TMP/list.txt"
ffmpeg -y -v error -f concat -safe 0 -i "$TMP/list.txt" -ar 48000 -c:a pcm_s24le "$OUT_CN"

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
  printf "  %-44s %s LUFS  peak %s dBFS  %ss\n" "$(basename "$OUT")" \
    "$(lufs_of "$OUT")" "$(peak_of "$OUT")" "$(dur_of "$OUT")"
done
