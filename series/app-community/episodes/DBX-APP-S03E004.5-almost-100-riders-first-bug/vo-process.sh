#!/usr/bin/env bash
# en-US take 1 and zh-CN take 1 -> the soundtracks, plus a review mix under the bed for each,
# all at delivery level.
#
# Both locales are plain silence cuts: one continuous read each, one region each, no inserts
# and no grafts. The only structural decision is where the bed enters -- see BED_ENTRY /
# SENT2 below.
#
# No EQ, denoise, gate, compression, limiting, tempo or gain. The only levels set anywhere
# are the bed's and the one delivery gain. Rationale and measurements: edit-notes.md.
set -euo pipefail

EP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VM="$(cd "$EP_DIR/../../../.." && pwd)"
VID="DBX-APP-S03E004.5"
MEDIA="$VM/media/$VID/voiceover"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT

LOCALES=(en-US zh-CN)

# House settings, unchanged since S03E002 v004.
THRESHOLD=-34dB
MARGIN=0.06s,0.12s
SMOOTH=0.10s,0.08s
MUSIC_BELOW_VO=8.5  # dB the bed sits under the measured voice, as set on S03E003

# Delivery level, as introduced on S03E004. The splice itself is still gain-free; this is ONE
# constant broadband gain applied to the finished cut, and it is the only gain in the chain.
# It is derived, not chosen: whatever puts the LOUDER of the voice master and the review mix
# exactly on DELIVERY_TP, so both carry the same voice level and neither clips.
#
# NO LIMITING, so this cannot reach -14 on its own. Set DELIVERY_TP empty to reproduce an
# ungained cut.
DELIVERY_TP=-1.0

# The bed, and where it starts.
#
# disco-inferno has almost no runway: 0.43s of dither floor at -85 dB, a 7 ms pickup at
# -27.7 dB from 0.435s, and then the downbeat -- -19.4 dB to -9.3 dB inside one 1 ms block at
# 0.442s, at full level (-0.8 dB) three milliseconds later. Like who-you-foolin (S03E004) and
# unlike riders-on-the-storm (S03E003.8) the entrance is at the very top of the file, so the
# bed is DELAYED rather than seeked into.
#
# The alignment is derived, not chosen: the downbeat lands on the first word of the SECOND
# script sentence, so the hook plays completely dry and the beat comes in under the line that
# follows it.  OFFSET = SENT2 - BED_ENTRY  (delay when positive, seek when negative)
MUSIC="50-cent-disco-inferno.mp3"
BED_ENTRY=0.442

VER_en_US=v001
TAKE_en_US="$MEDIA/${VID}_en-US_vo-take1.m4a"
SENT2_en_US=2.206        # "So to say thank you" -- the /s/ crosses the -34 dB gate here
P_en_US=(
  "take 0.30 45.90"      # "We're at almost 100 riders in my app." -> "...new updates and perks."
)                        # 0.30 clears the encoder lead-in (junk to 0.192s); 45.90 is 0.27s
                         # past the last word, room for the 0.12s tail margin

VER_zh_CN=v001
TAKE_zh_CN="$MEDIA/${VID}_zh-CN_vo-take1.m4a"
SENT2_zh_CN=2.117        # 为了感谢大家 -- 为 crosses the -34 dB gate here
P_zh_CN=(
  "take 0.30 42.15"      # 我的App这几天居然快100个车友了 -> 保持联系，敬请期待吧。
)                        # 0.30 clears the encoder lead-in (junk to 0.192s); 42.15 stops
                         # before the -39 dB blip at 42.20 and the encoder tail behind it

command -v auto-editor >/dev/null || { echo "auto-editor not on PATH" >&2; exit 1; }
mkdir -p "$MEDIA"

lufs_of() { ffmpeg -hide_banner -nostats ${2:+-ss "$2"} ${3:+-t "$3"} -i "$1" -af ebur128 \
  -f null - 2>&1 | sed -n '/Summary:/,$p' | grep -A1 "Integrated loudness:" \
  | grep -oP 'I:\s*\K[-0-9.]+'; }
peak_of() { ffmpeg -hide_banner -nostats -i "$1" -af ebur128=peak=true -f null - 2>&1 \
  | sed -n '/Summary:/,$p' | grep -A1 "True peak:" | grep -oP 'Peak:\s*\K[-0-9.]+'; }
dur_of()  { ffprobe -v error -show_entries format=duration -of csv=p=0 "$1"; }

# <file> — length with any trailing all-zero samples removed.
zero_tail() { python3 -c "
import sys, wave, numpy as np
w = wave.open(sys.argv[1], 'rb')
a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.uint8).reshape(-1, w.getsampwidth())
nz = np.where(a.any(axis=1))[0]
print('%.6f' % ((nz[-1] + 1) / w.getframerate() if len(nz) else 0))
" "$1"; }

# <out> <src> <start> <end> [gain_dB] — decode at the master's stream params. Every piece the
# concat demuxer sees must match exactly.
cut_wav() { ffmpeg -y -v error -ss "$3" -to "$4" -i "$2" ${5:+-af "volume=$5dB"} \
  -ar 48000 -ac 1 -c:a pcm_s24le "$1"; }

# <file> — run auto-editor and clean up after it, in place.
#   1. it writes pcm_s16le, and the concat demuxer copies bytes, so a 16-bit piece glued to a
#      24-bit insert is read back under one header as garbage. Re-stamp to the master's
#      params; widening 16->24 bit is lossless and changes no sample value.
#   2. it pads its output up to a whole video frame with DIGITAL SILENCE. Left in, that is a
#      hole at every join and another at the end of the master. Trim it off.
trim_dead() {
  auto-editor "$1" --edit "audio:threshold=$THRESHOLD" \
    --margin "$MARGIN" --smooth "$SMOOTH" -o "$TMP/_ae.wav" >/dev/null
  ffmpeg -y -v error -i "$TMP/_ae.wav" -t "$(zero_tail "$TMP/_ae.wav")" \
    -ar 48000 -ac 1 -c:a pcm_s24le "$1"
}

for LOC in "${LOCALES[@]}"; do
  U="${LOC//-/_}"
  eval "VER=\$VER_$U; TAKE=\$TAKE_$U; SENT2=\$SENT2_$U"
  eval "PIECES=(\"\${P_$U[@]}\")"
  [ -f "$TAKE" ] || { echo "missing source: $TAKE" >&2; exit 1; }
  OUT="$MEDIA/${VID}_${LOC}_vo_${VER}.wav"
  echo ">>> $LOC: splice"

  : > "$TMP/list.txt"; i=0
  for P in "${PIECES[@]}"; do
    set -- $P; kind="$1"; i=$((i+1)); f="$TMP/p${i}.wav"
    case "$kind" in
      take)
        cut_wav "$f" "$TAKE" "$2" "$3"
        trim_dead "$f" ;;
    esac
    printf "file '%s'\n" "$f" >> "$TMP/list.txt"
  done
  ffmpeg -y -v error -f concat -safe 0 -i "$TMP/list.txt" -c copy "$TMP/vo.wav"

  BASE="${OUT%.wav}"; DUR="$(dur_of "$TMP/vo.wav")"; VO_I="$(lufs_of "$TMP/vo.wav")"
  FADE=$(awk -v d="$DUR" 'BEGIN{printf "%.3f", (d-1.5>0)?d-1.5:0}')

  MUSIC_PATH="$VM/media/audio/$MUSIC"
  # OFFSET = SENT2 - BED_ENTRY. Positive means the downbeat is earlier in the track than the
  # target moment is in the master, so the bed waits; negative means it is later, so the bed
  # is seeked into. Only one of the two is ever non-zero.
  MUSIC_SS=$(awk -v e="$BED_ENTRY" -v s="$SENT2" 'BEGIN{v=e-s; printf "%.3f", (v>0?v:0)}')
  DELAY_MS=$(awk -v e="$BED_ENTRY" -v s="$SENT2" 'BEGIN{v=(s-e)*1000; printf "%d", (v>0?v:0)}')
  MUSIC_I="$(lufs_of "$MUSIC_PATH" "$MUSIC_SS" "$DUR")"   # the window used, not the file
  MG=$(awk -v v="$VO_I" -v m="$MUSIC_I" -v s="$MUSIC_BELOW_VO" 'BEGIN{printf "%.2f", v-s-m}')
  echo "    mix: $MUSIC from ${MUSIC_SS}s delayed ${DELAY_MS}ms (downbeat at ${SENT2}s), window ${MUSIC_I} LUFS, gain ${MG} dB"
  # Mono -> stereo with pan= and not -ac 2: ffmpeg's downmix matrix applies a -3 dB pan law
  # per channel, and R128 sums channels, so -ac 2 throws away 3 dB of headroom for no change
  # in measured loudness. At unity the delivered file reads 3 LU louder for the same peak.
  #
  # No fade in on the bed: it enters on its own downbeat and there is nothing before it to
  # shape. The fade out is not shaping either -- the track does not end here, it has to be
  # got off.
  ffmpeg -y -v error -i "$TMP/vo.wav" -ss "$MUSIC_SS" -i "$MUSIC_PATH" -filter_complex \
    "[0:a]aresample=48000,pan=stereo|c0=c0|c1=c0[v];\
[1:a]aresample=48000,aformat=channel_layouts=stereo,volume=${MG}dB,\
adelay=${DELAY_MS}:all=1,afade=t=out:st=$FADE:d=1.5[m];\
[v][m]amix=inputs=2:duration=first:normalize=0[out]" \
    -map "[out]" -ar 48000 -c:a pcm_s24le "$TMP/mix.wav"

  # One constant gain for everything this locale emits, referenced to whichever of the two
  # peaks higher so the voice sits at the same level in the master and in the mix.
  GAIN=0.00
  if [ -n "$DELIVERY_TP" ]; then
    GAIN=$(awk -v a="$(peak_of "$TMP/vo.wav")" -v b="$(peak_of "$TMP/mix.wav")" -v c="$DELIVERY_TP" \
      'BEGIN{p=(a>b?a:b); printf "%.2f", c-p}')
    echo "    delivery gain ${GAIN} dB -> ${DELIVERY_TP} dBTP"
  fi
  ffmpeg -y -v error -i "$TMP/vo.wav"  -af "volume=${GAIN}dB" -ar 48000 -ac 1 -c:a pcm_s24le "$OUT"
  ffmpeg -y -v error -i "$TMP/vo.wav"  -af "volume=${GAIN}dB,pan=stereo|c0=c0|c1=c0" \
    -ar 44100 -c:a libmp3lame -b:a 192k "${BASE}_review.mp3"
  ffmpeg -y -v error -i "$TMP/mix.wav" -af "volume=${GAIN}dB" \
    -ar 44100 -c:a libmp3lame -b:a 192k "${BASE}_review-mix.mp3"

  printf "    %-44s %s LUFS  peak %s dBFS  %ss\n" "$(basename "$OUT")" \
    "$(lufs_of "$OUT")" "$(peak_of "$OUT")" "$(dur_of "$OUT")"
  printf "    %-44s %s LUFS  peak %s dBFS\n" "$(basename "${BASE}_review-mix.mp3")" \
    "$(lufs_of "${BASE}_review-mix.mp3")" "$(peak_of "${BASE}_review-mix.mp3")"
done
