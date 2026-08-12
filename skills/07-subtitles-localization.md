# Skill: Subtitles & Localization (字幕/本地化)

## Purpose

Produce per-locale subtitle files that **highlight and reinforce** the voiceover (never
merely transcribe it), and audit variant pairs for localization quality.

## Inputs

- `script.<locale>.md` (with emphasis words marked by the script pass)
- Voiceover timing: the VO file recorded in the manifest
  (`variants.<locale>.voiceover_asset_id`), or beat `target_duration_sec` as a first
  approximation before VO exists
- `docs/localization.md`, `docs/golden-rules.md` subtitle rules, `docs/platforms.md`
  safe zones

## Outputs

- `subtitles/<locale>.srt` — timed, emphasis-aware subtitle text
- **Word-timed caption map** — per-beat `remotion-props/captions.<beat>.json` derived from
  the SRT: each word `{t, s, e?}` (text, start-seconds-into-clip, emphasis `brand`|`harsh`),
  by distributing words across each cue and tagging emphasis from the script (worked-example
  generator: the episode's `caption-map.mjs`). This is the
  pre-edit sync artifact the editing agent works off — captions, SFX hits, zoom, and
  overlay in/out points all key to it (see `skills/06-kdenlive-editing.md`). **Line up the
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
   `docs/localization.md` — shared beats/message/CTA, native phrasing, local examples.
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
(`docs/golden-rules.md`). A line that is missing spoken words reads as out of sync even
when its timing is correct.

## Rules

- The division of labor is fixed (`docs/golden-rules.md`, Subtitles 字幕 section):
  **voiceover explains, subtitles highlight, visuals reinforce.** Subtitles compress
  each passage into its keywords — if a line adds nothing over the audio, compress or
  drop it.
- Never generate one locale's SRT by translating the other's — work from that locale's
  script.
- Subtitle position must respect vertical-video safe zones (`docs/platforms.md`):
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
