# Edit Notes — DBX-APP-S02E001 "synced-app-flavor" · en-US

Skill followed: `skills/06-kdenlive-editing.md` and `skills/08-audio-render-qc.md` where applicable. This is a deterministic ffmpeg touch-up over a mature music-synced source, not a Kdenlive rough cut.

## Timing Source

Source: `media/DBX-APP-S02E001/footage/01_synced.MP4` (1440x2560, 60fps, HLG/Dolby Vision, embedded AAC music bed).

Detected hard-cut / transition anchors:

| Time | Meaning |
|------:|---------|
| 0.467 | first opening still transition |
| 1.350 | second opening still transition |
| 1.983 | hand / final opening transition |
| 10.550 | first walking overlay begins after helmet transition cluster |
| 14.033 | second walk begins |
| 15.400 | second-walk zoom/state cut; switch DirtBikeX wordmark scale/position |
| 16.883 | arms-crossed beat begins |
| 18.800 | arms beat clears into transition blur; Rubio profile fade begins |
| 19.200 | transition blur clears; Rubio profile fade ends and app icon begins |
| 22.550 | first true black frame; review export trims here |

`ffmpeg -vf blackdetect=d=0.05:pix_th=0.02` reported `black_start:22.55`, so the render cuts at 22.55s and drops all blackout after it.

## Assembly plan — en-US

### hook-x-callouts · 0.000-2.767

V1: `SEL_001` from `RAW_001`.
V2: `orange-X.svg` rasterized at 58x64, 124x136, 208x228, then `DirtBikeX.svg` at 500x238.
Audio: embedded music in `RAW_001`.
Retention: first-second visual callout; no extra title or self-intro.
SFX: none added.

Notes: the opening is four frozen stills separated by hard cuts at 0.4667, 1.3500, 1.9833 and
2.7667 (`scdet`, frame-exact at 60fps: frames 28 / 81 / 119 / 166). Nothing moves inside a
still, so each prop is a static stamp.

Every prop now runs **edge to edge of its own still** and clears with the picture. Previously
the DirtBikeX wordmark ran 1.983-2.683 and vanished 0.084s before the cut — it popped out
mid-still while the picture carried on, which is what read as "disappearing too quickly". It
now runs 1.9833-2.7667.

The three X marks are centred on the **measured fingertip**, not floated above it. Fingertips
(1080x1920 space, measured at 3x zoom on tone-mapped frames):

| Still | Window | Fingertip | X size | Overlay top-left |
|-------|--------|-----------|--------|------------------|
| A | 0.0000-0.4667 | (722,1083) | 58x64   | (693,1051) |
| B | 0.4667-1.3500 | (377,1187) | 124x136 | (315,1119) |
| C | 1.3500-1.9833 | (297,1231) | 208x228 | (193,1117) |

The old placements floated the mark above the hand — mark 3 sat ~68px above the tip and read
as detached from the finger. The size ramp (64 -> 136 -> 228, i.e. 1 : 2.1 : 3.6) is unchanged;
it reads as tiny, medium, large as the camera pushes in.

The still-D wordmark stays at `(550,1350)`: it sits in the blurred background right of the
face, and the fingertip at (994,1576) points up at its lower edge.

### gear-up · 2.767-10.550

V1: `SEL_002` from `RAW_001`.
V2: none.
Audio: embedded music.
Retention: source hard cuts carry the cadence; do not add overlays here.
SFX: none added.
Notes: this beat is left clean so the later app proof reads as the first major insert.

### first-walk-feature · 10.550-14.033

V1: `SEL_003` from `RAW_001`.
V2: `DBX-APP-S02E001_en-US_9x16_feature-phones-built-it_v001.mov`, copied from S01E002. Starts at its internal 0.0 and is cropped at the 14.033 hard cut.
Audio: embedded music.
Retention: app proof lands on the first stable walking segment.
SFX: none added.
Notes: this is the combined `21 languages` / `Post once` overlay; the separate poster overlay was intentionally removed.
Overlay colour: converted sRGB -> HLG/BT.2020 like every other graphic. No grade, full opacity.

### second-walk-logo · 14.033-16.883

V1: `SEL_004` from `RAW_001`.
V2: `DirtBikeX.svg` rasterized at 560x267 from 14.033-15.400, then at 460x219 from 15.400-16.883.
Audio: embedded music.
Retention: brand lock-in replaces the removed poster card and clears exactly at the arms-crossed cut.
SFX: none added.
Notes: split placement follows the close/chromatic walk state and the later wider zoom state instead of holding one static wordmark through both. Both sit at the top of frame (y=155 and y=235); the helmet crown stays around y=520-572 across the beat, so neither collides with the rider.

### rubio-profile · 16.883-19.200

V1: `SEL_005` from `RAW_001`.
V2: `DBX-APP-S02E001_en-US_9x16_profile-card_v001.mov`, copied from S01E002.
Audio: embedded music.
Retention: Rubio identity appears on the strongest static pose, then fades through the transition blur.
SFX: none added.
Notes: overlay stays solid through the crossed-arm pose and starts fading at 18.800 when the source transition blur begins. Alpha fade runs from 18.800-19.200. No grade; the only alpha change is that fade.

### app-icon-point · 19.200-22.550

V1: `SEL_006` from `RAW_001`.
V2: `AppIcon-ios-card.png`, derived from provided `AppIcon.png` with rounded iOS-style corners and drop shadow. The `-balanced` variant carried an extra SDR-overlay grade and is no longer used.
Audio: embedded music, trimmed to 22.55s.
Retention: final app-logo payoff; no dead black tail.
SFX: none added.
Notes: icon uses a fixed-position alpha fade from 19.200-19.650 with no x/y movement. Full-frame top-left `(610,720)` is retained and verified: the fingertip holds at ~(913,1190) across 19.30-22.40 (drift under ~10px), the icon box clears it by 30px, and the finger's slight left lean puts the icon on the pointing ray. A 440px card cannot be centred over x=913 without leaving frame.

## Render Notes

`render-review.sh` is the source of truth for the deterministic ffmpeg flatten.

The source is HEVC Main10 HLG/BT.2020 with Dolby Vision profile 8 side data. The review render now preserves the HDR delivery path as HEVC Main10 (`hvc1`), `yuv420p10le`, BT.2020 non-constant luminance matrix, and HLG transfer (`arib-std-b67`). The compositor does not carry Dolby Vision RPU side data through the re-encode, so the exported review should be treated as HLG HDR rather than Dolby Vision.

### Graphics colour: converted, not graded

The props are sRGB graphics and the timeline is HLG/BT.2020. Stamping sRGB code values
straight into an HLG/BT.2020 frame does not merely "look contrasty" — it destroys the colour.
Measured, feeding each of the wordmark/X gradient stops through a display transform:

| SVG stop | Stamped raw (what shipped) | Converted (`npl=203`) |
|----------|---------------------------|------------------------|
| `#ff4a16` (255,74,22) | **(255,0,0)** | (255,74,21) |
| `#ff3a08` (255,58,8)  | **(255,0,0)** | (254,59,10) |
| `#df2100` (223,33,0)  | **(255,0,0)** | (222,34,1)  |
| white     (255,255,255) | (255,255,255) | (254,254,254) |

All three orange stops collapse to the same flat, fully saturated red: the gradient is gone,
not shifted. That is why the previous fix — `eq=contrast/saturation/brightness` plus
`colorchannelmixer=aa`, and the pre-dimmed `*-balanced` / `*-soft` PNGs — could never look
clean. Dimming a flat red cannot put the gradient back, and it dulls the brand orange while
leaving whites (which happen to survive the mis-encode) untouched. It also explains why only
the orange looked wrong while the wordmark's white/black read acceptably.

The fix is one colorimetric conversion applied uniformly to every graphic layer, in
`render-review.sh` as `$SRGB_TO_HLG`:

```
zscale=transferin=iec61966-2-1:primariesin=bt709:matrixin=gbr:rangein=full
      :transfer=arib-std-b67:primaries=bt2020:matrix=bt2020nc:range=tv:npl=203
```

`npl=203` is not a tuned number: 203 nits is the ITU-R BT.2408 HDR reference (diffuse/graphics)
white, and it lands sRGB white at 10-bit Y=721 — exactly the 75% HLG signal the spec puts
graphics white at. Every grade and opacity knob is gone; overlays composite at full opacity.

Two supporting details:

- **Compositing space.** The base is converted to `gbrp10le` and every overlay output is pinned
  back to `gbrp10le`, so blending happens in 10-bit RGB. `overlay=format=auto` alone is not
  enough — negotiation will happily settle on YUV to satisfy the downstream encoder, which
  reintroduces an implicit matrix conversion on the graphics. `overlay=format=gbrp` is not an
  option either: it is 8-bit and would band the HDR sky.
- **Assets.** ffmpeg has librsvg, so the render rasterizes `orange-X.svg` / `DirtBikeX.svg` at
  the exact pixel size needed (`-width/-height` before `-i`) and converts them in-graph. The
  generated `*-balanced` / `*-soft` / per-size PNGs are no longer inputs to anything; they are
  left on disk (media/ is gitignored, so deleting them is unrecoverable) but are dead assets.

The source is HEVC Main10 HLG/BT.2020 with Dolby Vision profile 8 side data; the compositor
does not carry the DV RPU through the re-encode, so the export stays HLG HDR, not Dolby Vision.

## Subtitle Notes

There is no spoken VO. `subtitles/en-US.srt` is a timing map for the visual beats and validator stage gate; it is not burned into this review export.

## Retention checklist

1. First-frame grab? Yes: pointing still plus orange X callout.
2. First 3 seconds clean? Yes: no self-intro; only music-synced image/callout.
3. Muted test? Mostly: visual product proof and app icon remain understandable without sound.
4. Emphasis readable? Yes: existing S01E002 overlay has readable `21 languages` / `Post once` labels.
5. SFX feedback? Not added; embedded music is already the sync driver.
6. Change every 1-3 seconds? Yes: source hard cuts and overlay changes at 10.55, 14.033, 15.400, 16.883, and 19.2.
7. Transitions serve content? Yes: overlays start after hard transitions and clear before the next transition.
8. Subject/overlays fight? Check review export; placements are intentionally upper/center and time-limited.
9. Every remaining segment moves forward? Yes: callout -> gear -> app utility -> brand -> founder -> app icon.
10. Ending? Yes: cuts at 22.55 before blackout; platform caption should carry CTA.

## QC DBX-APP-S02E001_en-US_tiktok_9x16_v001_review.mp4

Verdict: PASS-WITH-NOTES.

Technical checks:

1. Container/codec: PASS — MP4, HEVC Main10 `hvc1`, AAC.
2. Resolution/aspect: PASS — 1080x1920, 9x16.
3. Frame rate: PASS — 60fps, matching the source and manifest.
4. Duration: PASS — 22.55s; trims exactly at `black_start:22.55`.
5. Bitrate: PASS — 10.2 Mbps total, above the 8 Mbps short-vertical floor.
6. Audio: PASS — 48 kHz stereo AAC; integrated loudness `-13.8 LUFS`; true peak `-3.7 dBFS`; LRA 7.1 LU. Audio path untouched by this pass.
7. HDR: PASS-WITH-NOTES — video stream is `yuv420p10le`, `bt2020nc/bt2020/arib-std-b67`; Dolby Vision RPU from the source is not preserved after compositing.

Content checks:

8. Hook timing: PASS — the three X callouts land centred on the measured fingertip with the
   64/136/228 size ramp intact, and the DirtBikeX wordmark holds all of still D. Verified on the
   export: the wordmark box is unchanged from 1.99 through 2.74 (last frame of the still) and is
   gone by 2.7667, so it clears on the cut rather than 0.084s early.
8b. Graphics colour: PASS — X stroke at its own centre reads `(189,53,15)` in the new export
   against `(232,0,0)` in the previous one. The gradient is present instead of crushed to flat
   red, and no layer carries a grade or a reduced alpha.
9. Safe zones: PASS-WITH-NOTES — no subtitle burn; app/icon overlays sit inside frame, but review on phone before final publish.
10. Subtitle sync: N/A — no spoken VO; SRT is a visual beat timing map only.
11. Variant integrity: PASS — en-US visual assets only; no sibling-variant text added.
12. Ending: PASS — no black tail after the app-icon pointing beat; output blackdetect reports no post-trim black segment.
13. Retention cadence: PASS — source hard cuts plus overlay changes at 10.55, 14.033, 15.400, 16.883, and 19.2.
14. Muted test + SFX punctuation: PASS-WITH-NOTES — understandable visually; embedded music drives punctuation, no added SFX.

Residual notes:

- Graphics are converted into the HLG/BT.2020 timeline (`npl=203`, BT.2408 reference white)
  rather than hand-graded, and composite in 10-bit RGB. Still worth a look on an HDR phone
  before posting, but the previous colour damage is measured as fixed, not eyeballed.
- The pre-generated `*-balanced` / `*-soft` / per-size PNGs under `assets/` are dead: the render
  rasterizes from the tracked SVGs instead. They are left on disk because `media/` is gitignored
  and deleting them would be unrecoverable; remove them once this pass is signed off.
- `node tools/validate.mjs` passes with expected warnings: no external URI for local raw media, and no voiceover asset for a no-VO music montage.
