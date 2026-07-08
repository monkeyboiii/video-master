# Edit Notes — DBX-APP-S01E003 "track-owners" · en-US

Rough cut assembled programmatically via `kdenlive-build.repl` (cli-anything-kdenlive)
→ `media/DBX-APP-S01E003/track-owners.kdenlive`, then made Kdenlive-native with
`python3 tools/kdenlive-nativize.py <file> --vertical`. Human adds zoom keyframes and
renders on the Mac.

## Track layout

| Track | Content |
|-------|---------|
| V1 | Tone-mapped footage `footage/NN_*_sdr.mp4` (HLG→SDR Rec.709). Carries the VO. |
| V2 | **One continuous** caption overlay (`kinetic-captions`, 0–53.61s) |
| V3 | `brand-title` @18.05 · `side-screen` ×3 (flair / create / rsvp) · `profile-card` @47.80 |
| A1 | `bgm-vampire-heart.mp3` at ~10% under VO |
| A2 | SFX — shutter on each screen entrance, plus two soft accents |

Hard cuts only, everywhere — including *inside* the screen recordings (pure cutting out).
Zoom (punch-in/out) is **not baked**; add it as Transform keyframes on V1 on the Mac.

## HDR + pause cropping

All 6 narration clips are HLG HDR with a −90° display matrix. Each was tone-mapped to SDR
Rec.709 and cut at its **speech end** (silencedetect); `02_why` and `03_flair` also had a
head pause trimmed. Never import the raw `.MOV` into the timeline.

| Beat | Source in→out | Timeline | Len |
|---|---|---|---|
| hook | 0 → 15.48 | 0.00 | 15.48 |
| why | 0.21 → 7.76 | 15.48 | 7.55 |
| flair | 0.35 → 6.27 | 23.03 | 5.92 |
| create | 0 → 5.06 | 28.95 | 5.06 |
| rsvp | 0 → 7.97 | 34.01 | 7.97 |
| cta | 0 → 11.63 | 41.98 | 11.63 |

Total **53.61s**.

## Captions — continuous, not per-beat

A single `kinetic-captions` overlay spans the whole 53.61s with **globally timed** words, so
the rolling window carries words across every cut and subtitles never fade out mid-video.
Word times are scaled per beat by `dur / (srtEnd − trimIn)` because the SRT cue-ends overshoot
the real speech — unscaled, the last words fall past the end. `caption-map.mjs` throws if any
word overflows, and also emits the combined `subtitles/en-US.srt`.

The caption panel is a fixed-width box, so words are picked by a **width budget**, not a word
count — QC caught the fixed window clipping the just-spoken emphasis words (`DirtBikeX.`,
`reminded`) at the panel edges. `window` is now only an upper bound.

`DECIDE:` if the continuous track reads worse than expected, fall back to per-beat overlays
(the E002 strategy).

## Screen recordings — chop spec (pure cuts, muted)

Reproduce with `screen-chop.sh`. Each output is cut to exactly its narration line's length,
and every boundary lands on a settled frame.

| Source | Kept | Result | Removed |
|---|---|---|---|
| `07_screen-flair.mov` 8.60s | `[0–2.40] [3.85–6.25] [7.45–8.57]` | 5.92s | Edit-Profile dwell/scroll, save-dim |
| `08_screen-create.mov` 58.45s | `[1.50–2.75] [21.60–22.85] [36.60–38.61] [42.60–43.15]` | 5.06s | name typing, location typing, RSVP/max fiddling, reminders detour, compose; **~8.5s of the "Setting up the editor…" wait** — a **0.55s glimpse kept** so the event visibly gets created |
| `09_screen-rsvp.mp4` 15.63s | `[0–4.30] [7.70–8.85] [10.30–11.50] [12.25–13.57]` | 7.97s | **~3.4s map spinner**; sheet shortened so the **Going ✓** payoff holds ~1.3s |

## Screen placement

Founder holds frame-right; blank wall at frame-left. Framing differs per clip (`05_rsvp` is
tightest: hair reaches x≈445, helmet top y≈985). One box, measured against the tightest clip
and used for all three so placement stays consistent:

```
x 24 · y 96 · w 391 · h 852     (aspect 0.459 vs recordings 0.462 → fills, no visible stretch)
```

Verified over all three feature clips: never touches his face.
`DECIDE:` could be maximized per-clip (bigger on `03_flair`) at the cost of size jumping
between features.

## Assembly plan — en-US

### hook 0.00–15.48
V1 SEL_001 · V2 captions. **SFX** soft hit @2.90 ("discover"). **Zoom** slow punch-in.
Captions: `never` / `discover` harsh red.

### why 15.48–23.03
V1 SEL_002 · V3 `brand-title` @18.05 (2.0s) — lands on the word "DirtBikeX" *(reused from E002)*.
**SFX** soft whoosh @18.05.

### flair 23.03–28.95
V1 SEL_003 · V3 `side-screen-flair` (full beat). **SFX** **shutter @23.03**.

### create 28.95–34.01
V1 SEL_004 · V3 `side-screen-create` (full beat) — "Every other Wednesday" holds while he
says "reoccurring" (overlay t=4.22), then a 0.55s "Setting up the editor…" glimpse lands on
"events.". **SFX** **shutter @28.95**.

### rsvp 34.01–41.98
V1 SEL_005 · V3 `side-screen-rsvp` (full beat). **SFX** **shutter @34.01**.

### cta 41.98–53.61
V1 SEL_006 · V3 `profile-card` @47.80 (2.8s) — clears at 50.60 **before** "comment / OWNER"
so the CTA words stay readable *(reused from E002)*. **SFX** soft hit @47.80.

## Audio
VO from the clips. Music ~10% under. SFX all short/low-impact:
hit @2.90 · whoosh @18.05 · **shutter @23.03, @28.95, @34.01** · hit @47.80.

## DECIDE (human, on the Mac)
- Add punch-in/pull-out Transform keyframes per the `Zoom:` intents (not baked).
- No `invite-card` this episode — the CTA is "comment OWNER", not a QR.
- Music/SFX levels: confirm the shutter sits right at each screen entrance.

## Preview
Rough-cut flatten (no zooms):
`media/DBX-APP-S01E003/exports/DBX-APP-S01E003_en-US_tiktok_9x16_v001_review.mp4`
Review only — the final render happens on the Mac from `track-owners.kdenlive`.

## Retention checklist (fill after final cut)
1–10. TBD after the Mac polish + render.
