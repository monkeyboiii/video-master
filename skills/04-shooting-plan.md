# Skill: Shooting Plan (拍摄)

## Purpose

Turn the script's beats into a shotlist the human can execute in one session, and record
the resulting raw footage as manifest assets so every later stage can reference clips by
ID instead of by guessing filenames.

## Inputs

- `manifest.yml` (beats with `visual_intent`), `script.*.md`, `cover.*.md` (first-frame
  intent)
- Available cameras/locations from the human (state assumptions if unknown)

## Outputs

- `shotlist.md` — ordered, groupable by location/setup, one row per shot
- `manifest.yml` updated: planned shot IDs before the shoot; `assets.raw` entries with
  filenames and external locations after the shoot

## Steps

1. For every beat, derive the minimum shots that deliver its `visual_intent`. Reuse one
   shot across beats where possible — fewer setups, faster shoots. Every shot carries
   an information function — use the per-section shot-design table in
   `docs/golden-rules.md` (Shots 镜头 section) as the default: hook = close-up direct
   address, problem = fast cuts, points = medium shot + keyword subs, proof = real
   footage, checklist = card layout, cta = return to camera.
2. Add mandatory coverage: the first-frame/cover shot (from `cover.*.md`), one safety
   wide per location, and B-roll for the checklist beat. Shoot for the retention edit
   (`docs/golden-rules.md`, Edit 剪辑): a second angle or detail insert per beat, so
   the editor can land a pattern interrupt every 1–3 seconds without reusing footage.
3. Number shots `SH010, SH020…` (pickups slot in between). Assign camera and framing per
   shot (`gopro-front`, `facecam`, `clutch-closeup`…) — these become the filename tokens
   from `docs/naming-conventions.md`.
4. Group the shotlist by location/setup so the human shoots efficiently, not in script
   order.
5. Note per shot: beat(s) served, must-hear audio (if VO is live), and what "good take"
   means — one line each.
6. **After the shoot**: rename files to convention, record each file under `assets.raw`
   (asset_id, filename, external_uri, notes), and if selects are known, add
   `assets.selected` with in/out timecodes per beat. Probe durations/resolutions with
   `node tools/probe-media.mjs <file-or-dir>` and record what it reports.
7. **Voiceover** (human records; agent prepares and books):
   - Prepare a per-locale VO read sheet from the script's Spoken lines (beat order, one
     paragraph per beat) and put it at the top of `edit-notes.md` if helpful.
   - The human records per locale: 48 kHz WAV, mono or stereo, quiet room, one file per
     take set, named `{VIDEO_ID}_{locale}_vo_v{version}.wav` into `media/voiceover/`.
   - Record each file under `assets.voiceover` (asset_id `VO_EN_001` / `VO_ZH_001`,
     locale, filename, external_uri) and set `variants.<locale>.voiceover_asset_id`.
     Subtitle timing (`skills/07`) stays provisional until this exists.
8. Update manifest `status: shooting`; run `node tools/validate.mjs`.

## Rules

- Both locales share footage by default. If a beat needs locale-specific footage (e.g.
  spoken-to-camera lines), mark the shot with the locale explicitly.
- Every shot serves a named beat. A shot with no beat is a cut candidate, not a plan
  item.
- File naming is exact: `{VIDEO_ID}_SH{shot}_TK{take}_{camera-or-content}.{ext}`.
- Raw media never enters git — external location goes in the manifest.

## Done criteria

- Every beat has at least one planned shot; cover/first-frame shot is explicit.
- Shotlist is grouped for shooting efficiency and fits the human's stated session time.
- (Post-shoot) all raw files renamed, recorded in `assets.raw`, probed, and
  `node tools/validate.mjs` passes with `status: shooting`.
