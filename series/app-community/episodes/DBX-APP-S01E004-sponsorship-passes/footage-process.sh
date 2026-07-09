#!/bin/bash
# Narration -> edit-ready footage for E004. Run from inside media/DBX-APP-S01E004.
#
# Each source is an iPhone .MOV: 1920x1080 coded with a -90 rotation matrix (ffmpeg autorotates
# to 1080x1920 portrait on decode) and HLG HDR (arib-std-b67 / bt2020). Without the tone-map the
# image is pale — that was E001's bug. The chain below is the one validated on this project.
#
# Audio: each .MOV carries TWO audio streams. 0:1 is the 48kHz stereo AAC narration; 0:2 is an
# undecodable 4.0 'apac' Apple spatial track. `-map 0:a:0` takes the first (correct) one.
# NEVER `-map 0:a` — it can grab the spatial track.
#
# Trim: BOTH edges, from `silencedetect=noise=-32dB:d=0.30`.
#   out = last `silence_start` + 0.15s (the click/breath before the recording is stopped)
#   in  = leading silence, where it exceeds ~0.25s (05, 06, 09 only; 05 also has a lip-smack
#         blip at 0.33-0.57 that the trim removes)
# Interior breaths are LEFT IN — see edit-notes DECIDE. Keep these numbers in lockstep with
# caption-map.mjs's BEATS (trimIn/dur) or the captions drift.
#
# THIS CUT USES THE ORIGINAL .MOV FOR BOTH VIDEO AND AUDIO. Face-enhanced renders are expected
# later; when they land, swap the VIDEO only and keep this audio (verify frame-sync first).
set -e
: "${FF:=ffmpeg}"
: "${THREADS:=1}"          # <=1.5 CPU: one encode thread, one filter thread, one job at a time
NICE="nice -n 15"
TM="zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p"

# clip:trimIn:cutOut   -> trimmed length = cutOut - trimIn
CLIPS=(
  "01_hook.mov:0:9.79"
  "02_hate-ads.MOV:0:4.88"
  "03_billboard.MOV:0:4.94"
  "04_passes.MOV:0:5.84"
  "05_sponsorship.MOV:0.83:8.47"
  "06_discovery.MOV:0.44:5.69"
  "07_splash.MOV:0:6.19"
  "08_capped.MOV:0:6.08"
  "09_stats.MOV:0.29:6.49"
  "10_cta.MOV:0:9.44"
)
# Optional: pass a space-separated list of base names to rebuild just those, e.g.
#   ONLY="05_sponsorship 06_discovery 09_stats" bash footage-process.sh
: "${ONLY:=}"

mkdir -p footage
for entry in "${CLIPS[@]}"; do
  IFS=: read -r src tin tout <<<"$entry"
  base=${src%.*}; base=${base%.*}          # strip .mov/.MOV
  if [ -n "$ONLY" ] && [[ " $ONLY " != *" $base "* ]]; then continue; fi
  out="footage/${base}_sdr.mp4"
  dur=$(awk -v a="$tout" -v b="$tin" 'BEGIN{printf "%.3f", a-b}')
  echo ">>> $src -> $out (in ${tin}s, ${dur}s long)"
  # -ss BEFORE -i = accurate input seek; -t is then the trimmed length
  $NICE $FF -y -ss "$tin" -i "narration/$src" -map 0:v:0 -map 0:a:0 -t "$dur" \
    -vf "$TM" -r 30 \
    -threads "$THREADS" -filter_threads "$THREADS" -filter_complex_threads "$THREADS" \
    -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p \
    -c:a aac -b:a 192k -ac 2 -ar 48000 \
    "$out" -loglevel error
done
echo ">>> FOOTAGE DONE"
ls -la footage/
