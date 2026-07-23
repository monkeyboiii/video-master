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
V2: `orange-X-64-balanced.png`, `orange-X-136-balanced.png`, `orange-X-228-balanced.png`, then `DirtBikeX-500-balanced.png`.
Audio: embedded music in `RAW_001`.
Retention: first-second visual callout; no extra title or self-intro.
SFX: none added.
Notes: callouts are snapped to source hard cuts: orange X at 0.000-0.467, 0.467-1.350, and 1.350-1.983, then the larger DirtBikeX wordmark at 1.983-2.683 so it holds longer while still clearing before the next scene frame. The X PNGs are 58x64, 124x136, and 208x228, making the scale ramp read as tiny, controlled medium, then large as the camera moves closer. Full-frame overlay top-lefts are `(701,1034)`, `(294,1107)`, `(200,1049)`, and `(550,1350)`; the first X moved up 2px, the second up 5px, and the third down 5px in this pass. `*-balanced` assets keep more orange than the pale soft pass while reducing the harsh SDR-on-HDR contrast from the original SVG render.

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
Overlay grade: `contrast=0.86`, `saturation=0.82`, `brightness=-0.006`, `alpha=0.86` before compositing into the HLG timeline.

### second-walk-logo · 14.033-16.883

V1: `SEL_004` from `RAW_001`.
V2: `DirtBikeX-560-balanced.png` from 14.033-15.400, then `DirtBikeX-460-balanced.png` from 15.400-16.883; both derived from the provided `DirtBikeX.svg`.
Audio: embedded music.
Retention: brand lock-in replaces the removed poster card and clears exactly at the arms-crossed cut.
SFX: none added.
Notes: split placement follows the close/chromatic walk state and the later wider zoom state instead of holding one static wordmark through both. The `*-balanced` assets reduce harsh SDR-on-HDR contrast while retaining stronger brand color than the pale soft pass.

### rubio-profile · 16.883-19.200

V1: `SEL_005` from `RAW_001`.
V2: `DBX-APP-S02E001_en-US_9x16_profile-card_v001.mov`, copied from S01E002.
Audio: embedded music.
Retention: Rubio identity appears on the strongest static pose, then fades through the transition blur.
SFX: none added.
Notes: overlay stays solid through the crossed-arm pose and starts fading at 18.800 when the source transition blur begins. Alpha fade runs from 18.800-19.200. Overlay grade before fade: `contrast=0.94`, `saturation=0.92`, `brightness=-0.006`, `alpha=0.96`.

### app-icon-point · 19.200-22.550

V1: `SEL_006` from `RAW_001`.
V2: `AppIcon-ios-card-balanced.png`, derived from provided `AppIcon.png` with rounded iOS-style corners, drop shadow, and mild SDR-overlay grade.
Audio: embedded music, trimmed to 22.55s.
Retention: final app-logo payoff; no dead black tail.
SFX: none added.
Notes: icon uses a fixed-position alpha fade from 19.200-19.650 with no x/y movement. Final full-frame top-left is `(610,720)`, nudged lower/right so the fingertip points more directly at the icon.

## Render Notes

`render-review.sh` is the source of truth for the deterministic ffmpeg flatten.

The source is HEVC Main10 HLG/BT.2020 with Dolby Vision profile 8 side data. The review render now preserves the HDR delivery path as HEVC Main10 (`hvc1`), `yuv420p10le`, BT.2020 non-constant luminance matrix, and HLG transfer (`arib-std-b67`). The compositor does not carry Dolby Vision RPU side data through the re-encode, so the exported review should be treated as HLG HDR rather than Dolby Vision.

The asset overlays are SDR/Rec.709 graphics laid over HLG footage. Direct compositing made them read too contrasty in HDR; this pass keeps the video HDR and grades the overlay layers down before compositing instead of converting the whole render to SDR.

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
5. Bitrate: PASS — 10.8 Mbps total, above the 8 Mbps short-vertical floor.
6. Audio: PASS — 48 kHz stereo AAC; integrated loudness `-13.8 LUFS`; true peak `-3.6 dBFS`.
7. HDR: PASS-WITH-NOTES — video stream is `yuv420p10le`, `bt2020nc/bt2020/arib-std-b67`; Dolby Vision RPU from the source is not preserved after compositing.

Content checks:

8. Hook timing: PASS — balanced fingertip X callouts appear in the opening second with a drastic size ramp, and the fourth still uses a balanced DirtBikeX wordmark.
9. Safe zones: PASS-WITH-NOTES — no subtitle burn; app/icon overlays sit inside frame, but review on phone before final publish.
10. Subtitle sync: N/A — no spoken VO; SRT is a visual beat timing map only.
11. Variant integrity: PASS — en-US visual assets only; no sibling-variant text added.
12. Ending: PASS — no black tail after the app-icon pointing beat; output blackdetect reports no post-trim black segment.
13. Retention cadence: PASS — source hard cuts plus overlay changes at 10.55, 14.033, 15.400, 16.883, and 19.2.
14. Muted test + SFX punctuation: PASS-WITH-NOTES — understandable visually; embedded music drives punctuation, no added SFX.

Residual notes:

- Generated PNG overlays are SDR graphics composited into an HLG render. The final stream stays HDR-tagged, but the static app/brand assets should be checked on an HDR phone before posting.
- `node tools/validate.mjs` passes with expected warnings: no external URI for local raw media, and no voiceover asset for a no-VO music montage.
