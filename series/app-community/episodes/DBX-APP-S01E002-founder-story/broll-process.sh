#!/bin/bash
# Process the "scattered/outdated apps" b-roll for E002.
# Source: _source/07_scatter-outdated.mov (884x1920, 60fps iPhone screen recording, SDR bt709 —
#         NO HDR tone-map). Three app scenes searching for a dirt-bike community:
#   scene 1  0.00-1.87  a Discourse search: "dirt bike" -> spinner -> "No sites found."
#   slide            1.87-2.10
#   scene 2  2.10-3.48  second app, search "Beginner" -> a member list of REAL riders
#   slide            3.48-3.68
#   scene 3  3.68-4.67  ThumperTalk: red logo, "Existing user? Sign In"
#
# Two privacy/edit requirements, both baked here so the timeline references one clip:
#   * The scene-2 member names/locations/faces are real. Blur them, as PER-ROW redaction
#     bands. Full-width bands at fixed row-y cover the names through the horizontal slide
#     in/out (each name stays in its y-band), so no per-frame tracking is needed.
#   * The scene-3 ThumperTalk red logo is a third-party mark. Blur it with a full-width band
#     at its y-row, active across the slide-in so it is covered while it moves into place.
#
# Output: footage/07_scattered-apps.mov — a 884x1920 phone card with ROUNDED CORNERS + alpha
# (ProRes 4444), so it reads as a card like the invite card. The compositor scales it down and
# centres it upper-frame over the founder, whose footage is blurred (not dimmed) behind it,
# snapping in on a shutter SFX. See rebuild-e2.sh / edit-notes for placement + the blur-V1 window.
set -e
: "${FF:=ffmpeg}"
# Run from inside the media bundle (media/DBX-APP-S01E002), where _source/ and footage/ live.
SRC=${SRC:-_source/07_scatter-outdated.mov}
OUT=${OUT:-footage/07_scattered-apps.mov}

# The scene-2 hold ends at src 3.46 and scene 3 settles at src 3.70; the 0.24s nav slide
# between is dropped with a hard cut (select), because blurring the names through that slide
# smears the incoming ThumperTalk gray into venetian stripes. After the cut, output time = src
# time up to 3.46, and src-0.24 after; the blur enable windows below are in OUTPUT time.
# name-row bands (884-wide), full width, y = Member-tag top .. location bottom, active over the
# whole scene-2 window (covers the scene1->2 slide-in too, where each name stays in its y-band).
# logo band: y 260..386 full width; after the hard cut the logo is already settled, so a static
# band suffices.
"$FF" -y -i "$SRC" -filter_complex "\
[0:v]fps=30,select='not(between(t,3.46,3.70))',setpts=N/30/TB,split=8[bg][r1][r2][r3][r4][r5][r6][lg];\
[r1]crop=884:120:0:480,boxblur=24:3[b1];\
[r2]crop=884:150:0:682,boxblur=24:3[b2];\
[r3]crop=884:118:0:900,boxblur=24:3[b3];\
[r4]crop=884:150:0:1086,boxblur=24:3[b4];\
[r5]crop=884:145:0:1298,boxblur=24:3[b5];\
[r6]crop=884:150:0:1516,boxblur=24:3[b6];\
[lg]crop=884:126:0:260,boxblur=24:3[bl];\
[bg][b1]overlay=0:480:enable='between(t,1.85,3.46)'[o1];\
[o1][b2]overlay=0:682:enable='between(t,1.85,3.46)'[o2];\
[o2][b3]overlay=0:900:enable='between(t,1.85,3.46)'[o3];\
[o3][b4]overlay=0:1086:enable='between(t,1.85,3.46)'[o4];\
[o4][b5]overlay=0:1298:enable='between(t,1.85,3.46)'[o5];\
[o5][b6]overlay=0:1516:enable='between(t,1.85,3.46)'[o6];\
[o6][bl]overlay=0:260:enable='between(t,3.46,4.60)',format=yuva420p[phone];\
color=black:s=884x1920:d=4.4:r=30,format=gray,geq=lum='255*lte(sqrt(pow(max(max(0\,72-X)\,X-811)\,2)+pow(max(max(0\,72-Y)\,Y-1847)\,2))\,72)'[mask];\
[phone][mask]alphamerge[rc]" \
 -map "[rc]" -an -c:v prores_ks -profile:v 4444 -pix_fmt yuva444p10le -fps_mode cfr -r 30 "$OUT"
echo "wrote $OUT"
