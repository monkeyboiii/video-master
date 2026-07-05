# Skill: Audio & Render QC

## Purpose

Gate every export before it leaves the pipeline: verify the file is technically correct
for its platform, the audio is clean and level, and the content matches the manifest.
QC failures go back to the responsible stage — QC never "fixes" content itself.

## Inputs

- The export under test in `media/exports/` (review or final)
- `manifest.yml` — formats, variant, target platform
- `docs/platforms.md` — per-platform delivery specs
- `docs/golden-rules.md` — subtitle/hook rules being spot-checked

## Outputs

- QC report appended to `edit-notes.md` under `## QC <filename>` — pass/fail per check,
  with measured values
- On pass: manifest `outputs.exports` updated, `status: qc`
- On fail: named owner stage (script / graphics / edit / subtitles) and the specific fix

## Technical checks (measure, don't eyeball)

Probe with `node tools/probe-media.mjs <file>` (uses Remotion's bundled ffprobe):

1. **Container/codec** — MP4, H.264, AAC for all current platforms.
2. **Resolution & aspect** — matches manifest format and the filename's aspect token
   (e.g. 1080x1920 for `9x16`).
3. **Frame rate** — matches manifest `fps`, constant frame rate.
4. **Duration** — within the platform's limit and ±10% of the summed beat targets for
   that locale; hard-check anything over the platform max in `docs/platforms.md`.
5. **Bitrate** — ≥ 8 Mbps video for 1080p vertical (survives platform recompression).
6. **Audio** — 48 kHz, stereo, no clipping (true peak ≤ −1 dBTP), target loudness
   −14 LUFS integrated (±1). Measure with Remotion's bundled ffmpeg (run from
   `packages/remotion-graphics/`):

   ```bash
   npx remotion ffmpeg -hide_banner -i <export> -af ebur128=peak=true -f null - 2>&1 | tail -12
   ```

   Read `I:` (integrated LUFS) and `Peak:` (true peak) from the summary block. If the
   measurement genuinely can't be run, flag `UNMEASURED` rather than guessing.

## Content checks (watch the actual file)

7. **Hook timing** — first meaningful frame + first subtitle land within 2 seconds.
8. **Safe zones** — subtitles and overlay text inside the platform safe region
   (`docs/platforms.md`); nothing under the action rail or caption zone.
9. **Subtitle sync** — spot-check start, one mid-beat transition, and the CTA;
   emphasis words present, no truncated lines.
10. **Variant integrity** — locale of VO, subtitles, and overlays all match the
    filename's locale token; no sibling-variant text left in.
11. **Ending** — CTA present, follow expectation stated, no dead air after the last
    beat.

## Steps

1. Run the technical checks; record measured values (not just pass/fail).
2. Watch the export start-to-finish once at normal speed, then re-check items 7–11.
3. Write the QC block in `edit-notes.md`. Verdict: `PASS`, `PASS-WITH-NOTES`, or
   `FAIL → <owner stage>: <fix>`.
4. On PASS: update `manifest.yml outputs.exports`, set `status: qc`, run
   `node tools/validate.mjs`.
5. A `final` export additionally requires the publishing checklist
   (`docs/publishing-checklist.md`) completed for its platform.

## Rules

- Every review export gets QC before the human watches it — the human's time goes to
  creative judgment, not catching wrong resolutions.
- Measured values go in the report so trends are visible across episodes.
- QC does not edit content. It routes failures to the owning stage.
- A FAIL on any technical check blocks `final` renaming, no exceptions.

## Done criteria

- QC block exists in `edit-notes.md` with all 11 checks and measured values.
- Verdict recorded; on PASS the manifest and status are updated and
  `node tools/validate.mjs` passes.
