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
11. **Ending** — follow expectation designed (golden rule 6), no dead air after the
    last beat. A deliberate loop back to the first frame passes only when the follow
    expectation is delivered via the platform caption and `edit-notes.md` records that
    choice.
12. **Retention cadence** — no static stretch over ~3 seconds without a visual or
    audio change, unless `edit-notes.md` marks it intentional; and not over-edited
    (accents at key moments, breathing room elsewhere).
13. **Muted test + SFX punctuation** — video understandable with sound off; key
    subtitle/reversal/checklist moments have light SFX feedback, not wall-to-wall
    noise. Cross-check the retention checklist answers recorded in `edit-notes.md`
    (`skills/06`, `docs/golden-rules.md` Edit section).

## Steps

1. Run the technical checks; record measured values (not just pass/fail).
2. Watch the export start-to-finish once at normal speed, then re-check items 7–13
   (watch once muted for check 13).
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

## SDR graphics over HDR footage: convert, never grade

Overlaying an sRGB graphic onto an HLG/BT.2020 timeline without a colour conversion does not
make it "a bit contrasty" — it **destroys colour**. Stamped raw, DBX-APP-S02E001's whole orange
gradient (`#ff4a16`, `#ff3a08`, `#df2100`) collapsed to the same flat `(255,0,0)`. White
survives unchanged, so the damage looks selective and invites the wrong diagnosis.

Never fight it with `eq=contrast/saturation/brightness`, `colorchannelmixer=aa`, or pre-dimmed
`*-balanced` / `*-soft` asset variants. Dimming a flat red cannot restore a gradient; it only
dulls the brand colour. If someone is hand-tuning opacity to make a graphic "sit right" in HDR,
the pipeline is wrong, not the number.

Convert once, uniformly, per graphic layer:

```
zscale=transferin=iec61966-2-1:primariesin=bt709:matrixin=gbr:rangein=full
      :transfer=arib-std-b67:primaries=bt2020:matrix=bt2020nc:range=tv:npl=203
```

- `npl=203` is BT.2408 HDR reference (graphics) white — not a taste knob. Verify it: sRGB white
  must land at 10-bit **Y=721**, the 75% HLG signal. Measure with
  `signalstats,metadata=print`; `-v error` suppresses it, so don't use that flag.
- Composite in **10-bit RGB**. Pin `format=gbrp10le` after *every* overlay:
  `overlay=format=auto` alone lets negotiation settle on YUV to please the encoder, which
  silently reintroduces an implicit matrix on the graphics. `overlay=format=gbrp` is 8-bit and
  will band an HDR sky.
- Prove it before rendering 20 minutes of video: push each brand colour through
  forward-convert → display-transform and confirm it returns to source RGB within ~2/255.

ffmpeg is built with librsvg, so rasterize from the tracked `.svg` at the exact size needed
(`-width/-height` *before* `-i`) instead of maintaining a zoo of per-size PNGs. Two decoder
gotchas: `keep_ar` may shift a dimension by 1px, and `min=` in a zscale option string is parsed
as the `min()` math function — always write `matrixin=`.

## Done criteria

- QC block exists in `edit-notes.md` with all 13 checks and measured values.
- Verdict recorded; on PASS the manifest and status are updated and
  `node tools/validate.mjs` passes.
