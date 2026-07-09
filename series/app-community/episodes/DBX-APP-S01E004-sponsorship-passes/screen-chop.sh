#!/bin/bash
# Screen-recording chop spec — E004. Pure cuts (no transitions) + freeze-extends.
# Run from inside media/DBX-APP-S01E004/ with FF=<ffmpeg>.
#
# THE INSTRUCTIONS ARE `rough.md`'s [SCREEN: ...] directives — they map 1:1 onto these seven
# recordings. Each output is cut to EXACTLY the length of its overlay slot in the timeline.
#
# THE CARDS ARE BIG. A single card is 470x1017 — ~23% of the 1080x1920 frame — anchored top-left.
# It bleeds over the founder's hair and a little of his brow; that is deliberate and approved.
# The three fan-out cards are 306x662 each. So that the UI actually reads, every clip:
#   * PLAYS THROUGH. Cutting and freezing are a LAST RESORT, not a default: they are used only
#     to drop a genuine wait (a spinner, a nav load) or when the source is shorter than its beat.
#   * shows the ENTRY into each surface — a buyer has to see where the portal is.
#   * gets an orange marker (rect, or a circle for a round control) on the element the
#     narration is talking about.
#
# The status bar (with the red recording pill) is cropped off; width is trimmed symmetrically to
# keep the 0.4623 phone aspect so `objectFit: fill` in SideScreen introduces no distortion.
# Output is 700 wide (~1.5x the single card, ~2.3x a fan card) so the render has headroom.
#
# ORDER: chronological, always. Two earlier passes reordered 11_screen-sponsorship to chase the
# narration and both made the app's state regress on screen. Neither was needed: played straight,
# the recording already lands the calendar on "choose when it starts" and the duration dropdown on
# "choose how long it runs". Measure before you rearrange.
#
# No privacy blurs: every account on screen (@rubio / Zenkai Rubio, @dbx) is the founder's own.
set -e
: "${FF:=ffmpeg}"
: "${THREADS:=1}"
NICE="nice -n 15"
mkdir -p screens .chop-tmp

CROP_PHONE="crop=1082:2340:44:120"   # 1170x2532 -> drop status bar, keep aspect
CROP_MIRROR="crop=818:1770:33:90"    # 884x1920  -> same treatment
POST="scale=700:-2,setsar=1,fps=30,format=yuv420p"

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
# The ENTRY matters: a buyer has to see WHERE the portal is. The nav plays in full
# (profile -> menu -> Sponsorships -> the page), with an orange border on the menu item.
#
# It plays start to finish with ONE cut. Card time == source time, so the words land themselves:
#
#   0.00-3.28  profile -> nav menu (marker: "Sponsorships") -> the page (marker: "Your spot +")
#              ends exactly on "Choose"          (28.73)
#   3.28-4.29  the calendar / start-date sheet   -> "Choose when it starts,"  (28.73-29.74)
#   4.29-6.23  the duration dropdown opens, 30d -> 7d, price resolves to $14.99. The picker
#              CHANGE animation is kept in full  -> "choose how long it runs," (29.74-31.68)
#   [cut 6.23-6.48: 0.25s in which literally nothing changes -- Jul 9-15 / 7d / $14.99]
#   6.48-7.85  the start day moves 9 -> 22, Jul 22-28, the pass is bought
#                                             -> "and DirtBikeX got you covered." (31.68-33.05)
#
# The app's own order (duration, then start date) reads as the narration's order because the
# calendar sheet is ALREADY on screen while he says "when it starts" -- it is the start picker.
# Nothing rewinds, nothing repeats.
chop 11_screen-sponsorship.MP4 11_sponsorship_cut.mp4 "$CROP_PHONE" \
  seg:0.00:6.23 seg:6.48:7.85                                    # 7.60s (one cut, no freeze)

# ── beat 6 · discovery · three cards fanning out, each playing its OWN video ─────────
# [SCREEN: fast montage as my finger points, fan out in sequence individually]
# No aggressive chopping: each recording plays from frame 0 so the ENTRY into each surface is
# visible (tap search -> Users tab; tap + -> New Chat; tap filter -> Author Username).
# The three appear staggered (1 right, 2 middle-high, 3 left, per the director's sketch) and all
# fade together at 38.10. Only the shortest, `search`, holds its payoff so it survives to the fade.
chop 12_screen-search.MP4 12_search_cut.mp4 "$CROP_PHONE" \
  seg:0.00:3.50 hold:3.50:1.45                                   # 4.95s (1.45 hold to the group fade)
chop 13_screen-chat.MP4 13_chat_cut.mp4 "$CROP_PHONE" \
  seg:0.00:4.30 hold:4.30:0.08                                   # 4.38s (plays out in full)
chop 14_screen-filter.mov 14_filter_cut.mp4 "$CROP_PHONE" \
  seg:0.00:3.81                                                  # 3.81s (plays out in full)

# ── beat 7 · splash · slot 5.95s ─────────────────────────────────────────────────────
# [SCREEN: sponsor card on splash screen, pause -> tap -> profile]
# Plays through: the paused splash (the play control is showing, so it IS paused), the tap on the
# @rubio avatar, then the profile. The 1.85s of "Loading @rubio..." spinner is cut -- a genuine
# wait, and the only thing removed. What is left is 0.75s shorter than the beat, so the finished
# profile is held: the payoff must still be on screen when he says "profile." at 44.15.
# The marker CIRCLES the play/pause control (bottom-right of the splash), which is what
# "pause it" means — not the tap.
chop 15_screen-splash.mov 15_splash_cut.mp4 "$CROP_PHONE" \
  seg:2.10:6.20 seg:8.15:8.80 hold:8.78:1.20                     # 5.95s

# ── beat 8 · capped · slot 4.90s ─────────────────────────────────────────────────────
# [SCREEN: active pass / availability capped rotated]
# Nothing is cut: the whole 3.23s recording plays, including the tap to "Currently rotating".
# It is 1.67s shorter than the beat, so 1.67s has to be held SOMEWHERE. An earlier pass dumped all
# of it on the near-empty "Currently rotating" list, which sat dead for three seconds. Instead:
#   * 1.00s on the head, where the screen is static anyway (the caps table + budget donut is the
#     densest frame in the episode and the viewer needs the time to read it). It also keeps the
#     caps on screen through "capped" (47.16); "rotated," (47.75) lands on the rotating list.
#   * 0.67s on the tail payoff.
chop 16_screen-capped.mov 16_capped_cut.mp4 "$CROP_PHONE" \
  hold:0.10:1.00 seg:0.05:3.28 hold:3.24:0.67                    # 4.90s (no cuts)

# ── beat 9 · stats · slot 5.90s ──────────────────────────────────────────────────────
# [SCREEN: fast stats montage]   (884x1920 source — mirrored recording, not a device capture)
# Plays straight through, entry included. No cuts, no freezes.
chop 17_screen-stats.MP4 17_stats_cut.mp4 "$CROP_MIRROR" \
  seg:0.30:6.20                                                  # 5.90s

rmdir .chop-tmp 2>/dev/null || true

# SideScreen resolves `src` against Remotion's public/ — NOT against media/. Publishing the chops
# is part of chopping them: a manual copy is a step you will forget, and the render will silently
# use the previous cut. (It did. Twice.)
PUB="../../packages/remotion-graphics/public/e004"
mkdir -p "$PUB"
cp -f screens/*.mp4 "$PUB/"
echo ">>> published $(ls screens/*.mp4 | wc -l) clips to $PUB"
echo ">>> CHOPS DONE"
