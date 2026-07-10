#!/bin/bash
# Narration -> edit-ready footage for E005. Run from inside media/DBX-APP-S01E005.
#
# Each source is an iPhone .MOV: 1920x1080 coded with a -90 rotation matrix (ffmpeg autorotates
# to 1080x1920 portrait on decode) and HLG HDR (arib-std-b67 / bt2020). Without the tone-map the
# image is pale — that was E001's bug. The chain below is the one validated on this project.
#
# THIS CUT TAKES ITS VIDEO FROM `enhanced/` AND ITS AUDIO FROM THE .MOV.
#   enhanced/NN_beat.mp4   the director's face-enhanced renders. Already SDR bt709, already upright
#                          1080x1920, already 30fps. DO NOT tone-map them: the chain below would
#                          corrupt an image that is already correct. It is kept, commented, for the
#                          day someone goes back to the .MOV.
# Proven, not assumed: an 8x8 cross-correlation of RMS envelopes picks each render's own original at
# corr 1.000 with the next-best at 0.12-0.38, and every pair has 0ms lag. Re-run that check if the
# renders are ever re-exported.
#
# Audio: each .MOV carries TWO audio streams. 0:1 is the 48kHz stereo AAC narration; 0:2 is an
# undecodable 4.0 'apac' Apple spatial track. `-map 0:a:0` takes the first (correct) one.
# NEVER `-map 0:a` — it can grab the spatial track.
#
# Trim: BOTH edges.
#   out = END OF THE LAST SPEECH RUN + 0.15s.
#   NOT "the last reported silence_start". `silencedetect` only reports a silence at least `d`
#   long, so a take that ends with less than `d` of silence reports none and its last
#   silence_start is an interior breath. On S01E004 that deleted a whole sentence from the hook.
#   Every E005 take ends with 0.5-1.0s of silence, so none is at risk today — `speech-check.py`
#   is here so that stays true.
#   in  = leading silence, where it exceeds ~0.25s (03_flair only).
# Interior breaths are LEFT IN. Keep these numbers in lockstep with `speech-check.py` and
# `caption-map.mjs`'s BEATS, or the captions drift.
set -e
: "${FF:=ffmpeg}"
: "${THREADS:=1}"          # <=1.5 CPU: one encode thread, one filter thread, one job at a time
NICE="nice -n 15"
# The HLG->SDR chain, for the .MOV path only. Unused while `enhanced/` exists.
# TM="zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p"

# beat:audioSrc:trimIn:cutOut   -> trimmed length = cutOut - trimIn
#
# Three cuts were too tight: 1->2 (0.19s of air), 5->6 (0.31s) and 7->8 (0.27s). The pulse never
# landed. Their out-points are relaxed to 11.00 / 3.30 / 6.50, giving 0.45s, 0.49s and 0.51s — a
# breath, not a gap. Each clip has 0.9-1.0s of trailing silence to spend, so nothing is truncated;
# `speech-check.py` still gates that.
CLIPS=(
  "01_hook:01_hook.MOV:0:11.00"
  "02_layers:02_layers.MOV:0:12.19"
  "03_flair:03_flair.MOV:0.30:7.31"
  "04_invite:04_invite.MOV:0:6.95"
  "05_stats-intro:05_stats-intro.MOV:0:3.30"
  "06_stats-detail:06_stats-detail.MOV:0:5.56"
  "07_insider:07_insider.MOV:0:6.50"
  "08_cta:08_cta.MOV:0:12.95"
)
# Optional: pass a space-separated list of base names to rebuild just those, e.g.
#   ONLY="03_flair 07_insider" bash footage-process.sh
: "${ONLY:=}"

# Preflight: no beat may cut its own take short. This is cheap; a truncated sentence is not.
python3 "$(dirname "${BASH_SOURCE[0]}")/speech-check.py"

mkdir -p footage
for entry in "${CLIPS[@]}"; do
  IFS=: read -r base asrc tin tout <<<"$entry"
  if [ -n "$ONLY" ] && [[ " $ONLY " != *" $base "* ]]; then continue; fi
  vsrc="enhanced/${base}.mp4"
  [ -f "$vsrc" ] || { echo "missing $vsrc" >&2; exit 1; }
  [ -f "narration/$asrc" ] || { echo "missing narration/$asrc" >&2; exit 1; }
  out="footage/${base}_sdr.mp4"
  dur=$(awk -v a="$tout" -v b="$tin" 'BEGIN{printf "%.3f", a-b}')
  echo ">>> $vsrc + narration/$asrc -> $out (in ${tin}s, ${dur}s long)"
  # -ss BEFORE each -i = accurate input seek on both streams, identically.
  $NICE $FF -y -ss "$tin" -i "$vsrc" -ss "$tin" -i "narration/$asrc" \
    -map 0:v:0 -map 1:a:0 -t "$dur" \
    -vf "fps=30,format=yuv420p" \
    -threads "$THREADS" -filter_threads "$THREADS" -filter_complex_threads "$THREADS" \
    -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p \
    -c:a aac -b:a 192k -ac 2 -ar 48000 \
    "$out" -loglevel error
done
echo ">>> FOOTAGE DONE"
ls -la footage/
