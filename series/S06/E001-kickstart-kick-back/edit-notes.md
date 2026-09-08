# Edit notes — S06E001

What this repo actually did to the material, in enough detail to reproduce it.

**Nothing is shot and nothing is recorded.** The panels are source art, both scripts are written,
and the voice in both previews is synthesised. Every number below says which kind it is.

## The source art, and which version

Two versions arrived: `media/S06E001/_source/kickback-panels-v2.png` (used) and
`…-v1-rejected.png`. They are near-identical 940×1672 sheets of eight drawings and differ only in
arrow directions. **v1 is wrong and v2 is right, and it is checkable rather than a matter of
taste.** The brief locks the convention — green clockwise is forward rotation, red counter-clockwise
is kickback — so panel 3's green and panel 5's red must turn in OPPOSITE directions. In v1 both arcs
run counter-clockwise: a reversal going the same way as the thing it reverses from. In v2 green runs
clockwise and red counter-clockwise. v1 is kept because knowing which one was rejected, and why, is
worth more than the disk it costs.

## Panels

`panel-chop.sh` cuts the sheet into eight and publishes them into
`packages/remotion-graphics/public/s06e001/`. Publishing is part of chopping: a component's `src`
resolves against Remotion's `public/`, never against `media/`, and a manual copy is a step you
forget — after which the next render silently reuses the previous asset rather than failing.

**The gutters are measured every run, not assumed.** The sheet is not eight equal eighths: its rows
are 372, 412, 411 and 426 px tall. A hardcoded 1/8 would shave the top off two rows and leave a
white band on another, and it would break silently the day the art is redrawn.

This is not the crop scar. `screen-chop.sh` says never to crop a screen recording, because cropping
discards evidence of what was on screen. Here the source IS eight separate drawings printed on one
sheet, the sheet is kept whole under `media/`, and nothing is discarded.

## Narration — and the en-US path had never been run

zh-CN at speed **1.15** (52.75s); en-US at **1.25** (57.91s). Different speeds on purpose: at a
shared 1.15 the English ran 61.1s, past the brief's 50–60s band, and raising the speed keeps the
copy intact instead of cutting it. `localization.md` predicts exactly this gap — zh-CN runs 10–20%
shorter than an en-US page saying the same thing — so one shared speed would have meant one edition
padded or the other rushed.

**Two things blocked en-US entirely, and both are now fixed in the tools rather than worked around
here.** (1) misaki's English G2P needs spaCy's `en_core_web_sm`, which `ensure.sh` never installed;
misaki tries to fetch it itself but shells out to `uv pip install` with no `VIRTUAL_ENV`, and the
failure surfaces at synthesis time as torch warnings and no audio. It is installed by `ensure.sh`
now, pinned by URL because `spacy download` is the command that does not work here. (2)
`episode.py` did not recognise `**Spoken:**`, which is what **seven of the ten** authored en-US
scripts in `series/` actually use — so most of the repo's English could not be narrated at all.
Recognised rather than migrated. That took en-US episodes that load from 3 to 10; the three that
still do not are S01E003/4/5, which are transcripts of recorded talking-head clips with
`voiceover_asset_id: null` and must never be synthesised.

**Timing source: planned, then replaced by measurement.** The beats started as the brief's own
eight-shot plan (3, 6, 8, 6, 11, 5, 7, 9 = 55s) and five of the eight en-US beats came back OVER —
the plan allowed 3s for a beat the voice takes 11s to say. They are now what Kokoro took, plus
0.25s.

## Captions

Read off each voice by `/auto-narrate`; 185 rows en-US, 160 zh-CN. Emphasis is the **bold** in the
scripts, so there is no second list of important words to keep in step: 23 lit en, 20 lit zh.

`zh-words.txt` gained the engine terms — 上止点, 曲柄销, 反向扭矩, 点火正时, 启动杆, 启动齿轮,
混合气, 减压机构, 连杆, 回踢, 踹回 — because a caption unit is a WORD and 上止点 lighting as 上|止|点
is three highlights for one concept.

**`caption_style: band`, declared on the storyboard.** en-US defaults to `plain` — white text, green
only on the spoken word — which the caption spec chose for sitting light over busy FOOTAGE. These
panels are white line art, and plain white text over them all but disappears. The spec keeps `band`
available to en for exactly this.

**Each locale keeps its own caption default** — en `plain`, zh clamped to `band`. An earlier pass
forced en to `band` because white `plain` text vanished on white line art; that was treating the
symptom. The captions now sit BELOW the picture in the bottom blurred band, dimmed to about 45%
brightness, where plain white reads exactly as the caption spec intended.

**One caption block per CLAUSE, not per beat.** This was reported as a Chinese sentence break
reading wrong, and it was neither the synthesiser nor the copy: `silencedetect` finds no pause over
120ms anywhere inside a beat. The caption track splits a too-wide line at the word boundary nearest
the middle BY WIDTH, and the row format carries no punctuation — deliberately, because a comma is a
pause the voice takes and not a word the reader sees. So it cut 压力峰值 into 压力 / 峰值, ended a
line on 这 with 不是发动机 starting the next, and split 本来很正常 and 挂挡不是主因 down the middle.

The clause boundaries are in the script; they were simply thrown away before the splitter saw them.
`episode.segment()` records them and `build-narration` makes them block breaks, so the track is
handed lines short enough that it rarely splits at all — 8 blocks became 39 in zh, max 13 chars.
The en path had the identical fault (36-word blocks crossing full stops) and got the identical fix,
em dash included: 8 blocks became 34.

## Layout

**The panel is `contain`, not `cover`.** The photo-reveal band is 0.94:1 and these panels are
1.24:1, so cover cropped a quarter of the width — on a technical diagram that is arrows, not
margin. `contain` fits the whole drawing and the blurred backdrop carries the rest, which is the
same idiom doing the same job. The panel number in each corner is the tell: it is missing under
cover and present under contain.

**The bands are asymmetric — 0.22 top, 0.30 bottom — because the captions live in the bottom one.**
A caption is bottom-anchored at `safeZoneFor().bottom`, which puts its top around 71% of the frame;
a symmetric 20% band ends at 80% and the line lands on the drawing. 0.30 ends the sharp box at 70%,
above the caption. The safe zone is untouched: the picture moved, not the type.

**`bandDim` is 0.55, not photo-reveal's 0.22**, and that is about this art specifically. A blurred
copy of WHITE line work is light grey, so the default dimming left white type on a near-white
ground — which is why the first pass looked like it needed a caption band. At 0.55 the bands sit
near 45% brightness and both the title and the captions read.

## Storyboard

Eight cuts, one per beat, each naming its published panel. A cut with `src` renders the S01E002
photo-reveal look — sharp middle three fifths, a blurred dimmed copy of itself top and bottom.

**The zoom is 7%, not photo-reveal's own 32%,** and its direction is the storyboard's `camera`
(push in, pull out, static holds) rather than a function of the cut's index. The subject here is a
diagram the viewer is reading, and a large zoom drags the lines around while they are trying to
follow an arrow.

The screen text sits in the **top blurred band**, never over the drawing. That band is what makes
room for type on a picture that is the whole point of the shot.

**Screen text is the one per-locale field in the storyboard.** Everything else there describes a
shot, and a shot is the same in every edition; text is burned into the picture, so it is not. It
takes a `{en-US, zh-CN}` map, both halves from the brief's own screen-text column, and
storyboard-check fails a map missing the locale it is asked for — otherwise it renders as an empty
band with no error.

## QC

Not run — there is no shipping render to measure. Both preview mixes are the narration alone at
**−15.2 LUFS / −1.5 dBTP**, about 1.2 LU under the checklist's −14 and peak-limited: sparse speech
with no bed has a high peak-to-loudness ratio.
