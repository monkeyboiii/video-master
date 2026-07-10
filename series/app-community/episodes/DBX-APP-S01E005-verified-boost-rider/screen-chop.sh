#!/bin/bash
# Screen-recording chop spec — E005. Pure cuts (no transitions) + freeze-extends.
# Run from inside media/DBX-APP-S01E005/ with FF=<ffmpeg>.
#
# THE INSTRUCTIONS ARE `_source/rough.md`'s [SCREEN: ...] directives. The `.srt` files are
# canonical for the words; rough.md is canonical for what has to be on screen.
#
# NOTHING IS TRIMMED HORIZONTALLY. On E004 the cards cropped 44px off each side and the director
# noticed the app UI had lost its edges. Full native width is preserved. The ONLY crop is vertical,
# because every one of these recordings carries a RED SCREEN-RECORDING PILL in the iOS status bar.
# The aspect therefore changes, and the cards are sized to the NEW aspect — never stretch
# (`objectFit: fill` + a mismatched box silently distorts the UI).
#
# CARDS LIVE TOP-LEFT, AND THE COLUMN IS NARROW. E005 is framed the other way round from E004: he
# sits CENTRE-RIGHT and his head is large, so the blank column is only ~300-430px wide depending on
# the beat, against E004's ~540. Worse, he drifts *within* a beat. Each card was measured over its
# own on-screen window:
#
#   card         family  box (x,y,w,h)      right edge   his left eye at its tightest
#   membership   B       32,120,344,712     376          398   <- the binding window
#   flair        A       32,120,438,887     470          540
#   invite       A       32,120,438,887     470          585
#   stats        A       32,120,438,887     470          540
#   perks        A       32,120,438,887     470          490
#
# The four A-family cards share one box; membership is smaller because that is the one window where
# his face comes far enough left to constrain it. Every card seeps onto his hair — allowed — and
# leaves both eyes and his mouth outside it. Card bottoms (832 / 1007) clear the caption band
# (y1372) with room to spare; the column is width-limited by his face, not by the band.
#
# Every clip:
#   * PLAYS THROUGH. Cutting and freezing are a LAST RESORT: a cut must be a genuine wait, and a
#     freeze only where the source is shorter than its slot.
#   * shows the ENTRY into its surface — a viewer has to see where the portal is.
#   * gets an orange marker (rect, or a circle for a round control) on the element the narration
#     names. `enter: shrink` starts the ring wide and contracts it onto a small control.
#   * plays in CHRONOLOGICAL order. On E004 two passes reordered a recording to chase the narration
#     and both made the app's state visibly regress. Measure before you rearrange.
#
# PRIVACY. Two clips show a real third party — "Shujin Li / @Rereliii", with an avatar photo — who
# is not the founder. Publishing that is not ours to do. Both are redacted HERE, at the source, so
# no un-redacted frame can reach `public/` or an export. @rubio / Zenkai Rubio / @dbx / 登山小鲁 /
# @teamdirtbikex are all the founder's own accounts and stay.
# The invite QR (13_screen-invite, source 3.85-4.95) is his own PUBLIC invite link, captioned
# "Instagram people welcome!" — it is deliberately shareable and stays. See edit-notes DECIDE.
set -e
: "${FF:=ffmpeg}"
: "${THREADS:=1}"
NICE="nice -n 15"
mkdir -p screens .chop-tmp

# Vertical-only crops. Full native width, both families.
#   A: 884x1920 mirrored captures (12,13,14,15). Red pill + status bar occupy y=0..118;
#      the app nav header starts ~y=144.  -> 884x1790, aspect 0.493855
#   B: 1170x2532 iPhone capture (11 only). Red pill + chrome occupy y=0..100; card starts ~y=130.
#                                          -> 1170x2422, aspect 0.483072
CROP_A="crop=884:1790:0:130"
CROP_B="crop=1170:2422:0:110"
POST="scale=700:-2,setsar=1,fps=30,format=yuv420p"

# ── redaction pre-pass ───────────────────────────────────────────────────────────────
# Blur the third party out of the SOURCE. Boxes are in native source pixels, measured on the
# real frames; the `enable` windows cover every frame on which the row is visible, including its
# cross-fade in. A blur, not a black bar: a bar reads as censorship, a blur reads as privacy.
redact() {
  local src=$1 out=$2 box=$3 en=$4
  if [ -f "_source/screens/$out" ]; then echo "    (redacted $out exists)"; return; fi
  IFS=: read -r bx by bw bh <<<"$box"
  echo ">>> redacting $src -> $out   box ${bw}x${bh}+${bx}+${by}  enable=$en"
  $NICE $FF -y -i "_source/screens/$src" \
    -filter_complex "[0:v]split=2[base][fx];\
[fx]crop=${bw}:${bh}:${bx}:${by},boxblur=18:4[b];\
[base][b]overlay=${bx}:${by}:enable='${en}'[v]" \
    -map "[v]" -an -threads "$THREADS" -filter_threads "$THREADS" -filter_complex_threads "$THREADS" \
    -c:v libx264 -crf 16 -preset medium -pix_fmt yuv420p "_source/screens/$out" -loglevel error
}
# 13: the Redeemed tab, from the moment the list starts fading in (source 6.20) to EOF.
redact 13_screen-invite.MP4 13_screen-invite_redacted.mp4 24:406:330:136 "gte(t,6.20)"
# 15: the Chat channel list, which is on screen source 1.85-3.45.
redact 15_screen-perks.MP4  15_screen-perks_redacted.mp4  20:410:320:140 "between(t,1.75,3.55)"

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

# ── beat 2 · membership · slot 3.60s (timeline 15.00 -> 18.60) ───────────────────────
# [SCREEN: open membership]
# Plays straight through, nothing cut but 0.36s of idle head. The whole arc is entry + payoff:
#   0.36-1.25  the @teamdirtbikex profile, settling
#   1.25-1.50  ENTRY: the top-right menu button is tapped, the dropdown opens
#   1.50-2.50  the dropdown, with "Membership" (marker) — the portal
#   2.50-2.90  the Membership sheet slides up
#   2.90-3.96  PAYOFF: verified badge (shrink circle), the plan list, "Become a Member"
# Words: verified 15.06 / boost 15.31 / rider 15.57 -> the profile+menu; layer, 17.83 -> the sheet.
chop 11_screen-membership.MP4 11_membership_cut.mp4 "$CROP_B" \
  seg:0.357:3.957                                                # 3.60s (no cuts, no freeze)

# ── beat 3 · flair · slot 6.10s (timeline 23.70 -> 29.80) ────────────────────────────
# [SCREEN: Custom flair setting with pointing them out boxes, cut out save]
# One cut, and the director asked for it: everything after 4.80 is the SAVE step — a tap, a 4.4s
# greyed-out saving spinner, a redundant return, a toast, and a bounce back to the profile. The
# flair is already set and legible before any of it. What is left (4.80s) is shorter than the slot,
# so the clean payoff frame is held; that is where "custom flair" (27.67/27.90) and "verified"
# (29.56) land, and it is the frame the viewer needs time to read.
#   0.00-1.35  the profile — context
#   1.35       ENTRY: "Edit" tapped (marker), Edit Profile slides in
#   1.45-2.30  Flair still reads "Track Stewards"
#   2.30-3.20  the flair dropdown opens and "Verified Boost Riders" is chosen
#   3.20-4.80  PAYOFF: Flair = Verified Boost Riders + the blue verified badge (shrink circle)
chop 12_screen-flair.MP4 12_flair_cut.mp4 "$CROP_A" \
  seg:0.00:4.80 hold:4.70:1.30                                   # 6.10s (one cut: the save step)

# ── beat 4 · invite · slot 6.65s (timeline 30.10 -> 36.75) ───────────────────────────
# [SCREEN: invite show off]
# One cut, of a 1.2s backtrack: after the QR sheet dismisses, the Pending list — already shown at
# 1.85-3.75 — just sits there until the Redeemed tab is tapped. Nothing else goes.
#   0.00-0.70  the profile
#   0.70-1.85  ENTRY: the nav popover, "Invite" tapped
#   1.85-3.75  the invite tools: link cards, caps, QR/share/delete  (marker, "tools," 32.36)
#   3.75-4.95  the QR sheet rises — his own PUBLIC "Instagram people welcome!" invite (marker)
#   [cut 5.15-6.35: the dismissed sheet leaves an idle Pending list, already seen]
#   6.35-7.85  ENTRY: the "Redeemed" tab, then who actually accepted  (marker, "accepted." 36.49)
chop 13_screen-invite_redacted.mp4 13_invite_cut.mp4 "$CROP_A" \
  seg:0.00:5.15 seg:6.35:7.85                                    # 6.65s (one cut)

# ── beats 5+6 · stats · slot 8.35s (timeline 37.05 -> 45.40) ─────────────────────────
# [SCREEN: sponsorship open -> stats -> previous months -> refresh -> engagement detail]
# The longest source (19.2s) into the longest slot (8.35s), and the ONE card that stays up across a
# hard cut (37.05 -> 45.40 spans the 40.01 boundary between stats-intro and stats-detail). Four
# cuts, every one of them a measured dead wait, and the five states the outline names each land on
# the word that names them:
#   1.35-3.45  ENTRY: the menu, "Sponsorships" (marker) -> the sponsorship surface   "sponsorship" 38.17
#   [cut 3.45-5.55: the stats view loading, cards dimmed, Views stale at 50]
#   5.55-6.45  STATS loaded: Views 60 / Clicks 11 / Pauses 2 (marker)                "stats." 39.64
#   [cut 6.45-9.95: 3.5s of a completely idle stats screen]
#   9.95-10.60 PREVIOUS MONTHS: the < chevron (marker)                               "months," 40.48
#   [cut 10.60-12.35: idle]
#   12.35-14.30 REFRESH: the green circle (shrink circle) + its tooltip              "updates," 41.55
#   [cut 14.30-16.30: the tooltip dwells, then a slow idle scroll]
#   16.30-19.05 ENGAGEMENT DETAIL: By region, and "Who engaged" @dbx (marker)        "engaged" 44.19
# The pass counters step forward across the cuts (Views 60 -> 61); never backwards.
chop 14_screen-stats.MP4 14_stats_cut.mp4 "$CROP_A" \
  seg:1.35:3.45 seg:5.55:6.45 seg:9.95:10.60 seg:12.35:14.30 seg:16.30:19.05   # 8.35s

# ── beat 7 · perks · slot 5.95s (timeline 45.75 -> 51.70) ────────────────────────────
# [SCREEN: group chat -> message through top right button, cirle it, load message]
# Two cuts: 1.8s of idle profile at the head, and 1.3s of "Loading topic..." skeleton.
#   1.80-3.45  the Chat channel list — the "group chat". The top-right button is CIRCLED here, as
#              the director asked (shrink ring).   "special group chat," 47.05-47.56
#   3.45-5.45  ENTRY: that button opens Personal Messages; the "Welcome! Verified Boost Riders" PM
#   5.45-6.10  ENTRY: the PM row is tapped, the thread opens                 "features" 49.58
#   [cut 6.10-7.40: a grey skeleton and a "Loading topic..." spinner. Nothing resolves.]
#   7.40-9.05  PAYOFF: the members-only message, fully readable             "first." 51.10
chop 15_screen-perks_redacted.mp4 15_perks_cut.mp4 "$CROP_A" \
  seg:1.80:3.45 seg:3.45:5.45 seg:5.45:6.10 seg:7.40:9.05        # 5.95s (two cuts)

rmdir .chop-tmp 2>/dev/null || true

# ── the four-up fan-out's assets ─────────────────────────────────────────────────────
# f4_insider.mov is VFR: its container says 2.10s but the last decodable frame is at 1.50s, and a
# seek past that yields nothing (the EOF trap). It is on screen for ~1.8s, so `FeatureFan` freezes
# it on a last-frame still — `OffthreadVideo` renders NOTHING past its own end, it does not hold.
PUB="../../packages/remotion-graphics/public/e005"
mkdir -p "$PUB"
cp -f _source/features/f1_flair.png _source/features/f2_invite.png _source/features/f3_stats.png \
      _source/features/f4_insider.mov "$PUB/"
$NICE $FF -y -ss 1.45 -i _source/features/f4_insider.mov -frames:v 1 -update 1 \
  "$PUB/f4_insider_freeze.png" -loglevel error
[ -s "$PUB/f4_insider_freeze.png" ] || { echo "FATAL: no freeze frame from f4_insider.mov" >&2; exit 1; }

# SideScreen resolves `src` against Remotion's public/ — NOT against media/. Publishing the chops is
# part of chopping them: a manual copy is a step you will forget, and the render will silently use
# the previous cut. (On E004 it did. Twice.)
cp -f screens/*.mp4 "$PUB/"
echo ">>> published $(ls screens/*.mp4 | wc -l) clips + 5 fan assets to $PUB"
echo ">>> CHOPS DONE"
