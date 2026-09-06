#!/usr/bin/env bash
# Take 2 en-US + take 2 zh-CN -> two soundtracks, each with a review mix under the bed.
#
# Sibling variants, not a translation pair: two separately authored reads of the same
# eleven beats. They are processed identically but never mixed with each other, and each
# bed gain is computed from its own voice level.
#
# The barber answers in his own voice. In `hook-a-brother-up` the founder originally read
# the barber's reply himself; that read is dropped from both masters and replaced with the
# barber's own recording — "say less" in en-US, "没问题" in zh-CN — cut from one 4.29s clip
# and level-matched to each master. The review mix ducks the bed under the whole exchange
# so it plays as a conversation rather than as narration over music.
#
# Every take here is one continuous read. Each is cut into regions only to skip something:
# the replaced reply, plus one stray event per take sitting alone inside a long pause —
#   en-US  a breath at 44.51s, -32 dB, 0.5s clear of the next line
#   zh-CN  a click at 33.44s, -29 dB, ~10ms, mid-pause (falls inside the reply skip)
#
# No EQ, denoise, gate, compression, limiting or tempo. The only levels set anywhere are
# the barber's match gains, the bed's, and the duck.
# Rationale, region table and measurements: edit-notes.md (## VO audio).
set -euo pipefail

EP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VM="$(cd "$EP_DIR/../../../.." && pwd)"
VID="DBX-APP-S03E003"
MEDIA="$VM/media/$VID/voiceover"
MUSIC="$VM/media/audio/usher-yeah-instrumental.mp3"
BOSS="$MEDIA/${VID}_boss-lines.m4a"
# The mission-line pickup is one file per locale: the zh line was re-recorded again after
# the first pass, so they no longer share a clip.
SNIP_en_US="$MEDIA/${VID}_mission-line.m4a"
SNIP_zh_CN="$MEDIA/${VID}_mission-line-zh.m4a"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT

# Versions are per file, not per episode.
VER_en_US=v004
VER_zh_CN=v004

# House settings, unchanged since S03E002 v004.
THRESHOLD=-34dB
MARGIN=0.06s,0.12s
SMOOTH=0.10s,0.08s
MUSIC_BELOW_VO=8.5  # dB the bed sits under the measured voice (10 read quiet, 7 read loud)
MUSIC_START=0       # s into the instrumental; it runs at one level throughout
DUCK_DB=10          # dB the bed drops under the barber exchange
DUCK_RAMP=0.15      # s in and out of the duck

# The barber's clip: quiet off-mic chatter up to ~1.4s, then the two lines. Identified by
# spectral fingerprint, not by ear — "say less" carries 15% of its energy above 4 kHz (two
# sibilants), "没问题" carries 0.1%. Windows are cut wide into the silence either side; the
# match gain is applied BEFORE auto-editor so the house threshold means the same thing.
B_zh_CN="1.55 2.70"   # 没问题
B_en_US="2.75 4.10"   # say less

# The rafting line is cut from both reads — it went nowhere — and the sentence that leaned
# on it ("But this time…" / 但今天不一样，我要走遍…) is re-recorded to stand on its own.
S_en_US="0.10 2.90"   # and I'm still hunting down 100 dirt bike tracks.
S_zh_CN="0.55 3.60"   # 继续挑战走遍100个越野摩托车场

# Regions are absolute seconds into each take, cut a little wide; auto-editor trims the
# edges to MARGIN. `ask` is its own piece so the duck window can start exactly there.
P_en_US=(
  "take 0.60 8.80"     # Come on out here... -> ...an hour's drive away.
  "snip"               # and I'm still hunting down 100 dirt bike tracks.  [8.80-15.00 cut:
                       #   the rafting line and the "But this time..." it set up]
  "take 15.00 25.00"   # Track number three. -> ...runs a local dirt bike track on weekends.
  "ask  25.00 27.20"   # Hook a brother up.
  "boss"               # (barber) say less
  "take 29.60 44.30"   # He's been riding... -> ...every weekend.   [skips the read reply]
  "take 44.85 66.75"   # Come on, let's see... -> Perfect, that'll do.  [skips the breath]
  "take 68.10 69.94"   # Another track down.   [66.75-68.10 cut: "Motomuet"]
)
P_zh_CN=(
  "take 0.60 6.30"     # 这个周末... -> 今天我们去浙江桐庐。
  "snip"               # 继续挑战走遍100个越野摩托车场  [6.30-12.40 cut: 漂流 line +
                       #   但今天不一样，我要走遍100个越野摩托场]
  "take 12.40 28.00"   # 这次是第三个。 -> ...两边都去一下不过分吧。
  "ask  28.00 31.00"   # 兄弟，给我整一个最 dirt bike 的…
  "boss"               # (barber) 没问题
  "take 33.65 63.86"   # 他骑车已经十多年了... -> 第三个场地拿下！
)                      # [31.00-33.65 skipped: the read reply 来赛 and the 33.44 click]

command -v auto-editor >/dev/null || { echo "auto-editor not on PATH" >&2; exit 1; }
for f in "$BOSS" "$SNIP_en_US" "$SNIP_zh_CN"; do
  [ -f "$f" ] || { echo "missing source: $f" >&2; exit 1; }
done
mkdir -p "$MEDIA"

lufs_of() { ffmpeg -hide_banner -nostats -i "$1" -af ebur128 -f null - 2>&1 \
  | sed -n '/Summary:/,$p' | grep -A1 "Integrated loudness:" | grep -oP 'I:\s*\K[-0-9.]+'; }
peak_of() { ffmpeg -hide_banner -nostats -i "$1" -af ebur128=peak=true -f null - 2>&1 \
  | sed -n '/Summary:/,$p' | grep -A1 "True peak:" | grep -oP 'Peak:\s*\K[-0-9.]+'; }
dur_of()  { ffprobe -v error -show_entries format=duration -of csv=p=0 "$1"; }

# Speech-gated RMS: the level two different recordings are matched on. R128 is unreliable
# on a one-second fragment, which is what the barber's lines are.
grms_of() { python3 - "$1" <<'PY'
import subprocess,sys,numpy as np
raw=subprocess.run(["ffmpeg","-v","error","-i",sys.argv[1],"-ac","1","-ar","48000","-f","f32le","-"],
                   capture_output=True).stdout
x=np.frombuffer(raw,dtype=np.float32).astype(np.float64); N,H=2048,1024
v=[(x[i:i+N]**2).mean() for i in range(0,max(1,len(x)-N),H)
   if len(x[i:i+N])==N and np.max(np.abs(x[i:i+N]))>=0.02]
print(f"{20*np.log10(np.sqrt(np.mean(v))+1e-12):.2f}" if v else "nan")
PY
}

cut_wav() {  # cut_wav <out> <src> <start> <end> [gain_dB]
  ffmpeg -y -v error -ss "$3" -to "$4" -i "$2" \
    ${5:+-af "volume=${5}dB"} -ar 48000 -ac 1 -c:a pcm_s24le "$1"
}

trim_dead() {  # trim_dead <out> <in>; house dead-air cut at unity
  auto-editor "$2" --edit "audio:threshold=$THRESHOLD" \
    --margin "$MARGIN" --smooth "$SMOOTH" -o "$TMP/ae.wav" >/dev/null
  ffmpeg -y -v error -i "$TMP/ae.wav" -ar 48000 -ac 1 -c:a pcm_s24le "$1"
}

sil_head() { ffmpeg -hide_banner -nostats -i "$1" -af "silencedetect=n=$THRESHOLD:d=0.01" \
  -f null - 2>&1 | grep -oP 'silence_end:\s*\K[0-9.]+' | head -1; }
sil_tail() { awk -v d="$(dur_of "$1")" -v s="$(ffmpeg -hide_banner -nostats -i "$1" \
  -af "silencedetect=n=$THRESHOLD:d=0.01" -f null - 2>&1 \
  | grep -oP 'silence_start:\s*\K[0-9.]+' | tail -1)" 'BEGIN{printf "%.3f", (s==""?0:d-s)}'; }

# auto-editor snaps margins to its frame grid, and on the barber's clip that left up to
# 0.13s of head — which is his own noise floor, ~12 dB below the take's room tone, so the
# join read as a hole and measured 0.27s against a 0.19s house median. Pin both edges.
pin_margins() {  # pin_margins <file> <head_s> <tail_s>
  local f="$1" d h t ss to
  d="$(dur_of "$f")"; h="$(sil_head "$f")"; t="$(sil_tail "$f")"; h="${h:-0}"; t="${t:-0}"
  ss=$(awk -v h="$h" -v x="$2" 'BEGIN{v=h-x; printf "%.3f", (v>0?v:0)}')
  to=$(awk -v d="$d" -v t="$t" -v x="$3" 'BEGIN{v=d-(t-x); printf "%.3f", (v<d&&v>0?v:d)}')
  ffmpeg -y -v error -ss "$ss" -to "$to" -i "$f" -ar 48000 -ac 1 -c:a pcm_s24le "$TMP/pin.wav"
  mv "$TMP/pin.wav" "$f"
  printf "    %-4s %-6s head %.3f->%s tail %.3f->%s  %ss\n" "" "pinned" "$h" "$2" "$t" "$3" "$(dur_of "$f")"
}

mixdown() {  # mixdown <master.wav> <duck_start> <duck_end>
  local out="$1" ds="$2" de="$3" base="${1%.wav}" mg fade duck
  ffmpeg -y -v error -i "$out" -ac 2 -ar 44100 -c:a libmp3lame -b:a 192k "${base}_review.mp3"
  [ -f "$MUSIC" ] || return 0
  mg=$(awk -v v="$(lufs_of "$out")" -v m="$(lufs_of "$MUSIC")" -v s="$MUSIC_BELOW_VO" \
        'BEGIN{printf "%.2f", v-s-m}')
  fade=$(awk -v d="$(dur_of "$out")" 'BEGIN{printf "%.3f", (d-1.5>0)?d-1.5:0}')
  # Trapezoid: full level -> DUCK_DB over DUCK_RAMP before ds, held to de, back up after.
  duck=$(awk -v s="$ds" -v e="$de" -v r="$DUCK_RAMP" -v d="$DUCK_DB" \
    'BEGIN{printf "1-(1-%.6f)*clip((t-%.3f)/%.3f,0,1)*clip((%.3f-t)/%.3f,0,1)",
           10^(-d/20), s-r, r, e+r, r}')
  echo "    bed at ${mg} dB, ducked ${DUCK_DB} dB over ${ds}-${de}s"
  ffmpeg -y -v error -i "$out" -ss "$MUSIC_START" -i "$MUSIC" -filter_complex \
    "[0:a]aresample=48000,aformat=channel_layouts=stereo[v];\
[1:a]aresample=48000,aformat=channel_layouts=stereo,volume=${mg}dB,\
afade=t=in:st=0:d=0.5,afade=t=out:st=$fade:d=1.5,\
volume=eval=frame:volume='${duck}'[m];\
[v][m]amix=inputs=2:duration=first:normalize=0[out]" \
    -map "[out]" -ar 44100 -c:a libmp3lame -b:a 192k "${base}_review-mix.mp3"
}

for LOC in en-US zh-CN; do
  KEY="${LOC//-/_}"
  eval "PIECES=(\"\${P_${KEY}[@]}\")"
  eval "VER=\$VER_${KEY}"
  eval "BSEG=\$B_${KEY}"
  eval "SSEG=\$S_${KEY}"
  eval "SSRC=\$SNIP_${KEY}"
  TAKE="$MEDIA/${VID}_${LOC}_vo-take2.m4a"
  OUT="$MEDIA/${VID}_${LOC}_vo_${VER}.wav"
  [ -f "$TAKE" ] || { echo "missing source: $TAKE" >&2; exit 1; }
  echo ">>> $LOC ($VER)"

  # Anything cut from a different recording is matched to this take's own speech level and
  # given house margins, so a listener cannot tell a second source from a sentence gap.
  MASTER_G="$(grms_of "$TAKE")"
  graft() {  # graft <name> <src> <"start end">
    local n="$1" src="$2" seg="$3" g gain
    cut_wav "$TMP/${n}_raw.wav" "$src" $seg
    g="$(grms_of "$TMP/${n}_raw.wav")"
    gain=$(awk -v a="$MASTER_G" -v b="$g" 'BEGIN{printf "%.2f", a-b}')
    echo "    $n match gain ${gain} dB (take ${MASTER_G} dB, source ${g} dB)"
    cut_wav "$TMP/${n}_g.wav" "$src" $seg "$gain"
    trim_dead "$TMP/$n.wav" "$TMP/${n}_g.wav"
    pin_margins "$TMP/$n.wav" 0.06 0.12
  }
  graft boss "$BOSS" "$BSEG"
  graft snip "$SSRC" "$SSEG"

  : > "$TMP/list.txt"; OFF=0; DS=0; DE=0
  for i in "${!PIECES[@]}"; do
    set -- ${PIECES[$i]}
    if [ "$1" = boss ] || [ "$1" = snip ]; then
      cp "$TMP/$1.wav" "$TMP/p$i.wav"
    else
      cut_wav "$TMP/p${i}_raw.wav" "$TAKE" "$2" "$3"
      trim_dead "$TMP/p$i.wav" "$TMP/p${i}_raw.wav"
    fi
    D="$(dur_of "$TMP/p$i.wav")"
    [ "$1" = ask  ] && DS="$OFF"
    [ "$1" = boss ] && DE=$(awk -v a="$OFF" -v b="$D" 'BEGIN{printf "%.3f", a+b}')
    printf "    %-4s %-6s %ss\n" "p$i" "$1" "$D"
    echo "file '$TMP/p$i.wav'" >> "$TMP/list.txt"
    OFF=$(awk -v a="$OFF" -v b="$D" 'BEGIN{printf "%.3f", a+b}')
  done

  ffmpeg -y -v error -f concat -safe 0 -i "$TMP/list.txt" -ar 48000 -c:a pcm_s24le "$OUT"
  mixdown "$OUT" "$DS" "$DE"
  printf "    %-40s %s LUFS  peak %s dBFS  %ss\n" "$(basename "$OUT")" \
    "$(lufs_of "$OUT")" "$(peak_of "$OUT")" "$(dur_of "$OUT")"
done
