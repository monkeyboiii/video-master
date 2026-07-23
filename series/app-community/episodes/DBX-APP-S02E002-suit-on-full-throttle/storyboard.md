# Storyboard & Shot Plan — DBX-APP-S02E002

Source is already shot and music-synced (`media/DBX-APP-S02E002/footage/01_synced.MP4`). Like
S02E001 this storyboard records an overlay touch-up plan against an existing timeline, not a
shooting plan.

## Source facts

| | |
|---|---|
| Resolution / fps | 1440x2560, **30fps** (S02E001 was 60fps) |
| Colour | `yuv420p10le`, bt2020nc / bt2020 / arib-std-b67 (HLG), tv range |
| Duration | 27.133s (814 frames) |
| Audio | AAC **44.1kHz** stereo (S02E001 was 48kHz — resample on delivery) |
| Black tail | none; the clip runs to the last frame |

The source already carries burned-in captions — `Pov: without the suit`, `Now with the suit!`,
`Compiled!`, `Zenkai! Full throttle!`. **No added overlay may collide with them.**

## Measured timeline

Hard cuts (`scdet`, frame-exact at 30fps):

```
5.433  6.767  8.200  9.433  10.867  13.567
14.567  14.833  15.067  15.267  15.467  15.767  16.067   <- stutter burst
16.733  17.567
```

Nothing after 17.567 is a hard cut. The back half is one continuous take joined by **whip
blurs** (~21.95 and ~22.05), so every overlay there is timed to an **action**, not a cut. Action
beats measured frame-by-frame:

| Time | Action |
|------:|--------|
| 15.767 | arm starts pushing forward toward camera |
| 16.733 | cut to the big open-palm close-up |
| 17.567 | cut to the white-outlined ("sticker") rider |
| 17.67-17.95 | points **top-left** (peak 17.75) |
| 18.35-18.65 | points **top-right** (peak 18.45) |
| 19.15-19.35 | points **bottom-left** (peak 19.25) |
| 19.72-19.92 | points **bottom-right** (peak 19.85) |
| 20.00-20.50 | arms spread wide — not a point; no mark |
| 20.567 | **clap impact** — hands meet (frame 617; held to f625, part at f627/20.900) |
| 21.05-21.30 | hands part — pan-out **step 1** |
| 21.35-21.85 | arms open wide — pan-out **step 2** |
| ~21.95 | whip blur out of the sticker clip |
| 22.05-25.40 | fists to camera, `Zenkai! Full throttle!` |
| 26.30 | **hands come down**; rider settles, holds to 27.133 |

## Shot-by-shot breakdown

| SH | Beat | Frame / composition | Action | Transition in | Caption / overlay | SFX intent | Camera token |
|----|------|---------------------|--------|---------------|-------------------|------------|--------------|
| SH010 | pov-without-suit | over-shoulder / top-down at the desk | hands typing in ordinary clothes; the premise lands | opens cold | none added (source caption `Pov: without the suit`) | embedded music only | synced |
| SH020 | pov-with-suit | same desk, same framing | identical work, now in full MX kit; `Compiled!` beat ~9.4 | hard cut @5.433 | none added (source caption `Now with the suit!`) | embedded music only | synced |
| SH030 | suit-up-rush | stutter montage, standing up | rapid 0.2-0.3s cuts building to the push | hard cut @13.567 | none added — let the stutter breathe | embedded music only | synced |
| SH040 | palm-push-trace | mid shot, arm extending to camera | **orange X rides the hand** and settles in the open palm; re-anchored across the 16.067 cut | hard cut @15.767 | orange-X (tracked) | embedded music only | synced |
| SH050 | palm-zoom-x | extreme close-up, palm fills frame | same X, **scaled proportionally** to the palm and held on it | hard cut @16.733 | orange-X (large) | embedded music only | synced |
| SH060 | corner-callouts | full body, white outline, desk behind | four orange Xs land **sequentially**, one per frame corner, each on the gesture that points at it; they accumulate and all clear on the clap | hard cut @17.567 | orange-X x4 | embedded music only | synced |
| SH070 | clap-logo-expand | full body, white outline | on the clap the DirtBikeX logo **presents small**, then **expands** in two steps locked to the hands opening | continuous; action-timed @20.60 | DirtBikeX wordmark (2-step scale) | embedded music only | synced |
| SH080 | full-throttle-fists | fists pushed to camera | no added overlay; the source caption owns this beat | whip blur @~21.95 | none added (source caption `Zenkai! Full throttle!`) | embedded music only | synced |
| SH080b | brand-lockup (early wordmark) | fists to camera | DirtBikeX wordmark comes in **early**, on the fist beat, so it is established before the pose settles | action-timed @25.60 | DirtBikeX wordmark | embedded music only | synced |
| SH090 | brand-lockup | centred bust, helmet crown at y≈710 | hands drop; wordmark settles **above the helmet**, Rubio profile card joins it | action-timed @26.30 | DirtBikeX wordmark + profile-card | embedded music only | synced |

## Overlay mechanics (new vs S02E001)

S02E001's props were static stamps because every opening segment was a frozen still. **This
episode is not.** Two beats need motion:

- **SH040 palm-push-trace** — the hand moves within the shot *and* jumps at the 16.067 cut. The X
  needs per-shot anchors with interpolation between them, re-anchored at the cut. Plan: sample the
  palm centre every 2-3 frames, keyframe `overlay` x/y, and hold the X's size constant within the
  shot.
- **SH050 palm-zoom-x** — the palm is much larger here, so the X scales with it. Its size is set
  from the measured palm width so the X reads as the *same mark* that just got closer, not a new
  bigger mark.

Everything else stays as stamps with action-timed in/out points.

Carry over from S02E001, unchanged and non-negotiable:

- Graphics are sRGB, the timeline is HLG/BT.2020 — convert with `npl=203`, never grade. Composite
  in 10-bit RGB. See `skills/08-audio-render-qc.md`.
- Rasterize from the tracked SVGs at the exact size needed; no pre-generated PNG variants.
- Every prop clears **with** its cut or its gesture, never a beat early.

## Resolved decisions

- **Four corners, confirmed.** A 0.1s sweep of 17.60-20.60 (then 0.05s on the fourth) resolves
  all four. Read from the arm/hand vector in each peak frame:

  | # | Hold | Peak | Corner | X anchor (1080x1920, to verify at build) |
  |---|------|------|--------|------------------------------------------|
  | 1 | 17.67-17.95 | 17.75 | top-left | centre ~(200, 430) |
  | 2 | 18.35-18.65 | 18.45 | top-right | centre ~(880, 430) |
  | 3 | 19.15-19.35 | 19.25 | bottom-left | centre ~(200, 1490) |
  | 4 | 19.72-19.92 | 19.85 | bottom-right | centre ~(880, 1490) |

  Order is TL -> TR -> BL -> BR at ~0.70 / ~0.80 / ~0.60s spacing. All four Xs are the **same
  size** (peers, not a ramp) — 164x180 proposed. Each enters on its own gesture and **holds**, so
  the four accumulate and frame the rider, then all clear together on the clap at 20.60. (Flip to
  enter-and-clear-per-gesture if the accumulation reads busy on the phone.) The 20.00-20.50
  arms-spread is a dance pose, not a point — no mark.

- **The brand formation is pinned to the clap.** The four marks merge at **20.567**, the frame
  where the hands actually meet — not at the end of the clap gesture. A first pass merged at
  21.050 and read half a second behind the beat. The collapse runs 20.220-20.567 (0.35s, tightened
  to suit the impact); the expand stays at 21.350 where it already matched the second hand sweep.

- **Finale starts early.** The DirtBikeX wordmark now enters on the fist beat at **25.60** rather
  than waiting for 26.30, so the brand is established before the pose settles and the 0.83s tail
  is no longer carrying two elements from cold. The Rubio profile card still joins at **26.30**
  when the hands come down, and both hold to 27.133.

- **Profile card is rebuilt, not copied.** Use the S01 style: the Remotion `profile-card`
  composition (`packages/remotion-graphics/src/components/ProfileCard.tsx`) driven by
  `remotion-props/profile-card.json` — the same `{durationSec, src, handle}` shape S01E003 used.
  `packages/remotion-graphics/public/e002/rubio-profile.jpg` survived the media clean (it sits in
  the one tracked `public/e002/` exception), so the card can be re-rendered from source rather
  than salvaged from S02E001's flattened MOV.

## Post-shoot

- [x] Source copied into episode media bundle as `01_synced.MP4`.
- [x] `orange-X.svg` and `DirtBikeX.svg` copied into `media/DBX-APP-S02E002/assets/`.
- [x] Hard cuts and action beats measured and recorded above.
- [x] Corner count locked at four, with holds and peaks measured.
- [x] Corner X anchors verified on the export; marks enlarged to 240px with a dark halo (a white edge would compete with the rider's own sticker border).
- [x] `remotion-props/profile-card.json` written and the card rendered (2.8s, so its `exitFade` never reaches the 0.83s visible window).
- [x] Palm sampled for SH040/SH050. The hand is motion-blurred until ~16.28, so the mark now
  *pops in place* on the palm rather than tracking the blurred swing.
- [x] Animated props moved to Remotion (`BrandForm`, `MarkPop`): four marks collapse to the clap
  point and become the logo's X, with anticipation, stagger, motion trails, an impact bloom and
  seeded sparks. The lockup hands off anchored on its X, then recentres as it expands so the
  finished wordmark sits centred rather than hung off the X.
