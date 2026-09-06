#!/usr/bin/env bash
# en-US take 3 and zh-CN take 1 -> the soundtracks, plus a review mix under the bed for each.
#
# Both reads are clean: nothing above the threshold had to be stepped over in either. Every
# structural edit here is deliberate:
#   * a 1.00s ROOM-TONE INSERT after the gatekeeping line, holding the pause open for a meme
#     card, in both locales;
#   * in zh-CN only, a GRAFT that replaces the founder's read of the DM rider's line with the
#     rider's own recording.
#
# No EQ, denoise, gate, compression, limiting, tempo or gain. The only levels set anywhere are
# the bed's and the graft's match gain. Rationale and measurements: edit-notes.md.
set -euo pipefail

EP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VM="$(cd "$EP_DIR/../../../.." && pwd)"
VID="DBX-APP-S03E003.8"
MEDIA="$VM/media/$VID/voiceover"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT

LOCALES=(en-US zh-CN)

# House settings, unchanged since S03E002 v004.
THRESHOLD=-34dB
MARGIN=0.06s,0.12s
SMOOTH=0.10s,0.08s
MUSIC_BELOW_VO=8.5  # dB the bed sits under the measured voice, as set on S03E003

# The bed, and where it starts.
#
# riders-on-the-storm opens with 3.94s of sparse near-silent ambience (-31 to -48 dB peak,
# and NOT a crescendo -- it does not build) and then enters on a hard downbeat: -36 dB to
# -7.8 dB peak inside one 20 ms block at 3.940s. There is no artificial fade on it; the track
# does its own entrance.
#
# MUSIC_START is derived, not chosen: the downbeat is lined up with the first word of the
# SECOND sentence, so the hook plays over the ambience alone and the band comes in under the
# line that follows it.  MUSIC_START = BED_ENTRY - SENTENCE_2
MUSIC="riders-on-the-storm-instrumental.mp3"
BED_ENTRY=3.940

VER_en_US=v003
TAKE_en_US="$MEDIA/${VID}_en-US_vo-take3.m4a"
SENT2_en_US=2.420        # "While I was out DM'ing track owners"
TONE_en_US="28.60 29.60" # room tone from inside the pause it extends
P_en_US=(
  "take 0.40 29.15"      # "I'm tryna build the best map..." -> "...gatekeeping all the way."
  "tone"                 # the meme card sits here
  "take 29.15 64.513"    # "Then send the link..." -> the closing line. 64.513 not the 64.533
)                        # EOF: the last 20 ms are the encoder tail at -78 to -114 dB

VER_zh_CN=v001
TAKE_zh_CN="$MEDIA/${VID}_zh-CN_vo-take1.m4a"
SENT2_zh_CN=2.480          # "起因是前几天我在私信各个场地的时候"
# The zh take's own meme pause (35.49-37.19) is NOT usable as its tone source: it has three
# digital dropouts in it (see below). 42.32-43.32 is the closest dropout-free second in the
# file -- rms -55.0 against the pause's own -54.1, peak -44.1 against -44.5, and even across
# its whole length at 20 ms resolution.
TONE_zh_CN="42.32 43.32"
GRAFT_zh_CN="$MEDIA/${VID}_zh-CN_dm-rider.m4a"
GSEG_zh_CN="0.40 3.20"   # the clip's single speech run (0.71-2.99) with room either side
P_zh_CN=(
  "take 0.40 9.36"       # 我想弄一张真正好用的越野摩托地图。-> ...有个林道车友突然来找我说：
  "graft"                # (DM rider) 要是我自己的路线也能直接分享到这上面就好了。
  "take 13.36 36.50"     # 懂了哥，无需多言。-> 对，先藏着。谁也不给看。
  "tone"                 # the meme card sits here
  "take 36.50 65.96"     # 想给分享几个兄弟骑？-> 所以跑林道车手们，这是不是还算比较有用？
)

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

# <file> — speech-gated RMS. R128 is unreliable on a two-second fragment, so the graft is
# matched on this instead: frames above the gate only, so silence can't move the number.
grms_of() { python3 -c "
import sys, wave, numpy as np
w = wave.open(sys.argv[1], 'rb'); sw = w.getsampwidth()
raw = np.frombuffer(w.readframes(w.getnframes()), dtype=np.uint8).reshape(-1, sw).astype(np.int32)
x = raw[:, 0] | (raw[:, 1] << 8) | (raw[:, 2] << 16)
x = np.where(x & 0x800000, x - 0x1000000, x).astype(np.float64) / 8388608.0
N, H = 2048, 1024
k = [np.sqrt((x[i:i+N] ** 2).mean()) for i in range(0, len(x) - N, H)]
k = np.array([v for v in k if v > 0.02])
print('%.2f' % (20 * np.log10(np.sqrt((k ** 2).mean()))))
" "$1"; }

# <file> — seconds of sub-threshold head / tail, at 5 ms resolution.
edges_of() { python3 -c "
import sys, wave, numpy as np
w = wave.open(sys.argv[1], 'rb'); sr = w.getframerate(); sw = w.getsampwidth()
raw = np.frombuffer(w.readframes(w.getnframes()), dtype=np.uint8).reshape(-1, sw).astype(np.int32)
x = raw[:, 0] | (raw[:, 1] << 8) | (raw[:, 2] << 16)
x = np.where(x & 0x800000, x - 0x1000000, x).astype(np.float64) / 8388608.0
N = int(sr * 0.005); f = x[:len(x)//N*N].reshape(-1, N)
loud = np.where(np.abs(f).max(axis=1) > 10 ** (-34/20))[0]
print('%.3f %.3f' % (loud[0] * 0.005, len(f) * 0.005 - (loud[-1] + 1) * 0.005))
" "$1"; }

# <out> <src> <start> <end> [gain_dB] — decode at the master's stream params. Every piece the
# concat demuxer sees must match exactly, inserts included.
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

# <file> <head> <tail> — pin the margins to exactly these. auto-editor snaps them to its own
# frame grid, which on a grafted clip can leave 0.157s of a different room's tone and read as
# a hole at the join.
pin_margins() {
  read -r h t < <(edges_of "$1"); d="$(dur_of "$1")"
  ss=$(awk -v h="$h" -v x="$2" 'BEGIN{v=h-x; printf "%.3f", (v>0?v:0)}')
  to=$(awk -v d="$d" -v t="$t" -v x="$3" 'BEGIN{v=d-(t-x); printf "%.3f", (v<d&&v>0?v:d)}')
  ffmpeg -y -v error -ss "$ss" -to "$to" -i "$1" -ar 48000 -ac 1 -c:a pcm_s24le "$TMP/_pin.wav"
  mv "$TMP/_pin.wav" "$1"
}

for LOC in "${LOCALES[@]}"; do
  U="${LOC//-/_}"
  eval "VER=\$VER_$U; TAKE=\$TAKE_$U; SENT2=\$SENT2_$U; TONE=\$TONE_$U"
  eval "PIECES=(\"\${P_$U[@]}\")"
  [ -f "$TAKE" ] || { echo "missing source: $TAKE" >&2; exit 1; }
  OUT="$MEDIA/${VID}_${LOC}_vo_${VER}.wav"
  echo ">>> $LOC: splice"
  # whole-take level reference for any graft in this locale
  ffmpeg -y -v error -i "$TAKE" -ar 48000 -ac 1 -c:a pcm_s24le "$TMP/take_ref.wav"

  : > "$TMP/list.txt"; i=0
  for P in "${PIECES[@]}"; do
    set -- $P; kind="$1"; i=$((i+1)); f="$TMP/p${i}.wav"
    case "$kind" in
      take)
        cut_wav "$f" "$TAKE" "$2" "$3"
        trim_dead "$f" ;;
      tone)
        set -- $TONE
        cut_wav "$f" "$TAKE" "$1" "$2" ;;
      graft)
        eval "SRC=\$GRAFT_$U; SEG=\$GSEG_$U"; set -- $SEG
        # Match the graft to the take on speech-gated RMS before cutting it, so auto-editor
        # sees the level it will be heard at. This gain is the documented exception to the
        # no-gain rule (AGENTS.md): joining two takes.
        #
        # The reference is the WHOLE take, not the neighbouring region. The zh take drifts
        # 1.9 dB across itself (-29.89 / -28.00 / -28.23 by region), so picking a neighbour
        # would make the graft's level depend on where a region boundary happens to fall.
        # The whole-take figure (-28.48) sits within 0.5 dB of the mean of the two regions
        # either side of this graft, and does not move if the boundaries do.
        cut_wav "$TMP/_g.wav" "$SRC" "$1" "$2"
        G=$(awk -v a="$(grms_of "$TMP/take_ref.wav")" -v b="$(grms_of "$TMP/_g.wav")" \
              'BEGIN{printf "%.2f", a-b}')
        echo "    graft match gain ${G} dB"
        cut_wav "$f" "$SRC" "$1" "$2" "$G"
        trim_dead "$f"
        pin_margins "$f" 0.06 0.12 ;;
    esac
    printf "file '%s'\n" "$f" >> "$TMP/list.txt"
  done
  ffmpeg -y -v error -f concat -safe 0 -i "$TMP/list.txt" -c copy "$OUT"
  rm -f "$TMP/take_ref.wav"

  BASE="${OUT%.wav}"; DUR="$(dur_of "$OUT")"; VO_I="$(lufs_of "$OUT")"
  FADE=$(awk -v d="$DUR" 'BEGIN{printf "%.3f", (d-1.5>0)?d-1.5:0}')
  ffmpeg -y -v error -i "$OUT" -ac 2 -ar 44100 -c:a libmp3lame -b:a 192k "${BASE}_review.mp3"

  MUSIC_PATH="$VM/media/audio/$MUSIC"
  MUSIC_START=$(awk -v e="$BED_ENTRY" -v s="$SENT2" 'BEGIN{printf "%.3f", e-s}')
  MUSIC_I="$(lufs_of "$MUSIC_PATH" "$MUSIC_START" "$DUR")"   # the window used, not the file
  MG=$(awk -v v="$VO_I" -v m="$MUSIC_I" -v s="$MUSIC_BELOW_VO" 'BEGIN{printf "%.2f", v-s-m}')
  echo "    mix: $MUSIC from ${MUSIC_START}s (downbeat at ${SENT2}s), window ${MUSIC_I} LUFS, gain ${MG} dB"
  # No fade in: the bed starts inside its own near-silent intro, so there is nothing to fade.
  # The fade out is not shaping either -- the track does not end here, it has to be got off.
  ffmpeg -y -v error -i "$OUT" -ss "$MUSIC_START" -i "$MUSIC_PATH" -filter_complex \
    "[0:a]aresample=48000,aformat=channel_layouts=stereo[v];\
[1:a]aresample=48000,aformat=channel_layouts=stereo,volume=${MG}dB,\
afade=t=out:st=$FADE:d=1.5[m];\
[v][m]amix=inputs=2:duration=first:normalize=0[out]" \
    -map "[out]" -ar 44100 -c:a libmp3lame -b:a 192k "${BASE}_review-mix.mp3"

  printf "    %-42s %s LUFS  peak %s dBFS  %ss\n" "$(basename "$OUT")" \
    "$(lufs_of "$OUT")" "$(peak_of "$OUT")" "$(dur_of "$OUT")"
done
