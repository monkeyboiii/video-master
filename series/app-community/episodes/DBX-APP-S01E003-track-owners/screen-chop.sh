#!/bin/bash
# Screen-recording chop spec — E003. Pure cuts (select+setpts), no transitions, muted.
# Each output is cut to EXACTLY the length of the narration line it plays under.
# Boundaries were verified against settled frames (no mid-animation / mid-keystroke cuts).
# Run from inside media/DBX-APP-S01E003/ with FF=<path to ffmpeg>.
set -e
: "${FF:=ffmpeg}"
chop(){ echo ">>> $2"; "$FF" -y -i "_source/screens/$1" \
  -vf "fps=30,select='$3',setpts=N/30/TB,scale=-2:1704" \
  -an -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p "screens/$2"; }

# flair 8.60s -> 5.92s : drop the Edit-Profile dwell/scroll and the save-dim frame
chop 07_screen-flair.mov flair_cut.mp4 \
  "between(t,0,2.40)+between(t,3.85,6.25)+between(t,7.45,8.57)"

# create 58.45s -> 7.95s : six segments telling the whole story the narration promises —
# set the values, press Next, watch the editor load, then HOLD on the created event.
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

# rsvp 15.63s -> 5.08s : drop the ~3.4s map spinner. Trimmed from 7.97s so this overlay ends
# INSIDE its own beat: the founder's framing on 06_cta puts his head where the side screen
# sits, so it must not bleed past 41.96s. (Budget went to `create` instead.)
#   0.00-2.75 Events tab (lands under "Events tab," t=37.20) · 2.75-3.20 detail
#   3.20-3.88 RSVP action sheet · 3.88-5.08 "Going ✓" payoff
chop 09_screen-rsvp.mp4 rsvp_cut.mp4 \
  "between(t,0,2.75)+between(t,7.85,8.30)+between(t,10.45,11.13)+between(t,12.30,13.50)"
