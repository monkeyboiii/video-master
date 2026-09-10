---
kind: why
status: current
summary: Captions for a cut that came back from outside: whisper.cpp transcription, the burned-in standard, and retiming against a re-cut.
---

# Captions (字幕)

## Purpose

Produce per-locale subtitle files that **highlight and reinforce** the voiceover (never
merely transcribe it), and audit variant pairs for localization quality.

## Inputs

- `script.<locale>.md` (with emphasis words marked by the script pass)
- Voiceover timing: the VO file recorded in the manifest
  (`variants.<locale>.voiceover_asset_id`), or beat `target_duration_sec` as a first
  approximation before VO exists
- `agents.d/modules/localization.md`, `agents.d/modules/platforms.md` (safe zones)
  safe zones

## Outputs

- `subtitles/<locale>.srt` — timed, emphasis-aware subtitle text
- **Word-timed caption map** — per-beat `remotion-props/captions.<beat>.json` derived from
  the SRT: each word `{t, s, e?}` (text, start-seconds-into-clip, emphasis `brand`|`harsh`),
  by distributing words across each cue and tagging emphasis from the script (worked-example
  generator: the episode's `caption-map.mjs`). This is the
  pre-edit sync artifact the editing agent works off — captions, SFX hits, zoom, and
  overlay in/out points all key to it (the cut is made outside this repo). **Line up the
  subtitles with the timeline before editing starts; editing before it's locked is guessing.**
- **Burned-in captions** — `<episode-dir>/subtitles.yml` plus the export it produces.
  This is the standard; see **Burned-in captions** below. The Remotion `subtitle-track`
  and `kinetic-captions` overlays that used to do this are **deprecated**.
- Localization audit notes appended to `edit-notes.md` when auditing a variant pair

## Steps

1. Derive subtitle lines from the script beat by beat. Compress: drop connective tissue,
   keep verbs, numbers, and conclusions. A subtitle line is a highlight, not a
   transcript.
2. Respect density limits: zh-CN ≤ ~15 characters/line, en-US ≤ ~38 characters/line,
   max 2 lines visible, minimum on-screen time ~1s, no line straddling a beat boundary.
3. Time against the VO when it exists (probe duration via
   `node tools/probe-media.mjs`); otherwise distribute within the beat's
   `target_duration_sec` and record `timing source: provisional (no VO yet)` under
   `## Subtitle notes` in `edit-notes.md` — never put comment lines inside the `.srt`
   itself (they break SRT parsing). If `edit-notes.md` doesn't exist yet, copy it from
   the `edit-notes.md` that `vm new` scaffolds.
4. Keep emphasis words (from the script) in the line even when compressing around them.
5. Write valid SRT: sequential indices, `HH:MM:SS,mmm` times, no overlaps, UTF-8.
6. **Localization audit** (once both locales' subtitle files exist — scripts alone
   don't trigger it): check the variant pair against the review bar in
   `agents.d/modules/localization.md` — shared beats/message/CTA, native phrasing, local examples.
   Record pass/fail per criterion in `edit-notes.md`.
7. If a beat's script content is a `HUMAN: verify/replace` placeholder, subtitle it
   provisionally and flag it next to the timing note — it re-times when the real
   content lands.
8. Run `node tools/validate.mjs` (it checks SRT syntax and manifest wiring).

## Burned-in captions (the standard)

Captions are burned in with libass, driven by one config per episode. **This replaces the
Remotion caption overlays** (`subtitle-track`, `kinetic-captions`), which are deprecated:
they cost a multi-minute ProRes render per change, and the alpha overlay still had to be
composited. This path re-renders in ~3 minutes on two cores and every knob is measurable.

```bash
tools/retime-subtitles.py <episode-dir>          # touched.srt -> retimed.srt (optional)
tools/burn-subtitles.py   <episode-dir>          # -> .ass
tools/burn-subtitles.py   <episode-dir> --render # -> .ass + the export
```

Both read `<episode-dir>/subtitles.yml`. Worked example: `DBX-APP-S03E002`.

### Layout

Primary language on top, secondary beneath it at a smaller size, **the whole line landing
at once** when the cue starts. Emphasis is **semantic** — the words carrying the point go
yellow, named per cue under `highlights`, the same idea marked in both languages.

Two rules that came out of building it, both worth keeping:

- **Do not stream the line in word by word.** It was tried, and reverted on sight of the
  cut. Chinese packs more meaning per character than English, so revealing a word at a
  time holds the reader behind the information instead of leading them through it.
- **Yellow marks meaning, not position.** Tracking the spoken word with the highlight
  looks impressive and says nothing; marking the number, the product, the payoff word is
  what a reader actually uses.

### House style, and where the numbers came from

Defaults live in `tools/burn-subtitles.py`. They were measured off an already-graded cut,
not chosen — if you restyle, measure the same way rather than eyeballing.

| | value | derivation |
|---|---|---|
| latin face | Bricolage Grotesque ExtraBold | matched against reference glyphs; already the repo's display face |
| CJK face | Noto Sans CJK SC Bold | the repo's CJK display face |
| size | 96 primary / 72 secondary | reference line measured 868 px wide, 77 px tall |
| outline | 4 px black, no shadow | dark runs either side of a stem measured 3–4 px |
| highlight | `#F3E774` | sampled from the interior of a yellow word |
| block centre | y=1926 of 2560 | 1- and 2-line reference cues both centre there |
| column | 1180 px (130 px margins) | reference lines wrap by ~1040–1140 px |

Override per episode only what the footage forces — usually `block_mid`, to clear graphics
already burned into the grade. **Lift uniformly, not just for the colliding cue**: captions
that change position mid-video read as a mistake.

### Three things that will bite

- **Full-range footage.** Phone grades are `yuvj420p` / `color_range=pc`. Passing
  `-pix_fmt yuv420p -color_range pc` is *worse than passing nothing*: the scaler squeezes
  0–255 into 16–235 while the flag still claims full range, so the whole video quietly
  loses contrast. The tool carries range through with `scale=in_range=full:out_range=full`.
  **After any change to the encode, compare mean RGB of a subtitle-free region against the
  source** — it should match to the digit.
- **Bricolage is a variable font.** libass renders its default (light) instance unless the
  style asks for bold, so the ASS style sets `Bold=1` against a *static* ExtraBold cut in
  `media/_fonts/` (gitignored — the fetch command is in the tool's docstring). Point it at
  the variable file and captions come out silently too thin.
- **Previewing a frame needs `-copyts`.** `ffmpeg -ss T -i src -vf subtitles=...` resets
  timestamps, so the filter sees t≈0 and draws the wrong cue (or none). Without it you
  will "confirm" a timing that was never tested.

### Retiming against the delivery

When a hand-touched SRT drifts, correct it in `retime:` — never edit the touched file,
which stays the reference. Corrections are a reviewable list with a `why` per entry.

**Getting the numbers right matters more than the mechanism.** Snapping cues to pauses in
the audio is the obvious method and is **not reliable on its own**: a pause is not a line
boundary. On S03E002 it placed a line a full second early because the pause it chose sat
inside the previous sentence, and truncated another 0.9s before its line finished.

When a correctly-captioned cut of the same edit exists in another language, that cut is
the authority: read its burned-in captions frame by frame and offset them. **Measure the
offset** — cross-correlate the two audio envelopes — rather than assuming it from the
duration difference. Use pause detection to find *candidates*, then confirm every one.

Note also that a naive "every cue should start at a pause" check fires on **mid-sentence
continuations**, which have no pause at their start by design. Filter those out before
trusting it, or you will "fix" cues that were already right.

If the delivery diverges from the written line, **the subtitle follows the delivery**
. A line that is missing spoken words reads as out of sync even
when its timing is correct.

## Rules

- The division of labor is fixed:
  **voiceover explains, subtitles highlight, visuals reinforce.** Subtitles compress
  each passage into its keywords — if a line adds nothing over the audio, compress or
  drop it.
- Never generate one locale's SRT by translating the other's — work from that locale's
  script.
- Subtitle position must respect vertical-video safe zones (`agents.d/modules/platforms.md`):
  keep clear of the bottom caption zone and right action rail.
- Numbers, prices, units are localized (mph vs km/h stays as the locale's script chose).

## Done criteria

- SRT parses, no overlaps, density limits respected, emphasis words preserved.
- Timing source (VO vs provisional) recorded in `edit-notes.md`.
- Manifest `variants.<locale>.subtitles` points at the file;
  `node tools/validate.mjs` passes.
- (Audit) localization review bar results recorded.
- (Burned-in) the build is reproducible from `subtitles.yml` alone — no hand-edited `.ass`,
  no hand-edited export; every highlight resolves without a warning; the export is listed
  under `outputs.exports.<locale>`; colour matches the source in a subtitle-free region.

## Backlog

**S01/S02 kinetic-caption overlays predate this standard** and should be redone through it
when their episodes next come up. They are the deprecated Remotion path
(`media/DBX-APP-S01E00*/overlays/*kinetic-captions*.mov`); nothing about them is wrong on
screen, they are just built with a pipeline no longer maintained.

## Transcription: which model, and why per-character is the right target for zh-CN

`tools/transcribe.mjs` runs whisper.cpp locally via `@remotion/install-whisper-cpp` and writes the
`Caption[]` that `@remotion/captions` consumes. Two decisions are baked in.

### The model is `large-v3`, and never a `.en` one

The `.en` models are English-only, and this repo ships zh-CN as a sibling variant, not a
translation. Of the multilingual set — `tiny`, `base`, `small`, `medium`, `large-v1`, `large-v2`,
`large-v3`, `large-v3-turbo` — **Chinese accuracy tracks model size far more steeply than English
does**: `medium` is the floor, `large-v3` is the target. `--model` overrides for a quick pass.

**Not done:** `large-v3-turbo` is not the default. It is faster for a small quality cost, but it
postdates the pinned whisper.cpp 1.5.5 in `tools/transcribe.mjs`, so DTW alignment heads for it
are **UNVERIFIED on that version — bump `WHISPER_VERSION` and confirm before switching.**

### `tokenLevelTimestamps: true` is not optional, and for zh it means per character

It passes `--dtw` to whisper.cpp: timestamps come from Dynamic Time Warping against the audio and
are returned as `t_dtw`, instead of the decoder's heuristic guess. **That is the accuracy WhisperX
is usually reached for** — and it is worth being precise, because "whisperx.cpp" is not a thing:
WhisperX is a separate Python project that bolts wav2vec2 forced alignment onto Whisper, and its
Chinese alignment is weaker than its English. whisper.cpp does the alignment natively here.

For zh-CN this lands **per character**, and that is the right target rather than a compromise:
Chinese has no spaces, so "per word" is not something the audio gives you. Whisper's Chinese
tokens are one or two characters, which is the granularity Chinese karaoke captions highlight at
anyway. `splitOnWord` is for space-delimited languages — leave it off for zh.

Set `--lang=zh` or `--lang=en` explicitly. On a short clip, auto-detection flips zh to ja or yue
and the whole take comes back in the wrong script.

### The script is known, so ASR output is a draft

This repo is handed the written script. Transcribing text you already have is strictly worse than
reconciling against it: keep whisper's **timings**, take the script's **characters**. Homophone
substitutions are the common failure and are invisible until someone reads the burn-in.

**Not done:** no text-conditioned forced aligner is wired in. whisper.cpp cannot align to supplied
text, and the Chinese aligners that can (MFA, WhisperX's zh model) are a separate toolchain. The
threshold: reconciliation by hand stops being cheap.

## The spoken-caption band, and why the two locales stream differently

`packages/remotion-graphics/src/components/SpokenSubtitle.tsx` renders one sentence following the
voice; `SpokenSubtitleTrack.tsx` cuts between sentences. Both take the `Caption[]` shape
`tools/transcribe.mjs` writes.

### zh-CN shows the whole line and lights words across it; en-US reveals word by word

Not a style preference, and the two must not be unified.

**zh-CN — karaoke.** The whole line is on screen from its first frame and a highlight streams
across it. Chinese is read by recognising whole characters at a glance, so a reader takes the line
in faster than it is spoken; showing all of it costs nothing and lets them read ahead, while the
highlight keeps them anchored to the voice.

**en-US — streaming.** A word is not rendered until spoken, so the line grows. Latin script is read
at roughly speaking pace, so a fully revealed line invites the eye to run to the end and wait — the
pause that makes short-form captions feel slow.

**Not done:** no single mode with a reveal flag. `locale` decides it, because a flag invites setting
it wrong.

### The zh unit is a WORD, never a character — and the script is what defines it

`核心` is one word and lights as one. whisper.cpp emits zh timings per **character**, so the
transcription alone cannot say where words end.

`tools/group-words.mjs` resolves it without a segmenter: this repo is handed the script, and the
script has the boundaries a segmenter would try to infer, written by whoever chose them. It aligns
the script's characters against the transcription's and takes each word's span from the first and
last character it covers. Text comes from the script, timings from the transcription — each used
for the half it is good at, which is the same division § The script is known, so ASR output is a
draft already argues for.

**It ALIGNS rather than walks, and the difference is the whole tool.** The transcription is always
shorter than the script — whisper.cpp loses multi-byte characters to byte-split tokens before any
of this runs, 36 of 131 on S05E002, leaving 118 stream characters for a 151-character script. The
original form consumed one stream position per script character and tolerated three hops of
mismatch; with 33 characters simply absent, every loss burned a position a later character needed,
the error compounded, and the tail of the script fell off the end. Five of nineteen sentences came
back with `startMs = endMs = 0` — not approximate timings, no timings, and the warning it printed
said "the script and the take have diverged" when they had not.

The fix is a longest common subsequence between the two character streams. The positions both
agree on, in order, are anchors; a script character with no anchor is interpolated between the
anchors either side of it rather than guessed at. Monotonic by construction, so a line can never
run backwards. On the same input: 115 of 151 characters anchored, 36 interpolated — exactly the
36 whisper dropped — and no sentence without a span. **Read the anchored ratio, not the absence of
a warning:** ~20-30% interpolated is normal for zh; much higher means the script and the take
really have diverged, and it is the TEXT to check, not the timings.

The component does not segment at all. It highlights exactly the rows it is given, so the unit is
whatever upstream decided.

**Not done:** no jieba or other Chinese segmenter. It would be a dependency and a second source of
truth that disagrees with the script. **The threshold:** captions wanted for a take that has no
script.

### Only the band lights — in both locales. Text lights only for an important word

Both locales hold **one text colour throughout**: unspoken, spoken and past words are identical,
and the band alone carries the state. The first version lit en text as well, on the argument that
Latin words survive recolouring and a streaming line needs its newest word findable. Watching it
run, that argument was wrong on the second half — the band already says where the voice is, and a
line whose every glyph recolours in turn flickers without adding a cue.

So lit text was demoted from a per-word state to a per-word **decision**. A row marked `*` lights
its text, in `lit`, while it is spoken. Two or three to a sentence: the ones the sentence is
actually about. That is what makes lit text mean something when it appears, rather than meaning
"this word is next".

`litSoft` and `textSpent` fall out of the palette with this — they were the two shades of a
per-word text state, which is the thing being removed. They stay in `tokens.ts` marked unused, so
that reaching for one reads as re-proposing the rule rather than as picking a colour.

**Not done:** no `litText` override. The old flag let a composition put the rule back per render,
which is how the en compositions ended up lighting text nobody had decided to light.

### The highlight is striped, not flat, and rises behind the character

Both states carry the same 45° slanted pattern: the lit block is fluorescent under its own darker
stripes, the unlit rule near-black under grey ones. A flat highlight beside a striped band reads as
two unrelated objects instead of one rule lighting up. The lit block is also much taller and sits
**behind** the glyph — which is why it is `zIndex: -1`; painted in source order it covered the
character it was marking.

Palette supplied by the operator; roles assigned in `theme/tokens.ts` § `spoken`:

| | |
|---|---|
| `#CFEF17` lit | the spoken word's block |
| `#708118` litHatch | its stripes |
| `#231F28` band | the unlit rule |
| `#3F4560` hatch | its stripes |
| `#162840` stroke | the text outline |
| `#CEE7F3` text | all caption text, in both locales |
| `#CFEF17` lit | *also* the text of a word marked `*`, while spoken |
| `#D3EE94` litSoft, `#92B7E1` textSpent | unused — see above |

### One line at one size — and the cut is what absorbs a long sentence

The type never wraps and, as of this pass, never resizes either. `fitText` used to shrink each
sentence to the safe zone; the result was a frame whose caption changed size at every cut, and the
sentences that shrank most were the ones carrying the most words — sized down exactly where they
needed reading. Auto-fit optimises the wrong thing: it keeps the *line* intact at the cost of the
*type*, when the line is the cheaper of the two to break.

So the size is now fixed per locale (`captionSize`) and `SpokenSubtitleTrack` measures each
sentence at that size. One that does not fit `captionRoom` is split at the word boundary leaving
the two halves closest to equal width, recursing until every part fits. Sentence boundaries are
still preferred cuts — that is where the voice pauses — and the width split is what handles a
sentence too long to be one.

Balanced rather than greedy: a greedy fill leaves a full line followed by a two-word remainder,
which reads as an accident. Only a single word wider than the frame is left overflowing; there is
nothing left to cut, and a silently dropped caption is worse than one that overhangs.

**Not done:** no wrapping to two lines. Half a sentence above the other half makes the eye travel
back, and in short form it eats the frame.

### The sentence is centred and the words inside it are not — both, at once

The first attempt read the requirement as a choice between the two and picked left for en:
streaming and centring are incompatible, because each new word re-centres the line and drags the
words already read sideways. That much is true. But left-aligning the *caption* to fix it parks
every line hard against the safe-zone edge, and a caption with no margin reads as a mistake.

They are not actually in conflict, because they are about different things. The requirement on the
words is that they not MOVE; the requirement on the sentence is where it SITS. Satisfy both by
reserving the full sentence's width and centring that, then laying the words out from its left
edge — so each word's position is decided once, by the complete sentence, and never revised.

The mechanism is `visibility: hidden` rather than not rendering. Every word is in the layout from
frame 0 in both locales; en hides the ones it has not reached, and a hidden span holds its box
without drawing its glyph or its band. Nothing has to be measured — the width is reserved because
the words are really there. (The track still measures, but only to decide where to cut.)

**Centred on the frame, which costs width.** Centring inside the safe zone was the first answer
and it is visibly wrong: `SAFE_ZONE` is asymmetric — left 55, right 145, the right inset being the
platform action rail — so the caption landed at x=495 of 1080, 45px off the frame's real centre.
Nobody reads a caption against the safe zone; they read it against the frame edges, and 45px of
offset shows.

Captions therefore take a **symmetric** inset of `max(left, right)` on both sides. The midpoint is
then the frame's own, and the larger inset still clears the rail on the side that has one. The
price is width — 790px rather than 880 at 1080 — paid in more sentence cuts, which the track
already handles and which is much the cheaper of the two.

The zone is derived from the canvas with `safeZoneFor`, so one component serves a 1080x1920 short
and a 1920x1080 landscape cut without a second set of numbers.

**Not done:** no alignment prop. It is one rule and it is the same in both locales; a knob here
just lets a composition put back the version that drags the words.

### Numbers are digits

`12.5%`, `4个核心`, `7天` — not 百分之十二点五, not "twelve point five percent". A digit is taken in
at a glance in both scripts; a spelled-out number is read as words, costs the line several word
slots, and in zh pushes a sentence over the width where it has to be cut.

### Two styles, and the default differs by locale

`band` is everything else in this document: the striped rule carries the state, the text holds one
colour, and only a word marked `*` departs from it. `plain` drops the band entirely — white text,
and the word being spoken turns fluorescent green.

**en defaults to `plain`, zh to `band`.** Latin words are simple enough shapes to carry the state
in their own colour, so the rule buys en nothing it does not already have and costs it weight at
the bottom of frame. `band` remains available to en explicitly, for a cut with room for it.

`plain` in zh is **ignored, not obeyed**. The band exists in zh precisely because recolouring dense
character strokes mid-line costs legibility for a cue the band already gives; `plain` is nothing
but that recolouring, so in zh it is the one thing the design rules out. A prop that silently does
the wrong thing on one locale is worse than a prop that refuses, and refusing loudly would make
`captionStyle` unusable on a mixed-locale render — so it clamps.

In `plain`, `*` stops carrying anything extra: every spoken word already lights. The rows stay
valid, so one script feeds both styles.

**Not done:** no third style, and no per-word style. The two exist because they answer two
different questions about the footage underneath, not as a palette.

### A line clears on the frame its last highlight does

Two wrong answers first. The line originally held until the NEXT line started, on the argument
that a caption vanishing the instant it is spoken is unreadable and the gap reads as a dropped
frame. At this rhythm that is simply false — beats sit ~5s apart and a sentence takes ~2s, so a
finished caption sat for seconds over a picture that had moved on.

The second answer was a short tail past the last word. That is worse than it sounds: the tail is
a distinct, visible beat in which the line is still there with nothing lit, and it reads as the
caption having been forgotten rather than ended. No tail length fixes it, because any tail at all
IS the artefact — so the knob was removed rather than defaulted to zero.

The highlight is the caption's clock. The last word's `endMs` ends the word, the highlight and the
line on the same frame. Verified: at frame 626 the final word is lit (4832 fluorescent pixels);
frame 628 is 100.00% transparent. Nothing is ever on screen not doing something. The end is still
capped at the next line's start, so two lines cannot overlap however tight the timings get.

### Captions are a variant-level track, not a beat overlay

S01 rendered its captions as `kinetic-captions` — a rolling window of words driven by one
`captions.all.json` per locale, generated by a per-episode `caption-map.mjs`. `tools/captions-import.mjs`
converted all four episodes to the spoken-caption source; the per-word timings are the expensive
half and were kept verbatim.

Two things that conversion settled:

**`e` in the old props is emphasis, not an end time.** `'brand'` or `'harsh'`
(`KineticCaptions.tsx`). Reading it as a timestamp produced `NaN` ends rather than silently wrong
ones, which is the only good outcome of a bad assumption. A word's end is the next word's start.
The two emphasis colours collapse to one `|*`: the spoken design has a single emphasis level on
purpose, so that lit text means "the word the sentence is about" rather than encoding a second
axis. 198 marked words across the eight files, ~2 per line, which is the density that design asks
for.

**A caption track is not a beat overlay.** A beat overlay appears for one beat; a caption track
runs the length of the episode. Modelling it as `beats[].overlay` made four episodes fail the
"beats use overlays but outputs.overlays is empty" gate for doing the right thing. It is declared
on the variant instead — `variants.<locale>.captions` — and `vm check` verifies the file exists.

That gate is now a warning, for a second reason the conversion exposed: S01's zh-CN cut is a
literal translation riding the unchanged English audio, so every overlay except the caption track
is reused from en-US. An empty overlay list for a locale is a thing to look at, not a defect.

### The caption rate and the speaking rate are not the same number

Captions with no audio can run faster than speech, and should: the reader is reading, not
listening, and a line that lingers past its point is what makes short form feel slow. The pacing
here is 280 ms/word (en) and 155 ms/char (zh), tightened from 335/185 for exactly that reason.

Measured against Kokoro-82M reading the same lines at speed 1.0, those numbers do not survive
contact with a voice:

| | caption rate | Kokoro at 1.0 | cues overrunning |
|---|---|---|---|
| en-US | 280 ms/word | ~325 ms/word | 4 of 8 |
| zh-CN | 155 ms/char | ~330 ms/char | **8 of 8**, by 1.2–1.6s each |

zh was the sharp one: the captions were laid out about **2.1x faster than the voice speaks them**.

So the burst-intro captions are no longer hand-timed at all. The narration is synthesised first
and the rows are read off it, in one step, so the two cannot disagree — which is the only way this
stays true when a line changes. The generator lives in the Kokoro spike worktree
(`tools/tts/build-narration.py`, branch `spike/kokoro-tts`) and writes straight into the
compositions here.

Where the word timings come from differs per locale, because the voice offers different things.
en gets per-word `start_ts`/`end_ts` from the synthesiser's own tokens — exact, free, and
punctuation-filtered so a lone `,` never becomes a caption unit that lights. zh gets no tokens but
does get `pred_dur`, one duration per phoneme at exactly 25 ms a unit, which is better than any
alignment because it is what the model actually did rather than what a recogniser thinks it heard.

**The transcribe → group-words loop is still correct, and it is for a HUMAN take.** It was tried
here first and it fails on synthetic zh: whisper drops ~35% of zh tokens as byte-split U+FFFD, 100
of 107 characters failed to match, and the rows came out with words whose start exceeded their end
and a sentence ending at 0.00s. Do not read that as the loop being wrong — read it as never asking
a recogniser what the synthesiser already knows.

The rate a silent cut wants is still faster than speech; that half of this section stands. What
changed is that a narrated cut no longer negotiates with it.

### Timing comes from measurement, not from feel

The first pass used 500 ms per character and read **2.3× too slow**. Measured against the real
26 s zh narration transcribed here: **4.58 chars/sec, median 180 ms, mean 218 ms**. The demos use
185 ms per character, and a word's span is proportional to its characters so `核心` holds twice as
long as `的`. English runs ~335 ms per word.

