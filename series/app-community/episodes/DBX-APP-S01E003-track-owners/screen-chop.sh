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

# create 58.45s -> 5.06s : drop name typing, location typing, RSVP/max fiddling, the
# reminders detour, the compose screen, and ~8.5s of the "Setting up the editor..." wait.
# Recurrence: Every other Wednesday holds through "reoccurring" (overlay t=4.22); then a
# 0.55s glimpse of "Setting up the editor..." lands on "events." — the event visibly gets
# created instead of that step vanishing entirely.
chop 08_screen-create.mov create_cut.mp4 \
  "between(t,1.50,2.75)+between(t,21.60,22.85)+between(t,36.60,38.61)+between(t,42.60,43.15)"

# rsvp 15.63s -> 7.97s : drop the ~3.4s map spinner; short action sheet, longer "Going" payoff
chop 09_screen-rsvp.mp4 rsvp_cut.mp4 \
  "between(t,0,4.30)+between(t,7.70,8.85)+between(t,10.30,11.50)+between(t,12.25,13.57)"
