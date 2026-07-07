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
- If burned-in subtitles are wanted (a per-episode creative choice — platform-native
  captions are the default): render the `subtitle-track` composition with
  `node tools/render-overlays.mjs <episode-dir> <locale> --comp=subtitle-track` — it
  loads the locale's `.srt` automatically and spans the summed beat durations
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
