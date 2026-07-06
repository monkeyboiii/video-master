# Skill: Storyboard & Shooting Plan (分镜/拍摄)

## Purpose

Turn the beats and reading scripts into the **execution layer**: a storyboard & shot
plan (`storyboard.md`) that says how every shot is framed, captured, cut into,
captioned, and scored — then run the shoot against it and record the resulting footage
as manifest assets. In the three-layer model (`docs/production-model.md`): the brief is
direction, the reading scripts are content, **this is execution**.

## Inputs

- `manifest.yml` — beats with `purpose` and `visual_intent` (the locale-neutral seed)
- `script.<locale>.md` — spoken lines and emphasis words the shots must serve
- `cover.*.md` — first-frame intent (captured deliberately)
- `docs/golden-rules.md` — Edit 剪辑 palettes (transitions, SFX) and the
  pattern-interrupt rule; Shots 镜头 shot-design table
- Available cameras/locations from the human (state assumptions if unknown)

## Outputs

- `storyboard.md` (copy `templates/episode/storyboard.md`, fill the `{{...}}` tokens):
  shot-by-shot breakdown in timeline order + shooting order grouped by location
- `manifest.yml` updated after the shoot: `assets.raw` entries with filenames and
  external locations; `assets.voiceover` + `variants.<locale>.voiceover_asset_id`

## Steps

1. For every beat, derive the minimum shots that deliver its `visual_intent`. Reuse one
   shot across beats where possible — fewer setups, faster shoots. Every shot carries
   an information function — use the per-section shot-design table in
   `docs/golden-rules.md` (Shots 镜头 section) as the default: hook = close-up direct
   address, problem = fast cuts, points = medium shot + keyword subs, proof = real
   footage, checklist = card layout, cta = return to camera.
2. Fill the shot-by-shot breakdown per shot: frame/composition, action, **transition
   in**, **caption/overlay** (a composition ID or on-screen text intent), **SFX
   intent**, camera token. Transitions and SFX come from the golden-rules Edit palettes
   and must trace to the script's emphasis words and the beat's purpose — the
   storyboard is where the retention plan first commits to shots.
3. Add mandatory coverage: the first-frame/cover shot (from `cover.*.md`), one safety
   wide per location, and B-roll for the checklist beat. Shoot for the retention edit:
   a second angle or detail insert per beat, so the editor can land a pattern interrupt
   every 1–3 seconds without reusing footage.
4. Number shots `SH010, SH020…` in timeline order (pickups slot in between). Assign
   camera/framing tokens (`gopro-front`, `facecam`, `clutch-closeup`…) — these become
   the filename tokens from `docs/naming-conventions.md`.
5. Write the shooting order: group shots by location/setup so the human shoots
   efficiently, with one line per shot for what "good take" means and must-hear audio
   (if VO is live).
6. Footage is shared across locales by default. If a shot is locale-specific (e.g.
   spoken-to-camera lines), mark it "(zh-CN only)" / "(en-US only)" in Action.
7. **After the shoot**: rename files to convention, record each file under `assets.raw`
   (asset_id, filename, external_uri, notes), note deviations from the plan per shot
   (they feed `edit-notes.md`), and if selects are already known, add `assets.selected`
   with in/out timecodes per beat. Probe durations/resolutions with
   `node tools/probe-media.mjs <file-or-dir>` and record what it reports.
8. **Voiceover** (human records; agent prepares and books):
   - Prepare a per-locale VO read sheet from the reading script's Spoken lines (beat
     order, one paragraph per beat) and put it at the top of `edit-notes.md` if helpful.
   - The human records per locale: 48 kHz WAV, mono or stereo, quiet room, one file per
     take set, named `{VIDEO_ID}_{locale}_vo_v{version}.wav` into `media/voiceover/`.
   - Record each file under `assets.voiceover` (asset_id `VO_EN_001` / `VO_ZH_001`,
     locale, filename, external_uri) and set `variants.<locale>.voiceover_asset_id`.
     Subtitle timing (`skills/07`) stays provisional until this exists.
9. Update manifest `status: shooting`; run `node tools/validate.mjs`.

## Rules

- Every shot serves a named beat. A shot with no beat is a cut candidate, not a plan
  item.
- The storyboard is the **plan**; `edit-notes.md` is the **record**. Plan transitions
  and SFX here; confirm or adjust them against real takes there — never maintain two
  live plans.
- File naming is exact: `{VIDEO_ID}_SH{shot}_TK{take}_{camera-or-content}.{ext}`.
- Raw media never enters git — external location goes in the manifest.

## Done criteria

- Every beat has at least one planned shot; every shot row has frame, action,
  transition, caption/overlay, and SFX intent filled (or an explicit "-").
- Cover/first-frame shot is explicit; interrupt coverage exists per beat.
- Shooting order fits the human's stated session time.
- (Post-shoot) all raw files renamed, recorded in `assets.raw`, probed; VO recorded and
  booked; `node tools/validate.mjs` passes with `status: shooting`.
