# Skill: Kdenlive Edit Preparation

## Purpose

Prepare everything the human needs to assemble and polish the edit in Kdenlive quickly:
selected clips, an edit plan mapped to beats, overlays in the right format, and (when
enabled) a machine-generated rough-cut timeline. Kdenlive is the human surface — the
agent prepares, the human decides.

## Inputs

- `manifest.yml` — beats, `assets.raw`, `assets.selected`, variant timing
- `script.<locale>.md`, rendered overlays in `media/overlays/`
- `subtitles/<locale>.srt`
- `templates/kdenlive/` seed projects (if present)

## Outputs

- `assets.selected` entries in `manifest.yml`: per beat, source asset + in/out timecodes
- `edit-notes.md` — the assembly plan the human follows in Kdenlive (see below)
- Optionally a seed timeline file in `media/timelines/`, named
  `{VIDEO_ID}_{locale}_v{version}.kdenlive`
- Manifest `status: editing`, `outputs.kdenlive` recorded

## Edit-notes format

`edit-notes.md` is the rough cut in text form. Per beat, in timeline order:

```text
## hook (target 3.5s en-US / 3.0s zh-CN)
V1: SEL_001 (RAW_001 00:00:04.200–00:00:09.800) — clutch stall, cut on the lurch
V2: DBX-BEG-S01E003_en-US_9x16_hook-title_v001.mov from 0.0s
Audio: VO_EN_001 from 0.0s; engine SFX under, duck −12dB
Notes: hold the stall frame 8 extra frames before cutting
```

Every clip is referenced by asset ID + timecode, never by "the good take".

## Timeline generation policy (current decision)

- **Now:** the human assembles in Kdenlive from `edit-notes.md`. Track layout
  convention: V1 footage, V2 overlays, V3 spare; A1 voiceover, A2 music/SFX. Subtitles
  imported from the SRT via Kdenlive's subtitle tool.
- **Template seeds:** small `.kdenlive` templates with this track layout may live in
  `templates/kdenlive/` (relative paths, saved by the pinned Kdenlive version). They are
  generate-once seeds — never hand-merge or diff Kdenlive-saved XML; regenerate instead.
- **Later (deliberate deferral):** programmatic rough cuts should target **OpenTimelineIO
  import** (native in Kdenlive ≥ 25.04; carries tracks/clips/markers, not effects) rather
  than emitting `.kdenlive` XML, whose document version churns. Do not build `.kdenlive`
  generators from scratch; if rough-cut generation gets built, it goes in
  `tools/` with its own skill update.

## Steps

1. From script + shotlist + probe data, choose selects per beat: `assets.selected`
   entries with `source_asset_id`, `in`, `out`, `beat`. Respect per-locale
   `target_duration_sec` (selects may differ slightly per locale).
2. Verify every overlay the beats need exists in `media/overlays/` at the right
   version (else run `skills/05-remotion-graphics.md` first).
3. Write `edit-notes.md` in the format above (if it doesn't exist yet, copy
   `templates/episode/edit-notes.md` and fill the `{{...}}` tokens), complete enough
   that assembly requires no creative guessing — creative *choices* stay flagged as
   `DECIDE:` lines for the human.
4. Confirm audio plan per beat: VO segment, music/SFX intent, ducking notes. Every
   music/SFX track must be recorded in `assets.audio` with `source` and `license` —
   only tracks licensed for commercial social use (see `media/README.md`).
5. Update the manifest (`status: editing`, `outputs.kdenlive` planned filename).
6. Run `node tools/validate.mjs`.

## Rules

- The manifest's selects are the source of truth; the `.kdenlive` file is a working
  surface. If the human's edit diverges creatively, update `assets.selected` and
  `edit-notes.md` to match reality afterwards (that record feeds the retro).
- Overlays must be ProRes 4444 `.mov` (see `skills/05-remotion-graphics.md`). Never ask
  the editor to key or matte an opaque render.
- Timecodes are `HH:MM:SS.mmm`, source-relative (not timeline-relative).
- Don't commit anything from `media/` — timelines included.

## Done criteria

- Every beat has selects with timecodes and an edit-notes entry covering video, overlay,
  and audio layers.
- All referenced overlays/VO exist at the stated versions.
- Open questions for the human are explicit `DECIDE:` lines, not silent choices.
- `node tools/validate.mjs` passes with `status: editing`.
