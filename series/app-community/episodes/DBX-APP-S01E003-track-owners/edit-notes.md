# Edit Notes — DBX-APP-S01E003 "track-owners" · en-US

Rough cut assembled programmatically via `kdenlive-build.repl` (cli-anything-kdenlive)
→ `media/DBX-APP-S01E003/track-owners.kdenlive`, then made Kdenlive-native with
`python3 tools/kdenlive-nativize.py <file> --vertical`. Human adds zoom keyframes and
renders on the Mac.

## Track layout

| Track | Content |
|-------|---------|
| V1 · Footage | Enhanced footage `footage/NN_*_sdr.mp4` — carries the narration |
| V2 · Backdrop | `brand-title` @18.05 (2.0s) — transparent logo; V1 is blurred behind it (Route B) |
| V3 · Captions | **One continuous** caption overlay (`kinetic-captions`, 0–53.61s) |
| V4 · Overlays | `side-screen` ×3 (flair / create / rsvp) · `profile-card` @47.80 |
| A1 · Music | `bgm-vampire-heart.mp3` from 0.0s, full length, flat ~10% under the VO |
| A2 · SFX | shutter on each screen entrance, plus two soft accents |

Hard cuts only, everywhere — including *inside* the screen recordings (pure cutting out).
Zoom (punch-in/out) is **not baked**; add it as Transform keyframes on V1 on the Mac.

Track order is load-bearing: the captions must stay on top. `brand-title` is a **transparent**
logo — the softness behind it comes from blurring V1, not from a baked backdrop (Route B, see
below), so it can sit below the caption track without hiding anything.

## Footage — enhanced renders, original audio

V1 uses the face-retouched renders (`Raw/vid003/*.MP4`), which are **already SDR Rec.709**
with the −90° rotation baked in. Do **not** re-run the HDR tone-map on them — double-mapping
washes the image out (the bug E001 shipped with). Audio still comes from the original
`.MOV`: verified frame-synced (identical frame counts, RMS-envelope xcorr lag 0 ms).

Each `.MOV` carries a second, undecodable 4.0 `apac` spatial track alongside the 48 kHz
stereo AAC. Take `[1:a]` explicitly — ffmpeg's auto-select / `-map 0:a` can grab the spatial
one and fail. Clips were then cut at their **speech end** (silencedetect); `02_why` and
`03_flair` also had a head pause trimmed.

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
| `07_screen-flair.mov` 8.60s | `[2.35–4.95]` + still@4.90 0.90s + `[5.18–6.18]` + still@8.58 1.45s | 5.97s | head dwell, **the whole save** (spinner 6.22–7.45, "Saved" toast 7.5–8.0), the push transition |
| `08_screen-create.mov` 58.45s | `[1.55–3.00] [21.60–23.02] [36.95–38.70] [40.05–40.80] [42.45–43.35] [50.72–52.40]` | **7.95s** | name typing, location typing, RSVP/max fiddling, reminders detour, compose; **~7.6s of the "Setting up the editor…" wait** |
| `09_screen-rsvp.mp4` 15.63s | `[0.30–1.85] [7.85–9.05] [13.40–14.60]` + 1.11s freeze | **5.10s** | **~2.8s map spinner** (map paints at 7.8); the recurring-event **action sheet** (9.9–11.9) |

### Two of the three screens hold on their payoff
`flair` and `rsvp` were re-cut after review: the old versions had too many, too-short segments
and no markers, so nothing registered. Both now use **few, long takes ending on a held frame**.

`flair` (5.92s slot): Edit Profile → scroll → the Flair menu opens (**Track Stewards** boxed) →
**0.90s still of the open menu**, because the menu is only opaque and stable for 0.60s of real
footage → flair now reads "Track Stewards", Save lit → hard cut past the entire save → **1.45s
still of the profile tab**, the **avatar and its new badge** boxed. The save (spinner, dim,
"Saved: Account" toast) is gone: the flair is chosen, then it is simply worn.

`rsvp` (5.06s slot): Events tab (**event card** boxed — that's the tap) → event detail with the
**map** boxed (the map only paints at src 7.8; the spinner is dropped) → **Going ✓** boxed →
1.11s freeze. The recurring-event action sheet is dropped entirely — with 5.06s, showing it
would starve the payoff.

Both stills are grabbed frames, not `tpad`, because the frame worth holding is not the last
frame of the preceding segment. **Watch the filter order**: `setpts` drops the frame-rate hint,
so a following `tpad` reads `stop_duration` against a bogus rate (1.11s became 2 frames) and
libx264 quietly writes 25 fps. Re-assert `fps=30` after `setpts`.

### The create sequence tells a whole story
The narration promises event creation, so the overlay now shows it end to end — set the
values, tap Next, watch the editor load, then **freeze on the created event long enough to
read it**. Overlay-relative: `A 0–1.45` form · `B 1.45–2.87` date + location ·
`C 2.87–4.62` Recurrence "Every other Wednesday" (lands under "reoccurring" @4.22) ·
`D 4.62–5.37` Next, tapped @5.12 · `E 5.37–6.27` loading spinner (0.90s — felt, not endured) ·
`F 6.27–7.95` the finished event card, **held 1.68s**.

Because those cuts jump the UI around, `side-screen.create.json` overlays **orange tap
markers** (breathing outline + glow, snap-in over 5 frames) on the Recurrence row and on the
Next button, so the viewer can see *what got tapped*. All three screens now carry markers;
they are `%`-relative to the screen box, so they survive any re-placement.

`rsvp` gave its budget to `create`: it now ends at 41.96, inside its own beat. It has to —
see Screen placement.

## Screen placement

Founder holds frame-right; blank wall at frame-left. Framing differs per clip (`05_rsvp` is
tightest: hair reaches x≈445, helmet top y≈985). One box, measured against the tightest clip
and used for all three so placement stays consistent:

```
x 24 · y 96 · w 391 · h 852     (aspect 0.459 vs recordings 0.462 → fills, no visible stretch)
```

Verified over all three feature clips: never touches his face.

**The box is only valid on the clips it was measured against.** Extending an overlay into a
neighbouring beat is not free — drawn on `06_cta`, this same box lands on his hair and
forehead. That is why `side-screen-rsvp` is trimmed to end at 41.96s rather than running on
for continuity.

`DECIDE:` could be maximized per-clip (bigger on `03_flair`) at the cost of size jumping
between features.

## Assembly plan — en-US

### hook 0.00–15.48
V1 clip0 · captions. **SFX** soft hit @2.90 ("discover"). **Zoom** slow punch-in.
Captions: `never` / `discover` harsh red.

### why 15.48–23.03
V1 clip1 · V2 `brand-title` @18.05 (2.0s) — lands on the word "DirtBikeX" @18.05. **Route B**:
V1 is **blurred** (no dim) across 18.05–20.05 with a 0.35s fade in/out, so the logo sits on the
real, softened footage rather than a separately-extracted backdrop clip that never quite matched
it *(comp reused from E002)*. **SFX** soft whoosh @18.05.

### flair 23.03–28.95
V1 clip2 · V4 `side-screen-flair` (full beat) — markers on the **Track Stewards** option and
then on the **avatar** wearing the new flair. **SFX** **shutter @23.03**.

### create 28.95–36.90
V1 clip3 · V4 `side-screen-create` **7.95s** — overruns its narration beat by 2.89s and
finishes over `rsvp`, which is what buys the held final result. **SFX** **shutter @28.95**.

### rsvp 36.90–41.96
V1 clip4 · V4 `side-screen-rsvp` **5.06s** — starts at 36.90 so the Events tab appears
exactly as he says "**Events** tab," (@37.20). Markers on the event card, the **map**, and the
**Going ✓** pill. **SFX** **shutter @36.90**.

### cta 41.98–53.61
V1 clip5 · V4 `profile-card` @47.80 (2.8s) — clears at 50.60 **before** "comment / OWNER"
so the CTA words stay readable *(reused from E002)*. **SFX** soft hit @47.80.

## Audio
VO from the clips. Music runs the whole video from **0.00s** at a flat ~10% under the VO —
no `adelay` push-back, no ducking. SFX all short/low-impact, no deep hits:
hit @2.90 · whoosh @18.05 · **shutter @23.03, @28.95, @36.90** · hit @47.80.

**No suspense whoosh.** A 2.78s pitched-down whoosh bed was tried under the hook→logo turn and
cut: it smeared the line instead of lifting it.

## Regenerating

Rebuild the timeline with `tools/kdenlive-run.sh <episode>/kdenlive-build.repl`, run from
inside the media bundle — **never** by piping the repl into `cli-anything-kdenlive`, which
refuses non-TTY stdin, runs nothing, and exits 0, leaving the old `.kdenlive` untouched.
Then run `tools/kdenlive-nativize.py <file> --vertical`: it repoints the root producer at
`maintractor`, adds a numeric `kdenlive:id` to every producer, renames `clipN`→`producerN`,
fixes the 9:16 profile, and validates every `producer=` ref resolves. Kdenlive reports the
raw CLI export as corrupt without it.

Screen chops come from `screen-chop.sh`; caption timing from `caption-map.mjs`. Never hand-edit
`captions.all.json`, `subtitles/en-US.srt`, or the chopped `screens/*.mp4`.

## DECIDE (human, on the Mac)
- Add punch-in/pull-out Transform keyframes per the `Zoom:` intents (not baked).
- No `invite-card` this episode — the CTA is "comment OWNER", not a QR.
- Music/SFX levels: confirm the shutter sits right at each screen entrance. Music is a flat
  10% bed with no ducking.
- **Route B blur is baked only in the preview, not the .kdenlive.** On the Mac, add a **Blur**
  (no brightness change) to the V1 clip across **18.05–20.05**, keyframed to fade in/out over
  ~0.35s. `brand-title` is transparent, so without it the footage behind the logo stays sharp.

## Preview
Rough-cut flatten (no zooms):
`media/DBX-APP-S01E003/exports/DBX-APP-S01E003_en-US_tiktok_9x16_v001_review.mp4`
Review only — the final render happens on the Mac from `track-owners.kdenlive`.

## Retention checklist (fill after final cut)
1–10. TBD after the Mac polish + render.
