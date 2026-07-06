# Skill: Kdenlive Edit Preparation

## Purpose

Prepare everything the human needs to assemble and polish the edit in Kdenlive quickly:
selected clips, an edit plan mapped to beats, a **per-beat retention plan**, overlays in
the right format, and (when enabled) a machine-generated rough-cut timeline. Kdenlive is
the human surface — the agent prepares, the human decides.

The edit follows the retention-editing doctrine in `docs/golden-rules.md` (Edit 剪辑
section): first-second grab, a pattern interrupt every 1–3 seconds, SFX as punctuation,
subtitles as navigation, engineered reasons to keep watching — and never over-edited.

## Inputs

- `manifest.yml` — beats (purpose per beat), `assets.raw`, `assets.selected`, variant timing
- `storyboard.md` — the shot plan: framing, transitions, caption/overlay and SFX intents
  per shot (the retention plan's first commitment)
- `script.<locale>.md` — spoken lines **and emphasis words** (they anchor the retention plan)
- `brief.md` — the designed reactions the edit must serve
- Rendered overlays in `media/overlays/`, `subtitles/<locale>.srt`
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
## Assembly plan — en-US

### hook (target 3.5s)

V1: SEL_001 (RAW_001 00:00:04.200–00:00:09.800) — clutch stall, cut on the lurch
V2: DBX-BEG-S01E003_en-US_9x16_hook-title_v001.mov from 0.0s
Audio: VO_EN_001 from 0.0s; engine SFX under, duck −12dB
Retention: punch-in on "wrong bike" (emphasis word); jump cut mid-stall; no static
  stretch >2s in this beat
SFX: hit on the lurch; pop when hook text lands
Notes: hold the stall frame 8 extra frames before cutting
```

zh-CN beats go under their own `## Assembly plan — zh-CN` section — only where selects
or timing differ from en-US; otherwise write "same as en-US" (template comment says the
same).

Every clip is referenced by asset ID + timecode, never by "the good take".

The `Retention:` and `SFX:` lines are **derived, not invented**: they start from the
storyboard's per-shot Transition/SFX intents, adjusted against the real takes. Pattern
interrupts land on the script's emphasis words, punch-ins on key sentences and
reversals, SFX on the moments the beat's `purpose` says matter, and the whole plan
serves the brief's designed reactions. If a flourish can't be traced to
storyboard/script/beat/brief, it doesn't go in.

## The editor's toolbox

What's actually available when planning retention moves (don't prescribe what the
stack can't deliver):

- **Kdenlive (human, on the timeline):** hard cuts / jump cuts (the default), punch-in
  and pull-out via Transform keyframes, speed ramps (our riding footage staple), whip
  pan / match cut when the footage supports it, clip-level audio ducking, the subtitle
  tool (imports our SRT). Fancy built-in transitions are a last resort — hard cut wins.
- **Remotion overlays (agent-rendered, ProRes 4444 on V2):** each composition is a
  retention device — `hook-title` (first-frame grab), `subtitle-track` (kinetic
  captions with keyword highlight), `checklist-card` (save-worthy value, ding-per-tick),
  `stage-cards` (segment reset / pattern interrupt), `lower-third` (context without
  stopping), `cta-card` (ending expectation). Props/renders via
  `skills/05-remotion-graphics.md`. Missing device (e.g. a callout arrow, zoom
  highlight)? That's a new component through the design-system PR path, not a one-off
  editor hack.
- **SFX palette (A2, licensed per `media/README.md`, recorded in `assets.audio`):**
  click/pop, whoosh, hit/impact, ding, riser, record-scratch/glitch, bass drop — usage
  table in `docs/golden-rules.md`. Accents at key moments; breathing room elsewhere.

## Timeline generation policy (current decision)

- **Now:** the human assembles in Kdenlive from `edit-notes.md`. Track layout
  convention: V1 footage, V2 overlays, V3 spare; A1 voiceover, A2 music/SFX. Subtitles
  imported from the SRT via Kdenlive's subtitle tool.
- **Template seeds:** small `.kdenlive` templates with this track layout may live in
  `templates/kdenlive/` (relative paths, saved by the pinned Kdenlive version). They are
  generate-once seeds — never hand-merge or diff Kdenlive-saved XML; regenerate instead.
- **Programmatic rough cut (`cli-anything-kdenlive`):** an agent can pre-assemble the
  timeline via the `cli-anything-kdenlive` CLI (installed; see
  `.claude/skills/cli-anything-kdenlive/SKILL.md`). It's REPL-stateful — pipe a command
  script into `uvx cli-anything-kdenlive` (project new → bin import → add-track →
  add-clip → `export xml`), and it emits an MLT/`.kdenlive` with **relative** media
  paths, so the project is portable across machines. Run it from **inside the episode
  media bundle** so paths stay relative; keep the command script tracked as
  `kdenlive-build.repl` in the episode dir (production logic — regenerate the `.kdenlive`
  from it). Known gotchas: pass `--width/--height/--fps-num/--fps-den` for a vertical
  profile, then post-fix the profile's `sample_aspect`→1:1 and `display_aspect`→9:16
  (the CLI defaults them to 16:9); it has no subtitle or alpha-composite transition
  support, so import the SRT and confirm overlay compositing in Kdenlive on open.
  Worked example: `series/app-community/episodes/DBX-APP-S01E001-made-for-riders/kdenlive-build.repl`.
- **Template seeds / OTIO** remain fallbacks: small `.kdenlive` seeds in
  `templates/kdenlive/`, or OpenTimelineIO import (Kdenlive ≥ 25.04; carries
  tracks/clips/markers, not effects). Never hand-merge or diff Kdenlive-saved XML —
  regenerate instead.

## Steps

1. From the storyboard + reading script + probe data, choose selects per beat: `assets.selected`
   entries with `source_asset_id`, `in`, `out`, `beat`. Respect per-locale
   `target_duration_sec` (selects may differ slightly per locale).
2. Verify every overlay the beats need exists in `media/overlays/` at the right
   version (else run `skills/05-remotion-graphics.md` first).
3. Write `edit-notes.md` in the format above (if it doesn't exist yet, copy
   `templates/episode/edit-notes.md` and fill the `{{...}}` tokens), complete enough
   that assembly requires no creative guessing — creative *choices* stay flagged as
   `DECIDE:` lines for the human.
4. Write the per-beat `Retention:` and `SFX:` lines from the script's emphasis words,
   the beat's purpose, and the brief's designed reactions. Confirm no beat leaves a
   static stretch over ~3 seconds without an intentional reason.
5. Confirm audio plan per beat: VO segment, music/SFX intent, ducking notes. Every
   music/SFX track must be recorded in `assets.audio` with `source` and `license` —
   only tracks licensed for commercial social use (see `media/README.md`).
6. Update the manifest (`status: editing`, `outputs.kdenlive` planned filename).
7. Run `node tools/validate.mjs`.
8. **After assembly** (before any review export): run the post-edit retention
   checklist from `docs/golden-rules.md` and record the ten answers in
   `edit-notes.md` under `## Retention checklist`.

## Rules

- The manifest's selects are the source of truth; the `.kdenlive` file is a working
  surface. If the human's edit diverges creatively, update `assets.selected` and
  `edit-notes.md` to match reality afterwards (that record feeds the retro).
- Overlays must be ProRes 4444 `.mov` (see `skills/05-remotion-graphics.md`). Never ask
  the editor to key or matte an opaque render.
- Timecodes are `HH:MM:SS.mmm`, source-relative (not timeline-relative).
- Every retention move has a function (emphasis, turn, explanation, humor, information
  gap). If every second screams, nothing lands — over-editing fails review.
- Don't commit anything from `media/` — timelines included.

## Done criteria

- Every beat has selects with timecodes and an edit-notes entry covering video, overlay,
  audio, `Retention:`, and `SFX:` lines — each move traceable to script/beat/brief.
- All referenced overlays/VO exist at the stated versions.
- Open questions for the human are explicit `DECIDE:` lines, not silent choices.
- (Post-assembly) the ten-item retention checklist is answered in `edit-notes.md`.
- `node tools/validate.mjs` passes with `status: editing`.
