#!/bin/bash
# Screen-recording chop spec — E004. Pure cuts (no transitions) + freeze-extends.
# Run from inside media/DBX-APP-S01E004/ with FF=<ffmpeg>.
#
# THE INSTRUCTIONS ARE `rough.md`'s [SCREEN: ...] directives — they map 1:1 onto these seven
# recordings. Each output is cut to EXACTLY the length of its overlay slot in the timeline.
#
# NOTHING IS TRIMMED HORIZONTALLY. An earlier pass cropped 44px off each side of every phone
# capture to force the native aspect into the card; the director noticed the app UI had lost its
# edges. Full native width is now preserved. The ONLY crop is a vertical one, because every one
# of these recordings carries a RED SCREEN-RECORDING PILL in the iOS status bar, and that cannot
# be on screen. So the aspect DOES change, and the cards are sized to the NEW aspect — never
# stretch (`objectFit: fill` + a mismatched box silently distorts the UI).
#
# THE CARDS ARE BIG. A single card is 496 wide at x=16,y=110 — the right edge sits at x=512,
# which is the furthest right it can go without covering the founder's left eye. That limit was
# measured across the whole of every carded beat on the ENHANCED footage (the tightest is
# `09_stats`, where his eye's outer corner reaches x~520). He allows the card to seep onto his
# face; he does not allow it to cover it. Card bottom lands ~1133, well clear of the caption band.
# The three fan-out cards are 306x631 each.
#
# Every clip:
#   * PLAYS THROUGH. Cutting and freezing are a LAST RESORT, not a default: they are used only
#     to drop a genuine wait (a spinner, a nav load) or when the source is shorter than its beat.
#   * shows the ENTRY into each surface — a buyer has to see where the portal is.
#   * gets an orange marker (rect, or a circle for a round control) on the element the
#     narration is talking about.
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

# Vertical-only crops. Full native width, both families.
#   A: 1170x2532 iPhone captures. Red pill y40-90, black gap y90-140, app header from y150.
#      Cutting at y=120 lands in the gap.                     -> 1170x2412, aspect 0.485075
#   B: 884x1920 mirrored capture (17_screen-stats only). Status bar y40-110, header from y150.
#      The bottom (app tab bar + iOS home indicator) is kept.  -> 884x1800, aspect 0.491111
CROP_PHONE="crop=1170:2412:0:120"
CROP_MIRROR="crop=884:1800:0:120"
POST="scale=700:-2,setsar=1,fps=30,format=yuv420p"

# chop <src> <out> <crop> <spec...>
#   spec item = "seg:FROM:TO"  (play source FROM..TO)
#             | "hold:T:SECS"  (freeze the frame at source T for SECS)
chop() {
  local src=$1 out=$2 crop=$3; shift 3
  local inputs=() fc="" n=0 labels=""
  local pngdir=".chop-tmp/$(basename "$out" .mp4)"; rm -rf "$pngdir"; mkdir -p "$pngdir"
  inputs+=(-i "_source/screens/$src")
  local idx=1
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
  printf "    %ss  %s\n" \
    "$(ffprobe -v error -show_entries format=duration -of csv=p=0 "screens/$out")" \
    "$(ffprobe -v error -select_streams v -show_entries stream=width,height -of csv=p=0 "screens/$out")"
}

# ── beat 5 · sponsorship · slot 7.60s ────────────────────────────────────────────────
# [SCREEN: Sponsorship / Pass entry] + [SCREEN: fast montage - start date, duration, active pass]
# Start to finish with ONE cut. Card time == source time, so the words land themselves:
#
#   0.00-3.28  profile -> nav menu (marker: "Sponsorships") -> the page (circle: "Your spot +")
#              ends exactly on "Choose"          (30.96)
#   3.28-4.29  the calendar / start-date sheet   -> "Choose when it starts,"  (30.96-31.97)
#   4.29-6.23  the duration dropdown opens, 30d -> 7d, price resolves to $14.99. The picker
#              CHANGE animation is kept in full  -> "choose how long it runs," (31.97-33.91)
#   [cut 6.23-6.48: 0.25s in which literally nothing changes -- Jul 9-15 / 7d / $14.99]
#   6.48-7.85  the start day moves 9 -> 22, Jul 22-28, the pass is bought
#                                             -> "and DirtBikeX got you covered." (33.91-35.28)
chop 11_screen-sponsorship.MP4 11_sponsorship_cut.mp4 "$CROP_PHONE" \
  seg:0.00:6.23 seg:6.48:7.85                                    # 7.60s (one cut, no freeze)

# ── beat 6 · discovery · three cards fanning out, each playing its OWN video ─────────
# [SCREEN: fast montage as my finger points, fan out in sequence individually]
# The director's sketch numbers the boxes 1 RIGHT, 2 MIDDLE-HIGH, 3 LEFT and now names them:
#   1 "Search users"  2 "Filter authors"  3 "Create chat"
# so `search` -> box 1, `filter` -> box 2, `chat` -> box 3 (chat and filter swapped vs the first
# build). They enter one-two-three at a fixed 0.55s delay (35.38 / 35.93 / 36.48) and fade out
# together at ~40.53. Each plays from frame 0 so the ENTRY into its surface is visible.
#   search  3.555s source, 5.15s slot -> plays out, then holds its @rubio payoff 1.65s.
#   filter  4.027s source, 4.60s slot -> plays out (incl. the Advanced Filters sheet), holds 0.65s.
#   chat    4.323s source, 4.05s slot -> plays 4.05s; the trimmed 0.27s tail is keyboard-idle,
#           after the @rubio row is already on screen. The only trim of the three.
chop 12_screen-search.MP4 12_search_cut.mp4 "$CROP_PHONE" \
  seg:0.00:3.50 hold:3.45:1.65                                   # 5.15s -> box 1, @35.38
chop 14_screen-filter.mov 14_filter_cut.mp4 "$CROP_PHONE" \
  seg:0.00:3.95 hold:3.90:0.65                                   # 4.60s -> box 2, @35.93
chop 13_screen-chat.MP4 13_chat_cut.mp4 "$CROP_PHONE" \
  seg:0.00:4.05                                                  # 4.05s -> box 3, @36.48

# ── beat 7 · splash · slot 5.95s ─────────────────────────────────────────────────────
# [SCREEN: sponsor card on splash screen, pause -> tap -> profile]
# REPLACED with the director's re-shoot, which opens on him ENTERING the app from Spotlight —
# "the entering into app is also needed". Everything cut is a frozen or dead frame:
#   0.85s  1.15-2.00  Spotlight "dirtBikeX" -> app-open transition          (the entry)
#   1.15s  2.00-3.15  the splash PLAYS, then he taps pause at src ~2.95
#   1.35s  hold 3.15  the just-paused splash, frozen. A rock-steady target for the SHRINKING
#                     CIRCLE that lands on the play/pause control at "pause" (card 2.85 = 43.58).
#                     [cuts src 3.15-5.00: the same frozen frame, nothing happens]
#   0.60s  5.00-5.60  he taps the @rubio avatar; "Opening profile..." fires
#                     [cuts src 5.60-7.10: the toast just sits there]
#   0.40s  7.10-7.50  the app pushes into the feed
#                     [cuts src 7.50-8.65: black + "Loading @rubio..." spinner]
#   1.05s  8.65-9.70  the @rubio profile, loaded
#   0.62s  hold 9.70  held, so the payoff is still up on "profile." (card 5.65).
#                     0.62 not 0.55: the segments are cut from a 60fps VFR source and each one
#                     loses up to half a frame when it is resampled to CFR 30. The nominal 5.95
#                     landed at 5.90 and the card outran its own clip.
chop 15_screen-enter-splash.mov 15_splash_cut.mp4 "$CROP_PHONE" \
  seg:1.15:2.00 seg:2.00:3.15 hold:3.15:1.35 seg:5.00:5.60 \
  seg:7.10:7.50 seg:8.65:9.70 hold:9.70:0.62                     # -> 5.97s (slot 5.95)

# ── beat 8 · capped · slot 4.90s ─────────────────────────────────────────────────────
# [SCREEN: active pass / availability capped rotated]
# Nothing is cut: the whole 3.23s recording plays, including the tap to "Currently rotating".
# It is 1.67s shorter than the beat, so 1.67s has to be held SOMEWHERE. An earlier pass dumped all
# of it on the near-empty "Currently rotating" list, which sat dead for three seconds. Instead:
#   * 1.00s on the head, where the screen is static anyway (the caps table + budget donut is the
#     densest frame in the episode and the viewer needs the time to read it). It also keeps the
#     caps on screen through "capped" (49.39); "rotated," (49.98) lands on the rotating list.
#   * 0.67s on the tail payoff.
chop 16_screen-capped.mov 16_capped_cut.mp4 "$CROP_PHONE" \
  hold:0.10:1.00 seg:0.05:3.28 hold:3.24:0.67                    # 4.90s (no cuts)

# ── beat 9 · stats · slot 5.90s ──────────────────────────────────────────────────────
# [SCREEN: fast stats montage]   (884x1920 mirrored recording, not a device capture)
# Plays straight through, entry included. No cuts, no freezes. The ENTRY is the point here: he
# opens the nav menu, then taps the small round STAR button in the page's top-right corner
# (source t=2.62). A shrinking circle narrows onto that button just before the tap (54.68-55.48).
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
