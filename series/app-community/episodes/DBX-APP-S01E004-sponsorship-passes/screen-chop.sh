#!/bin/bash
# Screen-recording chop spec — E004. Pure cuts (no transitions) + freeze-extends.
# Run from inside media/DBX-APP-S01E004/ with FF=<ffmpeg>.
#
# THE INSTRUCTIONS ARE `rough.md`'s [SCREEN: ...] directives — they map 1:1 onto these seven
# recordings. Each output is cut to EXACTLY the length of its overlay slot in the timeline.
#
# THE CARD IS SMALL. It sits in the reserved top-left corner (268x580 in the 1080x1920 frame —
# the founder's fringe reaches x~312 on 06_discovery, so the card's right edge must stop at 292).
# At that scale fine UI text does not read, so every clip:
#   * keeps FEW, LONG, SETTLED segments (spinners, typing, nav animations are cut),
#   * FREEZE-EXTENDS its payoff (recordings always short-change the last state), and
#   * gets an orange marker on the element the narration is talking about.
#
# The status bar (with the red recording pill) is cropped off; width is trimmed symmetrically to
# keep the 0.4623 phone aspect so `objectFit: fill` in SideScreen introduces no distortion.
# Output is 540 wide = 2x the card, plenty for the render.
#
# NOTE ON ORDER: segments are ordered to match the NARRATION, not the source clock. In
# 11_screen-sponsorship the duration dropdown (src 4.60) is played AFTER the start-date calendar
# (src 5.55), because he says "choose when it starts" before "choose how long it runs".
#
# No privacy blurs: every account on screen (@rubio / Zenkai Rubio, @dbx) is the founder's own.
set -e
: "${FF:=ffmpeg}"
: "${THREADS:=1}"
NICE="nice -n 15"
mkdir -p screens .chop-tmp

CROP_PHONE="crop=1082:2340:44:120"   # 1170x2532 -> drop status bar, keep aspect
CROP_MIRROR="crop=818:1770:33:90"    # 884x1920  -> same treatment
POST="scale=540:-2,setsar=1,fps=30,format=yuv420p"

# chop <src> <out> <crop> <spec...>
#   spec item = "seg:FROM:TO"  (play source FROM..TO)
#             | "hold:T:SECS"  (freeze the frame at source T for SECS)
chop() {
  local src=$1 out=$2 crop=$3; shift 3
  local inputs=() fc="" n=0 labels=""
  local pngdir=".chop-tmp/$(basename "$out" .mp4)"; rm -rf "$pngdir"; mkdir -p "$pngdir"
  inputs+=(-i "_source/screens/$src")
  local vidn=0 idx=1
  for item in "$@"; do
    IFS=: read -r kind a b <<<"$item"
    if [ "$kind" = seg ]; then
      fc+="[0:v]trim=${a}:${b},setpts=PTS-STARTPTS,${crop},${POST}[v${n}];"
    else
      local png="$pngdir/h${n}.png"
      $NICE $FF -y -ss "$a" -i "_source/screens/$src" -frames:v 1 -update 1 "$png" -loglevel error
      # a freeze time within ~1 frame of EOF silently yields no frame -> catch it here
      [ -s "$png" ] || { echo "FATAL: no frame at ${a}s in $src (too close to EOF?)" >&2; exit 1; }
      inputs+=(-loop 1 -framerate 30 -t "$b" -i "$png")
      fc+="[${idx}:v]${crop},${POST}[v${n}];"
      idx=$((idx+1))
    fi
    labels+="[v${n}]"; n=$((n+1))
  done
  fc+="${labels}concat=n=${n}:v=1:a=0[out]"
  echo ">>> $out  ($n pieces)"
  $NICE $FF -y "${inputs[@]}" -filter_complex "$fc" -map "[out]" -an \
    -threads "$THREADS" -filter_threads "$THREADS" -filter_complex_threads "$THREADS" \
    -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -fps_mode cfr -r 30 "screens/$out" -loglevel error
  rm -rf "$pngdir"
  printf "    %s\n" "$(ffprobe -v error -show_entries format=duration -of csv=p=0 "screens/$out")s"
}

# ── beat 5 · sponsorship · slot 7.60s ────────────────────────────────────────────────
# [SCREEN: Sponsorship / Pass entry] + [SCREEN: fast montage - start date, duration, active pass]
#   A  0.00-0.88  the Sponsorships page (pass entry)          -> "go to the Sponsorship page"
#   .  0.88-2.75  held                                         -> "...and pick your spots."
#   B  2.75-3.65  calendar, start day 9 selected               -> "choose when it starts"
#   .  3.65-4.60  held
#   C  4.60-5.28  duration dropdown 1d/7d/14d/30d              -> "choose how long it runs"
#   .  5.28-6.20  held
#   D  6.20-7.10  final pass Jul 22-28, Confirm - $14.99       -> "DirtBikeX got you covered"
#   .  7.10-7.60  held
# Skipped: 3.35-4.35 sheet slide + "Checking availability..." spinner; 5.35-5.55 and 6.50-6.70
# value-change animations. The only no-dropdown "confirmed" frame is a 0.15s sliver at 4.35.
chop 11_screen-sponsorship.MP4 11_sponsorship_cut.mp4 "$CROP_PHONE" \
  seg:2.40:3.28 hold:3.28:1.87 seg:5.55:6.45 hold:6.45:0.95 \
  seg:4.60:5.28 hold:5.28:0.92 seg:6.90:7.80 hold:7.80:0.50

# ── beat 6 · discovery · three cards fanning out, one per placement ──────────────────
# [SCREEN: fast montage as my finger points, fan out in sequence individually]
# Only 5.25s for three surfaces, so each card shows its PAYOFF (the sponsored profile in that
# surface) and holds. The taps that lead there are cut — the marker points at the result.
chop 12_screen-search.MP4 12_search_cut.mp4 "$CROP_PHONE" \
  seg:2.92:3.50 hold:3.50:1.09                       # Users tab, sponsored rider   -> 1.67s
chop 13_screen-chat.MP4 13_chat_cut.mp4 "$CROP_PHONE" \
  seg:2.30:2.86 hold:2.86:1.10                       # New Chat, "Get Featured"     -> 1.66s
chop 14_screen-filter.mov 14_filter_cut.mp4 "$CROP_PHONE" \
  seg:3.00:3.60 hold:3.60:1.05                       # Author Username picker       -> 1.65s

# ── beat 7 · splash · slot 5.95s ─────────────────────────────────────────────────────
# [SCREEN: sponsor card on splash screen, pause -> tap -> profile]
#   A 0.00-2.15  paused splash with the @rubio sponsor card   -> "pause it"
#   B 2.15-3.55  the avatar is tapped (marker)                -> "tap your face"
#   C 3.55-4.80  @rubio's profile                             -> "straight into your profile"
#   . 4.80-5.95  held (the activity list only finishes loading at the very end)
chop 15_screen-splash.mov 15_splash_cut.mp4 "$CROP_PHONE" \
  seg:1.15:3.30 seg:3.90:5.30 seg:7.55:8.80 hold:8.80:1.15

# ── beat 8 · capped · slot 5.80s ─────────────────────────────────────────────────────
# [SCREEN: active pass / availability capped rotated]
#   A 0.00-1.35 Availability caps (Pass 1/40, Airtime 0/20)   -> "capped"
#   . 1.35-2.35 held
#   B 2.35-3.70 "Currently rotating" with the active sponsor  -> "and rotated"
#   . 3.70-5.80 held (this settled state only lasts 1.4s in the source)
chop 16_screen-capped.mov 16_capped_cut.mp4 "$CROP_PHONE" \
  seg:0.10:1.45 hold:1.45:1.00 seg:1.95:3.28 hold:3.28:2.12

# ── beat 9 · stats · slot 5.90s ──────────────────────────────────────────────────────
# [SCREEN: fast stats montage]   (884x1920 source — mirrored recording, not a device capture)
#   A 0.00-1.27 VIEWS dashboard: metric tiles + daily trend   -> "check your sponsorship stats"
#   . 1.27-2.57 held
#   B 2.57-3.57 scrolled to the By-region bars                -> "Regional exposure, daily trends"
#   . 3.57-5.90 held
chop 17_screen-stats.MP4 17_stats_cut.mp4 "$CROP_MIRROR" \
  seg:2.78:4.05 hold:4.05:1.30 seg:5.55:6.50 hold:6.50:2.38

rmdir .chop-tmp 2>/dev/null || true
echo ">>> CHOPS DONE"
