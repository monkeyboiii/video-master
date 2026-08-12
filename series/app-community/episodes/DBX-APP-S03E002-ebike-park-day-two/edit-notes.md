# Edit Notes — DBX-APP-S03E002

Track layout: V1 footage · V2 overlays · V3 spare · A1 voiceover · A2 music/SFX

Footage is not shot yet. This file currently carries the **VO audio** decisions only;
the assembly plan lands after the shoot.

## VO audio — take 2 + rev-2 ending (VO_EN_016 / VO_EN_017)

Reproduce with `./vo-process.sh` (needs `auto-editor` on PATH and `ffmpeg`). One run writes
both masters, their MP3 review copies, and a review mix of each under the bed — all into
`media/**`, out of git.

### What rev 2 changed

Script rev 2 keeps take 2's hook and body **verbatim** and replaces everything from
"Anyway, enough of that." onward. The owner became the **boss**, and he turns the app down:

> …show him my gorgeous app and — *(record scratch)* — Yeah… not quite. He passed on the
> app, but gave me some solid advice: for enduro riders, GPX and live tracking can be a
> lifeline. Guess we're learning… electric warriors, let's go?!

Gone with it: the shiny badge, "Nice. Track two secured.", and the girlfriend punchline.
The count still ticks — the mission is visiting 100 tracks, not signing them.

### Policy: pure splice, now assembled per region

Same rule as v004 — **dead air is cut and nothing else is touched.** What changed is the
mechanics: instead of one auto-editor pass over one take, each region is spliced on its own
with **the identical v004 settings** and the pieces are concatenated.

```
--edit audio:threshold=-34dB --margin 0.06s,0.12s --smooth 0.10s,0.08s
```

That was necessary anyway (three source files, two soundtracks), and it buys explicit
control of the joins and of the record-scratch hole. It costs nothing in pacing: measured at
the auto-editor threshold, the joins are **0.195–0.220s** against internal gaps of the same
size, so a listener cannot tell a join from an ordinary pause.

| | v004 (rev 1) † | **v007 en (current)** | **v007 cn** |
|---|---|---|---|
| Duration | 44.23s | **49.94s** | **49.44s** |
| Median gap | 0.15s † | **0.22s** | **0.22s** |
| p90 gap | 0.19s † | **0.24s** | **0.24s** |
| Max gap (excl. hole) | 0.22s † | **0.29s** | **0.29s** |
| Join after "solid advice" | — | **0.065s** | **0.065s** |
| Scratch hole | — | **1.25s** | **1.25s** |
| Integrated | −30.0 LUFS | **−30.0 LUFS** | **−30.0 LUFS** |
| True peak | −8.7 dBFS | **−8.7 dBFS** | **−8.7 dBFS** |

† The gap rows are measured with a stated detector — **5 ms peak frames at the −34 dB
threshold, counting runs ≥0.10s** (anything shorter is an intra-word closure, not a pause).
The v004 column predates it and is **not comparable**; the numbers there are lower because
that detector counted short closures as gaps. Under the current detector v006 measured
median 0.220 / p90 0.245 / max 0.285 — i.e. **the pacing did not move in v007**, which is by
construction: only the two edges either side of the "solid advice" join were trimmed and
every other edge kept its house margin.

Verified untouched rather than asserted — octave-band balance against the raw takes,
gated to speech frames only:

| region | vs raw | mean | tilt across 125 Hz–8 kHz |
|---|---|---|---|
| hook | take 2 | +0.04 dB | 0.19 dB |
| body | take 2 | −0.01 dB | 0.22 dB |
| ending | rev-2 ending | +0.92 dB | 0.45 dB |
| cn hook | rev-2 cn hook | −0.30 dB | 0.16 dB |

Flat means no EQ. The ending's +0.92 and the hook's −0.30 are the match gains below (applied
+0.80 / −0.30; the measured excess is frame selection, not shaping), and they are flat.

### Regions

Absolute seconds into each raw take, cut a little wide — auto-editor trims the edges to
`--margin`. Editing one never shifts another. **Re-derive these if a take is re-recorded.**

| piece | source | in | out | content |
|---|---|---|---|---|
| enhook | take 2 | 0.60 | 7.90 | Day two… / …back in my hometown. |
| body | take 2 | 9.40 | 50.30 | I used to ride… → Oh man, the flashbacks! |
| enda | rev-2 ending | 0.30 | 5.15 | Anyways, enough of that. → …my gorgeous app and |
| endb1 | rev-2 ending | 6.15 | 13.85 | Yeah, not quite. → …gave me some solid advice |
| endb2 | rev-2 ending | 15.00 | 23.60 | — for enduro riders… → …electric warriors, let's go?! |
| cnhook | rev-2 cn hook | 1.10 | 6.60 | 走遍100个越野摩托车场的第二集，搿趟…回屋里厢！ |

The splice point is the line boundary after "Oh man, the flashbacks!" — take 2 runs on to
its own "Anyways, enough of that." at 52.23s, and that read is **dropped**; the rev-2 take
re-delivers the line, so the seam falls between two lines rather than inside a thought.

Both ends of every region were checked against the raw take at 5 ms resolution before
cutting: `endb1` starts at 6.15 because the real "Yeah" onset is 6.26 and there is a 30 ms
blip at 6.05 that a threshold detector would call speech — the same failure mode that put
0.56s of breath in front of a line on E001.

### The pause after "…some solid advice"

That pause survived at **0.47s** in v005 while everything around it sat at 0.20s, and the
cause was a **5 ms mouth click at 14.835 in the raw take, peaking −33.6 dB** — 0.4 dB over
the −34 dB threshold. auto-editor kept it as "speech", which split one pause into
0.18s + click + 0.23s and left both halves at full margin. Everything else in that window is
genuine room tone at −50 to −54 dB.

Fixed by splitting `endb` into `endb1` / `endb2` around it, which drops the click and leaves
a single pause. **The same click would have been kept at any threshold that still
clears the room tone** — raising the threshold is not the fix, excluding the blip is. Third
instance of this failure mode on S03; check line ends and starts at 5 ms before writing a
range.

### Closing that join (v007)

Dropping the click left the pause at **0.245s**, and that is still wrong: the line is one
sentence — "…gave me some solid advice: for enduro riders, GPX and live tracking can be a
lifeline" — so a pause there reads as a **sentence beat landing mid-sentence**. Measured
against this take's own habits, sentence beats run 0.21–0.30s and ordinary word boundaries
inside a phrase run 0.03–0.105s. The join was sitting in the first band and belongs in the
second.

It is now **0.065s** (`JOIN_TAIL` 0.060 + `JOIN_HEAD` 0.040, measured at the −34 dB
threshold, which the 5 ms peak detector then reads as 0.065 across the concatenation).

Two things this is **not**:

- **Not a tighter `--margin` on those regions.** That was tried first and is wrong:
  `--margin` applies to *every* silence run auto-editor kept, not just the edge you are
  aiming at. Re-splicing endb1/endb2 at `0.02s` closed the join, but it also pulled the
  ending's own sentence beats from 0.21/0.23/0.23 down to 0.11/0.13/0.13 and cost 0.67s
  overall — it re-paced two whole regions to fix one seam. The fix is `tighten()`, which
  trims **only the named outer edge** after the splice and leaves house margins intact.
- **Not a butt splice.** Trimming to the threshold exactly (`0.005s`) clips speech: the
  tail of "advice" is still at **−30 dB** where a hard cut would land — that is the /s/
  mid-decay — and "for" gets chopped at its onset, going −41 → −20 dB in 10 ms. Both
  fricatives decay below −34 dB long before they are actually over, so the threshold is not
  the end of the word. 0.060/0.040 keeps them whole.

Verified afterwards: median and p90 gap are **identical to v006** and the piece has exactly
one gap fewer. Nothing else moved.

### The record scratch

The rev-2 take leaves **1.21s** between "…my gorgeous app and" and "Yeah… not quite.",
which is the gag: the scratch goes in that hole. The master reproduces it at **1.25s**
(`SCRATCH_GAP=1.20` plus the pieces' own margins), so the delivered timing survives the
splice instead of being flattened to 0.20s like every other pause.

**The SFX is not in the VO master.** A1 stays clean; `SFX_001` belongs on A2, at **38.01s**
on VO_EN_016 and **37.51s** on VO_EN_017 — the top of the hole, 0.02s after the voice's last
above-threshold sample.

It *is* in the review mix, so the timing can be judged, and three things are done to it
there. None of them touch the VO.

- **Trimmed to its own onset** (`SFX_TRIM=0.180`). The file carries lead silence before the
  hit, which is at **0.183**, so the offsets above are where the *sound* starts, not where
  the file does.
- **A 0.06s quadratic fade in** (`SFX_FADE_IN`, `SFX_FADE_CURVE=qua`). The raw file goes
  from −57 dB to −0.8 dB inside 12 ms; that edge is what reads as a glitch rather than a
  scratch.
  **The fade must be anchored to the onset, not to the trim point** — that was the v006 bug.
  Trimming at 0.170 left 13 ms of silence inside a 0.05s linear ramp, so 26% of the ramp was
  spent before the sound existed: it started at −16 dB and hit full 37 ms later, which is
  still a jump. Trimming at 0.180 puts the whole ramp on audible material, and the quadratic
  curve makes the start faint rather than merely quieter. Measured attack, dB under the
  sting's own sustained level:

  | | 5 ms | 10 | 15 | 20 | 30 | 40 | 50 | 60 |
  |---|---|---|---|---|---|---|---|---|
  | v006 linear @ 0.170 | — | — | −16 | −14 | −10 | −4 | −2 | −2 |
  | **v007 qua @ 0.180** | **−39** | **−32** | **−24** | **−22** | **−13** | **−8** | **−5** | **−2** |

  60 ms is still short enough to read as an attack — the sting's character is the 1.5s
  pitch-bend behind it, not the first frame.
- **Peak-matched to 14 dB under the voice's true peak** (`SFX_BELOW_VO_PEAK`). The raw file
  is a clipped sting, +2.8 dBFS true peak — ~11 dB hotter than this voice. It has now been
  turned down three times (3 → 9 → 14 dB) and at 14 it peaks **−20.8 dBFS**, which is
  **7.1 dB under** "…my gorgeous app and" in front of it (−13.7) and **11.0 dB under**
  "Yeah… not quite." after (−9.8). Present and clearly an interruption, but no longer
  competing with the voice. This is the one knob to move if it now reads as too polite.

### Joining takes

The rev-2 session was recorded quieter than take 2, so its pieces get a **linear match
gain** — ending **+0.80 dB**, Chinese hook **−0.30 dB** — computed in the script from
measured loudness, not typed in. Both are plain gains: no dynamics, no tone change.

The ending's gain moved 0.10 dB from v006 (it was +0.90) because closing the join changed
how much silence the loudness measurement sees. Confirmed to be exactly that and nothing
else: octave-band delta v007 − v006 across the ending is **−0.10 dB in all seven bands,
0.00 dB tilt**.

Verified across the seam: the last 1.2s of the body reads **−29.3 dB** speech-RMS against
the ending's first 1.2s at **−29.5 dB**. A 0.2 dB step is inaudible.

This is the same exception E001 documents. Two takes at different levels cannot be
concatenated without it; everything else stays hands-off.

### Two long pauses were flattened, on purpose

The rev-2 take leaves **2.23s** after "not quite." and **1.82s** before "Guess we're
learning…". Both are cut to the 0.20s house pacing, because that is the sound v004
established and the reaction they are waiting for is **visual** — it belongs to the shoot,
not the VO. If the edit wants that room back, split the line into its own piece in
`vo-process.sh` rather than widening the threshold; the scratch hole is the worked example.

Note the difference from the "…solid advice" fix above: that pause was **not** a deliberate
beat, it was a click defeating the threshold. This pair is deliberate and stays cut.

### Level

None applied beyond the two match gains. The master sits at take 2's own −30.0 LUFS /
−8.7 dBFS. Loudness is a **video-mix decision**, not a VO-asset one, and
TikTok/Reels/Shorts all normalise quiet uploads upward anyway.

### Superseded

v001–v003 (take 1, full processing chains) and **v004** (rev-1 take 2) are deleted. They
served a script that no longer exists and `vo-process.sh` can no longer rebuild them; the
old script is in git history if a rev-1 cut is ever needed. **v005** was the first rev-2 cut
and is deleted too — it is v006 with the "solid advice" click still in and the scratch 6 dB
hot and un-faded. **v006** is superseded by v007 — same cut, but with the scratch 5 dB hot on
a ramp that was 26% spent before the sound started, and the "solid advice" join still holding
a 0.245s sentence beat mid-sentence. It is **kept on disk only until v007 is signed off**, so
the two can be A/B'd; delete it then. Two older attempts stay on record so they are not
retried:

- **v002 tried to fix the room** with EQ + fast-gate + compression. It measured 7.6 dB drier
  and sounded wrong — gating a room out makes the voice switch between two acoustics, which
  reads as artificial. **If the room is a problem, fix it at the mic, not in post.**
- **v003 kept a 1.05x tempo and a normalising gain.** Both are gone under the pure-splice
  policy.

### Music bed

`MUS_001`, flat, **no ducking** — the one thing the script does set. It is placed
**`MUSIC_BELOW_VO` dB under the measured voice loudness** (currently 10) rather than at a
fixed volume, so the balance survives any change of take or level. 0.5s fade in, 1.5s out;
`amix=normalize=0` (the default would halve all inputs).

In the timeline this stays a separate A2 clip — the A1 master is clean and unmixed.

### DECIDE (human)

- **MUS_001 is not licensed**, and **SFX_001's licence is unknown.** Both are fine for
  judging the cut, neither is fine for publishing. Same status as the beds on S03E000/E001.
- **The delivered body no longer matches the written lines word for word** — "all the bikes
  **have** big batteries", "**so** I'd be kicking myself", "look what **we got** here",
  "**Oh man, the flashbacks!**" (order reversed), "**Anyways**". Take 2 was not re-recorded
  and these are not worth a re-record; subtitles follow the delivery. Confirm each by ear at
  the subtitle pass — they come from a base-model transcript, not from listening.
- **Packaging is now half-stale.** `cover.en-US.md` was written when the episode ended on a
  secured track. The captions still hold (the count is visits), but the rejection is a
  stronger hook than anything on that page and the title list should be reconsidered at the
  packaging pass.
- Beat durations in `manifest.yml` are measured off VO_EN_016 but stay provisional until the
  subtitle pass.

## Subtitle notes

The bodies are identical; the hooks are not, so every body cue sits **0.50s earlier** on the
Chinese cut (hook 4.29s vs 4.79s). Time each against its own master (VO_EN_016 / VO_EN_017),
never against a raw take.

### zh-CN cut — burned-in bilingual captions

Built, and this episode is the worked example for the house standard — method, style
constants and traps now live in `skills/07-subtitles-localization.md`. Everything is driven
by `subtitles.yml` in this directory:

```bash
tools/retime-subtitles.py <this dir>            # touched.srt -> retimed.srt
tools/burn-subtitles.py   <this dir> --render   # -> .ass + the export
```

Cues **1–2 are Chinese only** and that is correct, not an omission: they are the recorded
Chinese hook, so there is nothing to translate under them. Cues 3–24 carry the English body
VO, so the Chinese translation leads and the English sits beneath it, smaller.

### Retiming — the touched SRT drifted against the delivery

Caught on review at "so I'd be kicking myself": the line was **1.6s into the ear before its
subtitle appeared**. It was not an isolated slip — eight cues were out.

**Method — and the one that does not work.** Detecting pauses in the cn-2 audio (≥0.10s
below −44 dB) and snapping each cue to the nearest phrase start is the obvious approach and
it is **not trustworthy on its own**. It was wrong twice here, both times confidently: it
put "Oh man" a **second early**, because the pause it snapped to sat *inside* the previous
sentence ("…don't have to push a bike | up the stairs like I did"), and it cut cue 15 off
0.9s before its line finished. A pause is not the same thing as a line boundary.

What is authoritative is **the en-US cut's own burned-in captions**, read frame by frame.
That cut leads cn-2 by **exactly 0.50s** — measured, not assumed, by cross-correlating the
two envelopes over 15–25s (best lag 0.50s, r=0.891) — so its word timings transfer directly.
Use pause detection only to find *candidates*, then confirm every one against the en-US cut.

| cue | was | now | error |
|---|---|---|---|
| 5 | 9.520–11.200 | 9.520–**10.480** | end ran 0.72s past; "But" confirmed at 9.45 |
| 6 | 11.200–13.120 | **10.740–12.960** | 0.46s late; "and" confirmed at 10.65 |
| 7 | 13.760–14.240 | **13.240–14.060** | "Fantastic!" 0.52s late |
| 9 | 16.240–19.720 | 16.220–**17.960** | end ran **1.76s** into the next line |
| 10 | 19.787–21.813 | **18.180–21.650** | started **1.61s** late |
| 11 | 21.880–23.467 | **21.700–23.650** | "All" starts 21.70 |
| 12 | 23.933–27.160 | **23.700**–27.160 | "This" starts 23.70 |
| 15 | 30.300–31.600 | 30.300–**31.850** | "…like I did" runs to 31.85 |
| 16 | 32.040–33.280 | **32.150**–33.260 | "Oh man" starts 32.15 |

**Cue 7 is the one exception** and is audio-derived: the en-US cut gives "Fantastic!" a top
callout rather than a bottom caption, so there is nothing to read there. Its phrase
(13.24–14.06) is bounded by cue 6's last word and cue 8's first, which pins it well enough.

**Cue 24 is split.** "Guess we're learning." and "Electric warriors, let's go?!" are two
beats with a real gap between them, and the en-US cut captions them separately —
46.60–47.45 and 47.50–49.36. The file now carries **25 cues**; `HIGHLIGHTS` in
`highlights:` in `subtitles.yml` is keyed by cue number, so it was renumbered to match.

**Cue 10's English also did not match the delivery** and now does: "so I'd be kicking myself
**in the butt** if my app **completely** missed out on them." That follows the standing rule
in DECIDE above — *subtitles follow the delivery* — and the two missing beats are exactly
what made the line feel out of sync even once the timing was right. The Chinese needed no
change; 我得后悔死 already carries it.

**Not every flagged cue was wrong.** A naive "every cue should start at a pause" check also
fires on 14, 19, 23 and 24 — those are **mid-sentence continuations** (13→14→15 are one
sentence, as are 18→19 and 22→23), so there is no pause at their start by design. They were
left alone. Any future pass should apply the same filter before trusting the flags.

**Style is measured off the already-graded en-US cut, not guessed:**

| | value | how it was established |
|---|---|---|
| Latin font | Bricolage Grotesque ExtraBold | matched against the reference glyphs; the repo already pins this family |
| CJK font | Noto Sans CJK SC Bold | the repo's CJK display face |
| Size | 96 (zh) / 72 (en) | reference latin line measured 868 px wide, 77 px tall |
| Outline | 4 px black, no shadow | dark runs either side of a stem measured 3–4 px |
| Highlight | `#F3E774` | sampled from the interior of a yellow word |
| Block centre | y=**1770** on 1440×2560 | reference centres at 1926; lifted 156 px — see below |
| Column | 1180 px (130 px margins) | reference lines wrap by ~1040–1140 px |

**Two deliberate departures from the reference**, both decided after seeing it on the cut:

- **The line appears whole, not word by word.** The en-US cut streams words in. Chinese
  carries more meaning per character, so a reader who is given it a word at a time is held
  behind the information rather than led through it. Both lines now land complete on the cue.
- **Yellow is semantic, not positional.** In the reference the yellow simply tracks the word
  being spoken. Here it marks the words that hold the point — the number in "走遍**100**个",
  "**大电池**", "**GPX** 和**实时定位**" — and the same idea is highlighted in both languages.
  The choices live under `highlights:` in `subtitles.yml`, keyed by cue number.
  **Edit that, not the tool**; an entry that matches nothing warns instead of silently
  dropping the emphasis.

Render (the CPU cap keeps this box's staging stack responsive — it has 2 cores):

```bash
systemd-run --user --scope -q -p CPUQuota=180% \
  ffmpeg -i footage/S03E002-cn-2.MP4 \
    -vf "subtitles=cap.ass:fontsdir=<dir with Bricolage>,scale=in_range=full:out_range=full" \
    -c:v libx264 -preset veryfast -crf 20 -threads 2 \
    -pix_fmt yuv420p -color_range pc -colorspace bt709 -c:a copy ...
```

**The block is lifted 156 px off the reference position**, and the cut it is burned into is
`footage/S03E002-cn-2.MP4` (not `-cn`). That grade carries a **burned-in location pin**
(柳浪闻莺) at **y1862–1966**, which lands exactly where the reference centres its captions.
The pin is only up for the first ~1.2s — cue 1 — but the block is lifted uniformly rather
than for that cue alone, because captions that jump position mid-video read as a mistake.
At `BLOCK_MID=1770` cue 1's ink sits at y1740–1806, clearing the pin by **56 px**.
Re-check this if the grade changes: the pin is part of the footage, not of this pass.

Two gotchas worth keeping:

- **The footage is full-range** (`yuvj420p`, `color_range=pc`) and the range has to be
  carried through the filter chain, not merely declared on the output. `-pix_fmt yuv420p
  -color_range pc` **is not enough, and is worse than passing nothing**: the scaler quietly
  squeezes 0–255 into 16–235 while the flag still claims full range, so the whole video
  loses contrast and a player has no way to know. Measured here as 4.4 levels of mean
  brightness — `143.3 × 219/255 + 16 = 139.1` predicted, 138.9 observed. Either
  `scale=in_range=full:out_range=full` (above) or `-pix_fmt yuvj420p` reproduces the source
  exactly; both measured 143.3/145.9/141.4 against the source's 143.3/145.9/141.4.
  **Re-check a subtitle-free region against the source after any change to this command.**
- **Bricolage is a variable font.** libass renders the default (light) instance unless the
  style asks for bold, so the ASS style carries `Bold=1` against a *static* ExtraBold
  instance. Pointing it at the variable file silently gives a much lighter caption.

## Retention checklist

Fill after assembly, before any review export.
