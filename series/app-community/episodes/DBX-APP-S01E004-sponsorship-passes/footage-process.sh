#!/bin/bash
# Narration -> edit-ready footage for E004. Run from inside media/DBX-APP-S01E004.
#
# THIS CUT TAKES ITS VIDEO FROM THE ENHANCED RENDERS AND ITS AUDIO FROM THE ORIGINAL .MOV.
#
#   enhanced/NN_beat.mp4   the director's face-enhanced renders. Already SDR bt709, already
#                          upright 1080x1920, already 30fps, no rotation matrix. DO NOT tone-map
#                          them and DO NOT transpose them: both steps would corrupt an image
#                          that is already correct. (The old HLG chain is kept below, commented,
#                          because it is still what you need if you ever go back to the .MOV.)
#   narration/NN_beat.MOV  the phone original. HLG HDR, 1920x1080 + a -90 rotation matrix, and
#                          TWO audio streams: 0:1 is the 48kHz stereo AAC narration, 0:2 is an
#                          undecodable 4.0 'apac' Apple spatial track. `-map 1:a:0` takes the
#                          right one. NEVER `-map 1:a`.
#
# The pair is frame-synced: a 10x10 cross-correlation of RMS envelopes matches each render to its
# original at corr 0.996-0.999 (next-best 0.23-0.40) with 0ms lag, and the decoded frame counts
# agree exactly on 9 of 10 (01_hook's render is one frame shorter at the tail, past our out-point).
# So ONE pair of -ss/-t values cuts both streams. If the renders are ever re-exported, re-run that
# check before trusting this: `silencedetect` first-speech on both must agree within 1 frame.
#
# Trim: BOTH edges, from `silencedetect=noise=-32dB:d=0.30` on the ORIGINAL audio.
#   out = END OF THE LAST SPEECH RUN + 0.15s.
#   NOT "the last reported silence_start". `silencedetect` only reports a silence at least `d`
#   long; 01_hook ends with 0.24s of silence, so it reports none, and its last silence_start
#   (9.638) is the interior breath before "and honestly, that'd be the easy way out." Cutting
#   there dropped that sentence from the episode for three builds. `speech-check.py` now gates it.
#   in  = leading silence, where it exceeds ~0.25s (05, 06, 09 only; 05 also has a lip-smack
#         blip at 0.33-0.57 that the trim removes)
# Interior breaths are LEFT IN — see edit-notes DECIDE. Keep these numbers in lockstep with
# caption-map.mjs's BEATS (trimIn/dur) or the captions drift.
set -e
: "${FF:=ffmpeg}"
: "${THREADS:=1}"          # <=1.5 CPU: one encode thread, one filter thread, one job at a time
NICE="nice -n 15"

# The HLG->SDR chain, for the .MOV path only. Unused while `enhanced/` exists.
# TM="zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p"

# beat:audioSrc:trimIn:cutOut   -> trimmed length = cutOut - trimIn
CLIPS=(
  "01_hook:01_hook.mov:0:12.02"
  "02_hate-ads:02_hate-ads.MOV:0:4.88"
  "03_billboard:03_billboard.MOV:0:4.94"
  "04_passes:04_passes.MOV:0:5.84"
  "05_sponsorship:05_sponsorship.MOV:0.83:8.47"
  "06_discovery:06_discovery.MOV:0.44:5.69"
  "07_splash:07_splash.MOV:0:6.19"
  "08_capped:08_capped.MOV:0:6.08"
  "09_stats:09_stats.MOV:0.29:6.49"
  "10_cta:10_cta.MOV:0:9.44"
)
# Optional: pass a space-separated list of base names to rebuild just those, e.g.
#   ONLY="05_sponsorship 06_discovery 09_stats" bash footage-process.sh
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
  $NICE $FF -y \
    -ss "$tin" -i "$vsrc" \
    -ss "$tin" -i "narration/$asrc" \
    -map 0:v:0 -map 1:a:0 -t "$dur" \
    -vf "fps=30,format=yuv420p" \
    -threads "$THREADS" -filter_threads "$THREADS" -filter_complex_threads "$THREADS" \
    -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p \
    -c:a aac -b:a 192k -ac 2 -ar 48000 \
    "$out" -loglevel error
done
echo ">>> FOOTAGE DONE"
ls -la footage/
