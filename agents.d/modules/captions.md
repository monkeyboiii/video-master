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
   `templates/episode/edit-notes.md` and fill the `{{...}}` tokens.
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
script has the boundaries a segmenter would try to infer, written by whoever chose them. It walks
the script's words against the transcription's characters and takes each word's span from the
first and last character it consumed. Text comes from the script, timings from the transcription —
each used for the half it is good at, which is the same division § The script is known, so ASR
output is a draft already argues for.

The component does not segment at all. It highlights exactly the rows it is given, so the unit is
whatever upstream decided.

**Not done:** no jieba or other Chinese segmenter. It would be a dependency and a second source of
truth that disagrees with the script. **The threshold:** captions wanted for a take that has no
script.

### Only the band lights in zh; en lights the text too

zh holds **one text colour throughout** — unspoken, spoken and past characters are identical, and
the band alone carries the state. Chinese characters carry meaning in dense strokes and recolouring
them mid-line costs legibility for a cue the band already gives. en lights the text as well, since
Latin words survive it and in streaming mode the newest word must be findable the instant it lands.

Defaults follow `locale`; `litText` overrides and should rarely be set.

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
| `#D3EE94` litSoft | lit text (en only) |
| `#231F28` band | the unlit rule |
| `#3F4560` hatch | its stripes |
| `#162840` stroke | the text outline |
| `#CEE7F3` text | unspoken text |
| `#92B7E1` textSpent | spoken text (en only) |

### One line, always — and sentences are the cut

The type is sized to the whole sentence with `fitText` and never wraps, so a long line gets small
rather than tall; that makes "too long" visible instead of ugly, and the fix is a cut. The fit is
computed from the complete sentence even while streaming, or the type resizes on every word.
`SpokenSubtitleTrack` splits on sentences, which puts the cut where the voice already pauses.

### Timing comes from measurement, not from feel

The first pass used 500 ms per character and read **2.3× too slow**. Measured against the real
26 s zh narration transcribed here: **4.58 chars/sec, median 180 ms, mean 218 ms**. The demos use
185 ms per character, and a word's span is proportional to its characters so `核心` holds twice as
long as `的`. English runs ~335 ms per word.

