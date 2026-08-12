#!/usr/bin/env bash
# Take 2 + rev-2 ending (+ rev-2 Chinese hook) -> two en-US soundtracks.
#
# Script rev 2 keeps take 2's hook and body verbatim and replaces everything from
# "Anyway, enough of that." onward with a new read: the owner became the boss, and he
# turns the app down. Only the hook differs between the two soundtracks.
#
# Each source region is spliced on its own with the same auto-editor settings that made
# v004, then the pieces are concatenated. That keeps v004's pacing inside every region
# while leaving the joins — and the record-scratch hole — under explicit control.
#
# No EQ, denoise, gate, compression, limiting or tempo. The only levels set anywhere are
# the rev-2 takes' match gain (they were recorded quieter) and the bed's.
# Rationale, region table and measurements: edit-notes.md (## VO audio).
set -euo pipefail

EP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VM="$(cd "$EP_DIR/../../../.." && pwd)"
VID="DBX-APP-S03E002"
VER="v007"
MEDIA="$VM/media/$VID/voiceover"
T2="$MEDIA/${VID}_en-US_vo-take2.m4a"
ND="$MEDIA/${VID}_en-US_vo-rev2-ending.m4a"
CN="$MEDIA/${VID}_en-US_vo-rev2-cnhook.m4a"
MUSIC="$VM/media/audio/50-cent-just-a-lil-bit-instrumental.mp3"
SFX="$VM/media/sfx/record-scratch.mp3"
OUT_EN="$MEDIA/${VID}_en-US_vo_${VER}.wav"
OUT_CN="$MEDIA/${VID}_en-US_vo-cnhook_${VER}.wav"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT

# v004 settings, unchanged. Room-tone peaks sit ~-47 dB on every take here.
THRESHOLD=-34dB
MARGIN=0.06s,0.12s
JOIN_TAIL=0.060     # s of silence left after "...solid advice" — the line runs on
JOIN_HEAD=0.040     # s left before "for enduro riders"; 0.10s total = a word boundary
SMOOTH=0.10s,0.08s
SCRATCH_GAP=1.20    # s of hole left for the record scratch, matching the delivered pause
MUSIC_BELOW_VO=10   # dB the bed sits under the measured voice
SFX_BELOW_VO_PEAK=14 # dB the scratch peaks under the voice, review mix only
SFX_TRIM=0.180      # s of lead silence trimmed; the hit's onset is at 0.183
SFX_FADE_IN=0.06    # s ramp, quadratic; the raw file goes silent -> full in 12ms
SFX_FADE_CURVE=qua  # faint start then rise — linear still read as a hard edge

# Regions are absolute seconds into each raw take, cut a little wide; auto-editor trims
# the edges to MARGIN. Editing one never shifts another.
R_ENHOOK="$T2 0.60 7.90"   # Day two... / ...back in my hometown.
R_BODY="$T2 9.40 50.30"    # I used to ride... -> Oh man, the flashbacks!
R_ENDA="$ND 0.30 5.15"     # Anyways, enough of that. / ...find the boss, / show him my gorgeous app and
R_ENDB1="$ND 6.15 13.85"   # Yeah, not quite. / He passed on the app, but gave me some solid advice
R_ENDB2="$ND 15.00 23.60"  # - for enduro riders... -> electric warriors, let's go?!
R_CNHOOK="$CN 1.10 6.60"   # 走遍100个越野摩托车场的第二集，搿趟...回屋里厢！

command -v auto-editor >/dev/null || { echo "auto-editor not on PATH" >&2; exit 1; }
for f in "$T2" "$ND" "$CN"; do [ -f "$f" ] || { echo "missing source: $f" >&2; exit 1; }; done
mkdir -p "$MEDIA"

lufs_of() { ffmpeg -hide_banner -nostats -i "$1" -af ebur128 -f null - 2>&1 \
  | sed -n '/Summary:/,$p' | grep -A1 "Integrated loudness:" | grep -oP 'I:\s*\K[-0-9.]+'; }
peak_of() { ffmpeg -hide_banner -nostats -i "$1" -af ebur128=peak=true -f null - 2>&1 \
  | sed -n '/Summary:/,$p' | grep -A1 "True peak:" | grep -oP 'Peak:\s*\K[-0-9.]+'; }
dur_of()  { ffprobe -v error -show_entries format=duration -of csv=p=0 "$1"; }

splice() {  # splice <name> <"file start end">  -> $TMP/<name>.wav, spliced at unity
  local name="$1"; set -- $2
  ffmpeg -y -v error -ss "$2" -to "$3" -i "$1" -ar 48000 -ac 1 -c:a pcm_s24le "$TMP/${name}_raw.wav"
  auto-editor "$TMP/${name}_raw.wav" --edit "audio:threshold=$THRESHOLD" \
    --margin "$MARGIN" --smooth "$SMOOTH" -o "$TMP/${name}_cut.wav" >/dev/null
  ffmpeg -y -v error -i "$TMP/${name}_cut.wav" -ar 48000 -ac 1 -c:a pcm_s24le "$TMP/${name}.wav"
  printf "  %-7s %5.2fs -> %ss  %s LUFS\n" "$name" \
    "$(awk -v a="$2" -v b="$3" 'BEGIN{print b-a}')" "$(dur_of "$TMP/${name}.wav")" \
    "$(lufs_of "$TMP/${name}.wav")"
}

sil_head() {  # s of silence before the first above-threshold sample
  ffmpeg -hide_banner -nostats -i "$1" -af "silencedetect=n=$THRESHOLD:d=0.01" -f null - 2>&1 \
    | grep -oP 'silence_end:\s*\K[0-9.]+' | head -1; }
sil_tail() {  # s of silence after the last one
  awk -v d="$(dur_of "$1")" -v s="$(ffmpeg -hide_banner -nostats -i "$1" \
    -af "silencedetect=n=$THRESHOLD:d=0.01" -f null - 2>&1 \
    | grep -oP 'silence_start:\s*\K[0-9.]+' | tail -1)" \
    'BEGIN{printf "%.3f", (s==""?0:d-s)}'; }

tighten() {  # tighten <name> <head|-> <tail|->; trims one join edge, leaves pacing inside
  local name="$1" ht="$2" tt="$3"
  local f="$TMP/$name.wav" d h t ss to
  d="$(dur_of "$f")"; h="$(sil_head "$f")"; t="$(sil_tail "$f")"
  h="${h:-0}"; t="${t:-0}"
  ss=$(awk -v h="$h" -v ht="$ht" 'BEGIN{v=(ht=="-")?0:h-ht; printf "%.3f", (v>0?v:0)}')
  to=$(awk -v d="$d" -v t="$t" -v tt="$tt" 'BEGIN{v=(tt=="-")?d:d-(t-tt); printf "%.3f", (v<d&&v>0?v:d)}')
  ffmpeg -y -v error -ss "$ss" -to "$to" -i "$f" -ar 48000 -ac 1 -c:a pcm_s24le "$TMP/${name}_t.wav"
  mv "$TMP/${name}_t.wav" "$f"
  printf "  %-7s head %.3f->%-6s tail %.3f->%-6s %ss\n" "$name" "$h" "$ht" "$t" "$tt" "$(dur_of "$f")"
}

echo ">>> splice each region with v004 settings"
splice enhook "$R_ENHOOK"
splice body   "$R_BODY"
splice enda   "$R_ENDA"
splice endb1  "$R_ENDB1"
splice endb2  "$R_ENDB2"
splice cnhook "$R_CNHOOK"

# "…solid advice: for enduro riders" is one sentence, but the join carried a 0.30s hole —
# a sentence beat mid-sentence. Only the two joining edges move; house margins stay.
echo ">>> close the join after \"solid advice\""
tighten endb1 - "$JOIN_TAIL"
tighten endb2 "$JOIN_HEAD" -

# The rev-2 takes are a different session. Match them to take 2's body, measured — the
# ending is measured as one piece because R128 is unreliable on a 4s fragment.
printf "file '%s'\nfile '%s'\nfile '%s'\n" "$TMP/enda.wav" "$TMP/endb1.wav" "$TMP/endb2.wav" \
  > "$TMP/endcat.txt"
ffmpeg -y -v error -f concat -safe 0 -i "$TMP/endcat.txt" -c copy "$TMP/endcat.wav"
BODY_I="$(lufs_of "$TMP/body.wav")"
GAIN_END=$(awk -v a="$BODY_I" -v b="$(lufs_of "$TMP/endcat.wav")" 'BEGIN{printf "%.2f", a-b}')
GAIN_CN=$(awk  -v a="$BODY_I" -v b="$(lufs_of "$TMP/cnhook.wav")" 'BEGIN{printf "%.2f", a-b}')
echo ">>> match gain vs body (${BODY_I} LUFS): ending ${GAIN_END} dB · cn hook ${GAIN_CN} dB"
for p in enda endb1 endb2; do
  ffmpeg -y -v error -i "$TMP/$p.wav" -af "volume=${GAIN_END}dB" -ar 48000 -ac 1 \
    -c:a pcm_s24le "$TMP/${p}_g.wav" && mv "$TMP/${p}_g.wav" "$TMP/$p.wav"
done
ffmpeg -y -v error -i "$TMP/cnhook.wav" -af "volume=${GAIN_CN}dB" -ar 48000 -ac 1 \
  -c:a pcm_s24le "$TMP/cnhook_g.wav" && mv "$TMP/cnhook_g.wav" "$TMP/cnhook.wav"

# The scratch hole. enda ends 0.12s after the last word and endb1 starts 0.06s before the
# next, so only the remainder is generated.
JOIN=$(awk -v g="$SCRATCH_GAP" 'BEGIN{printf "%.3f", g-0.16}')
ffmpeg -y -v error -f lavfi -i "anullsrc=r=48000:cl=mono" -t "$JOIN" -c:a pcm_s24le "$TMP/hole.wav"

build() {  # build <out> <piece...>; prints the scratch offset on stdout
  local out="$1"; shift
  local lf="$TMP/list.txt"; : > "$lf"
  local off=0 sfx_at=0 p
  for p in "$@"; do
    [ "$p" = "enda" ] && sfx_at=$off
    echo "file '$TMP/$p.wav'" >> "$lf"
    off=$(awk -v a="$off" -v b="$(dur_of "$TMP/$p.wav")" 'BEGIN{printf "%.3f", a+b}')
  done
  ffmpeg -y -v error -f concat -safe 0 -i "$lf" -ar 48000 -c:a pcm_s24le "$out"
  # top of the hole = end of enda less its 0.12s tail margin; the SFX is trimmed to its own
  # onset in the mix, so this is where the hit lands
  awk -v a="$sfx_at" -v b="$(dur_of "$TMP/enda.wav")" 'BEGIN{printf "%.3f", a+b-0.12}'
}

echo ">>> english hook + body + rev-2 ending"
SFX_EN=$(build "$OUT_EN" enhook body enda hole endb1 endb2)
echo ">>> chinese hook replaces the english hook"
SFX_CN=$(build "$OUT_CN" cnhook body enda hole endb1 endb2)
echo ">>> record scratch at ${SFX_EN}s (en) / ${SFX_CN}s (cn) — review mix only, A1 stays clean"

for OUT in "$OUT_EN" "$OUT_CN"; do
  BASE="${OUT%.wav}"
  [ "$OUT" = "$OUT_EN" ] && SFX_AT="$SFX_EN" || SFX_AT="$SFX_CN"
  ffmpeg -y -v error -i "$OUT" -ac 2 -ar 44100 -c:a libmp3lame -b:a 192k "${BASE}_review.mp3"
  [ -f "$MUSIC" ] || continue
  MG=$(awk -v v="$(lufs_of "$OUT")" -v m="$(lufs_of "$MUSIC")" -v s="$MUSIC_BELOW_VO" \
        'BEGIN{printf "%.2f", v-s-m}')
  SG=$(awk -v v="$(peak_of "$OUT")" -v p="$(peak_of "$SFX")" -v s="$SFX_BELOW_VO_PEAK" \
        'BEGIN{printf "%.2f", v-s-p}')
  FADE=$(awk -v d="$(dur_of "$OUT")" 'BEGIN{printf "%.3f", (d-1.5>0)?d-1.5:0}')
  DELAY=$(awk -v t="$SFX_AT" 'BEGIN{printf "%d", (t>0?t:0)*1000}')
  ffmpeg -y -v error -i "$OUT" -i "$MUSIC" -i "$SFX" -filter_complex \
    "[0:a]aresample=48000,aformat=channel_layouts=stereo[v];\
[1:a]aresample=48000,aformat=channel_layouts=stereo,volume=${MG}dB,\
afade=t=in:st=0:d=0.5,afade=t=out:st=$FADE:d=1.5[m];\
[2:a]aresample=48000,aformat=channel_layouts=stereo,\
atrim=start=${SFX_TRIM},asetpts=PTS-STARTPTS,\
afade=t=in:st=0:d=${SFX_FADE_IN}:curve=${SFX_FADE_CURVE},volume=${SG}dB,\
adelay=${DELAY}|${DELAY}[s];\
[v][m][s]amix=inputs=3:duration=first:normalize=0[out]" \
    -map "[out]" -ar 44100 -c:a libmp3lame -b:a 192k "${BASE}_review-mix.mp3"
done

echo ">>> done"
for OUT in "$OUT_EN" "$OUT_CN"; do
  printf "  %-46s %s LUFS  peak %s dBFS  %ss\n" "$(basename "$OUT")" \
    "$(lufs_of "$OUT")" "$(peak_of "$OUT")" "$(dur_of "$OUT")"
done
