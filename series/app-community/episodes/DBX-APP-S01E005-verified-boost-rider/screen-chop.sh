#!/bin/bash
# Screen-recording chop spec — E005. Pure cuts (no transitions) + freeze-extends.
# Run from inside media/DBX-APP-S01E005/ with FF=<ffmpeg>.
#
# THE INSTRUCTIONS ARE `_source/rough.md`'s [SCREEN: ...] directives. The `.srt` files are
# canonical for the words; rough.md is canonical for what has to be on screen.
#
# ══════════════════════════════════════════════════════════════════════════════════════════
# NEVER CROP A SCREEN RECORDING. REDACT WHAT YOU DON'T WANT AND KEEP THE FRAME.
#
# This has now been got wrong twice, on two episodes, in two different ways:
#   E004 v1  cropped 44px off EACH SIDE to force the native aspect into the card. The director
#            saw the app UI lose its edges.
#   E004 v2  and E005 v1 cropped the status bar off the TOP to remove the red screen-recording
#            pill. That preserved full width, but it CHANGED THE ASPECT RATIO — a 884x1920 phone
#            became 884x1790, i.e. visibly stubbier than a real phone — and it sliced the app's
#            nav header off at the card's top edge. The director called it "cut", twice.
#
# The recording's aspect ratio is not ours to change. The only thing wrong with these frames is a
# red recording pill in the status bar, and a red pill is a REDACTION problem, not a crop problem.
# So: no crop. Paint the pill out in its own colour, and size the card to the NATIVE aspect.
#
# Corollary, learned the hard way (see `paint()` below): `drawbox color=black` on a yuv420p stream
# paints limited-range black — Y=16, i.e. RGB(16,16,16) — which is a visibly GREY rectangle on a
# true-black status bar. Do the fill in rgb24 and convert back.
# ══════════════════════════════════════════════════════════════════════════════════════════
#
# CARDS. Native aspect, sized to ~24% of the frame, as on E004:
#
#   card         source            box (x,y,w,h)         aspect
#   membership   1170x2532 (0.4621) 279,230,522,1130     CENTRED, over his face, above the band
#   flair        884x1920  (0.4604) 16,110,484,1051      top-left column
#   invite       884x1920           16,110,484,1051
#   stats        884x1920           16,110,484,1051
#   perks        884x1920           16,110,484,1051
#
# The four column cards share one box. Its right edge is 500; his viewer-left eye's outer corner
# never comes left of ~520 in any frame of any of those four windows, so the card seeps onto his
# hair and leaves both eyes and his mouth clear. Bottom 1161, against a caption band at 1372.
# The membership card is the exception the director asked for: centred, covering his face, its
# bottom (1360) just above the band and its top (230) just below the retiring brand mark (y212).
#
# Every clip:
#   * PLAYS THROUGH. Cuts are a LAST RESORT (a genuine wait); freezes only where the source is
#     shorter than its slot.
#   * shows the ENTRY into its surface — a viewer has to see where the portal is.
#   * gets an orange marker on the element the narration names. `enter: shrink` contracts a ring
#     onto a small round control.
#   * plays in CHRONOLOGICAL order. Reordering to chase the narration makes the app's state
#     visibly regress. Measure before you rearrange.
#
# PRIVACY, all handled at the SOURCE so no clean frame can reach `public/` or an export:
#   * "Shujin Li / @Rereliii" — a real third party — on the invite Redeemed list and in the chat
#     list. Blurred. @rubio / Zenkai Rubio / @dbx / 登山小鲁 / @teamdirtbikex are the founder's own.
#   * the invite QR. It is his own public "Instagram people welcome!" link, but the director asked
#     for it blurred, so it is blurred: a scannable credential in a published video is one-way.
set -e
: "${FF:=ffmpeg}"
: "${THREADS:=1}"
NICE="nice -n 15"
mkdir -p screens .chop-tmp

# NO CROP. The card carries the recording's own aspect ratio.
CROP_NONE="null"
POST="scale=700:-2,setsar=1,fps=30,format=yuv420p"

# ── redaction pre-pass ───────────────────────────────────────────────────────────────
# Every op is a native-pixel box on the source. `paint` fills with a solid colour (for the red
# recording pill, whose background is true black); `blur` hides content. Both take an `enable`
# expression so they only fire on the frames that need them.
#
# The whole chain runs in rgb24: `drawbox color=black` on yuv420p paints Y=16, a grey rectangle.
redact() {
  local src=$1 out=$2; shift 2
  if [ -f "_source/screens/$out" ]; then echo "    (redacted $out exists)"; return; fi
  local fc="[0:v]format=rgb24" n=0
  for op in "$@"; do
    IFS=: read -r kind bx by bw bh en <<<"$op"
    if [ "$kind" = paint ]; then
      fc+=",drawbox=x=${bx}:y=${by}:w=${bw}:h=${bh}:color=black:t=fill:enable='${en}'"
    else
      fc+="[p${n}];[p${n}]split=2[b${n}][f${n}];[f${n}]crop=${bw}:${bh}:${bx}:${by},boxblur=20:5[c${n}];[b${n}][c${n}]overlay=${bx}:${by}:enable='${en}'"
    fi
    n=$((n+1))
  done
  fc+=",format=yuv420p[v]"
  echo ">>> redacting $src -> $out  ($# ops)"
  $NICE $FF -y -i "_source/screens/$src" -filter_complex "$fc" -map "[v]" -an \
    -threads "$THREADS" -filter_threads "$THREADS" -filter_complex_threads "$THREADS" \
    -c:v libx264 -crf 16 -preset medium -pix_fmt yuv420p "_source/screens/$out" -loglevel error
}

# The red recording pill. Family A (884x1920) draws a red ring around the Dynamic Island plus a red
# dot inside it (island band y18-124); family B (1170x2532) replaces the clock with a solid red pill
# (x80-247, y32-95). Both sit on a true-black status bar, so a black fill is invisible.
PILL_A="paint:224:18:424:106:gte(t,0)"
PILL_B="paint:66:20:200:90:gte(t,0)"

redact 11_screen-membership.MP4 11_membership_r.mp4 "$PILL_B"
redact 12_screen-flair.MP4      12_flair_r.mp4      "$PILL_A"
redact 14_screen-stats.MP4      14_stats_r.mp4      "$PILL_A"
# 13: pill + the QR sheet (source 3.70-5.20) + the third party on the Redeemed list (from 6.20)
redact 13_screen-invite.MP4     13_invite_r.mp4     "$PILL_A" \
  "blur:230:1258:426:404:between(t,3.70,5.20)" "blur:24:406:330:136:gte(t,6.20)"
# 15: pill + the third party in the chat list (source 1.85-3.45)
redact 15_screen-perks.MP4      15_perks_r.mp4      "$PILL_A" \
  "blur:20:410:320:140:between(t,1.75,3.55)"

# chop <src> <out> <crop> <spec...>
#   spec item = "seg:FROM:TO"  (play source FROM..TO) | "hold:T:SECS" (freeze source T for SECS)
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

# ── beat 2 · membership · slot 3.55s (timeline 15.26 -> 18.81) ───────────────────────
# [SCREEN: open membership]  Nothing cut but 0.36s of idle head.
#   0.36-1.25  profile, settling   1.25-1.50  ENTRY: the top-right menu is tapped
#   1.50-2.50  the dropdown, "Membership" (marker)   2.50-2.90  the sheet slides up
#   2.90-3.96  PAYOFF: verified badge (shrink circle), the plans, "Become a Member" (marker)
chop 11_membership_r.mp4 11_membership_cut.mp4 "$CROP_NONE" \
  seg:0.357:3.957                                                # 3.60s (no cuts, no freeze)

# ── beat 3 · flair · slot 6.10s (timeline 23.96 -> 30.06) ────────────────────────────
# [SCREEN: Custom flair setting with pointing them out boxes, cut out save]
# One cut, and the director asked for it: everything after 4.80 is the SAVE step — a tap, a 4.4s
# greyed-out spinner, a toast, a bounce back. The flair is legible before any of it.
chop 12_flair_r.mp4 12_flair_cut.mp4 "$CROP_NONE" \
  seg:0.00:4.80 hold:4.70:1.30                                   # 6.10s (one cut: the save step)

# ── beat 4 · invite · slot 6.65s (timeline 30.36 -> 37.01) ───────────────────────────
# [SCREEN: invite show off]  One cut: a 1.2s backtrack to a Pending list already shown.
# The QR is blurred at the source — a scannable credential in a published video is one-way.
chop 13_invite_r.mp4 13_invite_cut.mp4 "$CROP_NONE" \
  seg:0.00:5.15 seg:6.35:7.85                                    # 6.65s (one cut)

# ── beats 5+6 · stats · slot 8.35s (timeline 37.31 -> 45.66) ─────────────────────────
# [SCREEN: sponsorship open -> stats -> previous months -> refresh -> engagement detail]
# The one card that stays up across a hard cut (40.27). Four cuts, every one a measured dead wait.
# The counters step forward across them (Views 60 -> 61); never backwards.
chop 14_stats_r.mp4 14_stats_cut.mp4 "$CROP_NONE" \
  seg:1.35:3.45 seg:5.55:6.45 seg:9.95:10.60 seg:12.35:14.30 seg:16.30:19.05   # 8.35s

# ── beat 7 · perks · slot 5.95s (timeline 46.01 -> 51.96) ────────────────────────────
# [SCREEN: group chat -> message through top right button, cirle it, load message]
# Two cuts: 1.8s of idle profile, and 1.3s of "Loading topic..." skeleton.
chop 15_perks_r.mp4 15_perks_cut.mp4 "$CROP_NONE" \
  seg:1.80:3.45 seg:3.45:5.45 seg:5.45:6.10 seg:7.40:9.05        # 5.95s (two cuts)

rmdir .chop-tmp 2>/dev/null || true

# ── the four-up fan-out's assets ─────────────────────────────────────────────────────
# f4_insider.mov is VFR: its container says 2.10s but the last decodable frame is at 1.50s, and a
# seek past that yields nothing. It is on screen ~1.8s, so `FeatureFan` freezes it on a last-frame
# still — `OffthreadVideo` renders NOTHING past its own end, it does not hold.
PUB="../../packages/remotion-graphics/public/e005"
mkdir -p "$PUB"
cp -f _source/features/f1_flair.png _source/features/f2_invite.png _source/features/f3_stats.png \
      _source/features/f4_insider.mov "$PUB/"
$NICE $FF -y -ss 1.45 -i _source/features/f4_insider.mov -frames:v 1 -update 1 \
  "$PUB/f4_insider_freeze.png" -loglevel error
[ -s "$PUB/f4_insider_freeze.png" ] || { echo "FATAL: no freeze frame from f4_insider.mov" >&2; exit 1; }

# Components resolve `src` against Remotion's public/ — NOT against media/. Publishing the chops is
# part of chopping them: a manual copy is a step you will forget, and the render will silently use
# the previous cut. (On E004 it did. Twice.)
cp -f screens/*.mp4 "$PUB/"
echo ">>> published $(ls screens/*.mp4 | wc -l) clips + 5 fan assets to $PUB"
echo ">>> CHOPS DONE"
