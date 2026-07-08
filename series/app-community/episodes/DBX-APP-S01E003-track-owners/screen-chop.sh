#!/bin/bash
# Screen-recording chop spec — E003. Pure cuts (select+setpts), no transitions, muted.
# Each output is cut to EXACTLY the length of the overlay slot it plays in.
# Boundaries were verified frame-by-frame against settled frames: no cut lands mid-scroll,
# mid-animation, mid-keystroke, or on a spinner. Cuts are FEW and LONG so the eye registers
# each state, and each clip ENDS ON A HELD FRAME so the payoff is readable.
# Run from inside media/DBX-APP-S01E003/ with FF=<path to ffmpeg>.
set -e
: "${FF:=ffmpeg}"

# pure multi-segment cut, optionally holding the final frame for $4 seconds.
# The `fps=30` AFTER setpts is load-bearing: setpts drops the frame-rate hint, so tpad would
# read stop_duration against a bogus rate (1.11s came out as 2 frames) and libx264 would fall
# back to writing 25 fps. Re-establishing it costs nothing and keeps both honest.
chop(){ echo ">>> $2"; "$FF" -y -i "_source/screens/$1" \
  -vf "fps=30,select='$3',setpts=N/30/TB,fps=30${4:+,tpad=stop_mode=clone:stop_duration=$4},scale=-2:1704" \
  -an -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -fps_mode cfr -r 30 "screens/$2"; }

# ── flair · 8.60s -> 5.92s ────────────────────────────────────────────────────────────
# Two real takes, each followed by a HELD STILL, because the two moments that matter are the
# two the recording rushes past. The SAVE is cut out entirely (spinner 6.22-7.45,
# "Saved: Account" toast 7.5-8.0) — the flair is chosen, then it is simply worn.
#
#   A    0.00-2.60  src 2.35-4.95. Edit Profile (Flair = "Verified Boost Riders") -> scroll ->
#                   the Flair menu opens at src 3.90, is opaque and stable from src 4.35.
#                   Cut at 4.95: the tap lands at 4.96, dismiss animates 4.97-5.12.
#   H1   2.60-3.50  still of src 4.90 held 0.90s — the open menu. Without it the menu is only
#                   legible for 0.60s, which is what "they go away too quickly" meant.
#   B    3.50-4.50  src 5.18-6.18. Flair now reads "Track Stewards" (green), Save lit.
#                   Cut at 6.18: the saving dim begins at 6.22.
#   H2   4.50-5.97  still of src 8.58 held 1.45s — the profile tab wearing the new flair.
#
# The stills are stills, not tpad: the frame we hold is not the last frame of the preceding
# segment. For H2 in particular, the bottom tab bar is only drawn in the final ~2 frames of
# the recording (absent at 8.54, present at 8.58) — cutting in live would pop it mid-hold.
# side-screen.flair.json boxes the "Track Stewards" row across A+H1, then the avatar and its
# new badge across H2.
echo ">>> flair_cut.mp4"
FL_MENU="$(mktemp -u).png"; FL_WORN="$(mktemp -u).png"
"$FF" -y -ss 4.90 -i "_source/screens/07_screen-flair.mov" -frames:v 1 -update 1 "$FL_MENU" -loglevel error
"$FF" -y -ss 8.58 -i "_source/screens/07_screen-flair.mov" -frames:v 1 -update 1 "$FL_WORN" -loglevel error
"$FF" -y -i "_source/screens/07_screen-flair.mov" \
  -loop 1 -framerate 30 -t 0.90 -i "$FL_MENU" \
  -loop 1 -framerate 30 -t 1.45 -i "$FL_WORN" \
  -filter_complex "\
[0:v]fps=30,split=2[s0][s1];\
[s0]select='between(t,2.35,4.95)',setpts=N/30/TB,fps=30,scale=-2:1704,setsar=1,format=yuv420p[a];\
[s1]select='between(t,5.18,6.18)',setpts=N/30/TB,fps=30,scale=-2:1704,setsar=1,format=yuv420p[b];\
[1:v]fps=30,scale=-2:1704,setsar=1,format=yuv420p[h1];\
[2:v]fps=30,scale=-2:1704,setsar=1,format=yuv420p[h2];\
[a][h1][b][h2]concat=n=4:v=1:a=0[v]" \
  -map "[v]" -an -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -fps_mode cfr -r 30 \
  "screens/flair_cut.mp4"
rm -f "$FL_MENU" "$FL_WORN"

# ── create · 58.45s -> 7.95s ──────────────────────────────────────────────────────────
# Six segments telling the whole story the narration promises — set the values, press Next,
# watch the editor load, then HOLD on the created event.
# Overlay-relative timing (this clip is placed at timeline 28.95s):
#   A 0.00-1.45  form open / title row     (drops the name typing)
#   B 1.45-2.87  date + location set       (drops the location typing, RSVP/max fiddling)
#   C 2.87-4.62  Recurrence "Every other Wednesday" — lands under "reoccurring" (t=4.22)
#   D 4.62-5.37  the Next button, tapped at t=5.12
#   E 5.37-6.27  "Setting up the editor..." spinner (0.90s — the wait is felt, not endured)
#   F 6.27-7.95  the finished event card, held 1.68s so the payoff is readable
# The source's loading pill ghosts over Create Topic until 50.63, so F starts at 50.72;
# it ends at 52.40, the last stable frame before the recording scrolls away.
# Cuts C-F make the on-screen story hard to follow on their own, so side-screen.create.json
# adds orange tap markers over the Recurrence row and the Next button.
chop 08_screen-create.mov create_cut.mp4 \
  "between(t,1.55,3.00)+between(t,21.60,23.02)+between(t,36.95,38.70)+between(t,40.05,40.80)+between(t,42.45,43.35)+between(t,50.72,52.40)"

# ── rsvp · 15.63s -> 5.06s ────────────────────────────────────────────────────────────
# Three long takes and a freeze. The map spinner (5.0-7.8) and the recurring-event ACTION
# SHEET (9.9-11.9) are both dropped: with only 5.06s, showing them would starve the payoff.
#   A 0.00-1.55  Events tab. Lands under "Events tab," (t=0.30). Card boxed — that's the tap.
#   B 1.55-2.75  event detail, map fully painted (src 7.8-9.2, no spinner, page doesn't
#                scroll). Map boxed.
#   C 2.75-3.95  "Going ✓ 1". src 13.40 is after the bottom bar finishes scrolling. Pill boxed.
#   FREEZE 3.95-5.06  the last frame of C, held 1.11s.
# It must end by timeline 41.96: the safe box lands on the founder's face on 06_cta.
chop 09_screen-rsvp.mp4 rsvp_cut.mp4 \
  "between(t,0.30,1.85)+between(t,7.85,9.05)+between(t,13.40,14.60)" 1.11
