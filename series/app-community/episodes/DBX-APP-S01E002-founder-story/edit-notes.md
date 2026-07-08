# Edit Notes — DBX-APP-S01E002 "founder-story" · en-US

Rough cut assembled programmatically via `kdenlive-build.repl` (cli-anything-kdenlive)
→ `media/DBX-APP-S01E002/founder-story.kdenlive` (portable, relative paths).
Human polishes zoom keyframes + final timing in Kdenlive on Mac, then renders.

Skill followed: `skills/06-kdenlive-editing.md` (+ `skills/05-remotion-graphics.md`).

## v3 revision (current cut) — what changed from v2

- **Enhanced footage**: V1 now uses the face-retouched renders (`Raw/vidE002/*.MP4`,
  already SDR Rec.709 with rotation baked). The **audio still comes from the original
  `.MOV`** — verified frame-synced (identical frame counts, RMS-envelope xcorr lag 0 ms).
  Do **not** re-apply the HDR tone-map to these; they are already SDR.
  Each `.MOV` carries a second, undecodable 4.0 `apac` spatial track — the mux takes
  `[1:a]` (the 48 kHz stereo AAC), never `-map 0:a`.
- **Captions are now ONE continuous track** (`kinetic-captions`, 0–63.8s), driven by
  `caption-map.mjs` → `remotion-props/captions.all.json` (195 words). The six per-beat
  caption overlays are **deleted** — subtitles no longer fade out between beats.
  Word selection is by **width budget**, not word count, so the just-spoken emphasis word
  can never clip out of the bounded panel.
- **Photo reveal** (`photo-reveal`, 9.95–14.15s): `first-ride.jpg` **zooms out** (scale
  1.32→1.00, ease-out cubic) right after "…first ride was **brutal**". The outer **fifth at each
  end** is a blurred, dimmed fill of the same photo — the short-form "blurred letterbox" — and
  the middle three fifths carries it sharp. The sharp band cover-fits, cropping 384 photo rows;
  `objectPositionY: 92` throws 353 of those off the **top**, because the photo's top 30% is empty
  underpass deck. The blurred fill uses `object-fit: fill` (not `cover`) so its horizontal mapping
  matches the sharp band and the subject doesn't slide sideways across the seam.
  It sits on V2 (below the captions) — the captions read **over** the photo.
- **Logo backdrop** (`brand-title` @41.5s): the frame behind the logo is now blurred like
  an ultra-thin material (8px, −14% brightness). A Remotion overlay renders against
  transparency, so `backdrop-filter` is a no-op — the backdrop is **baked** by feeding a
  footage segment (`public/e002/bg-brand.mp4`) into the comp. That makes the overlay
  **opaque**, so it lives on V2, *under* the caption track.
- **No suspense whoosh.** A 2.78s pitched-down whoosh bed under the photo reveal was tried and
  cut: it smeared the line rather than lifting it. The photo entrance is marked by the existing
  0.31s `simple-whoosh-2`, moved from 8.90 → **9.95** so it lands on the cut instead of dead air.
  Music is back at **0.00s, full length, flat 10%** — no `adelay` push-back, no duck.

## Track layout

| Track | Content |
|-------|---------|
| V1 | Enhanced footage `footage/NN_*_sdr.mp4` — carries the narration |
| V2 · Backdrop | `photo-reveal` @9.95 (4.2s) · `brand-title` @41.5 (2.0s) — **opaque, must stay below captions** |
| V3 · Captions | `kinetic-captions` — one clip, 0→63.8s |
| V4 · Overlays | `feature-phones-built-it` @47.5 · `feature-phones-cta` @54.5 · `invite-card` @59.5 · `profile-card` @63.8 |
| A1 · Music | `bgm-vampire-heart.mp3` from 0.0s, full length, flat ~10% under the VO |
| A2 · SFX | see map below |

Cuts are **hard cuts only**. Zoom (punch-in / pull-out) is **not baked** — add it as
Transform keyframes on the V1 clips on the Mac (the `Zoom:` lines below are the intent).

Track order is load-bearing: anything opaque (photo reveal, logo backdrop) goes **below**
the caption track, or it hides the subtitles.

## Footage

The enhanced `.MP4` renders are **already SDR Rec.709** (the enhancer tone-mapped the HLG
and baked the rotation). Import those, not the raw `.MOV`. Re-running the HDR chain on
them double-maps and washes the image out — the same failure E001 shipped with.

## Assembly — en-US (timeline seconds, as built)

Beat boundaries = speech-end trims (`silencedetect -32dB`, cut ≈0.15s after the last
`silence_start`), so the click/pause between takes is gone. Total **65.75s**.

### hook · 0.00–7.90
V1 clip0. Zoom: open mid-push, snap-in on "gets it".
SFX: `hit-1` @6.90. Captions: "Nobody" harsh, "gets it" brand.

### first-ride · 7.90–18.90
V1 clip1. V2: **photo-reveal 9.95–14.15**.
SFX: `simple-whoosh-2` @9.95 (0.31s, on the cut to the photo).
Zoom: escalating push-ins per hardship. Captions: "brutal / 100 / degrees" harsh
("brutal," @9.57 — the photo lands just after it).

### addictive · 18.90–29.80
V1 clip2. Zoom: pull-out on "couldn't stop", punch-in on "addictive".
SFX: `simple-whoosh-1` @25.00. Captions: "crazy / addictive / share" brand.

### problem · 29.80–36.85
V1 clip3. Zoom: near-static, colder.
SFX: `radio-static` @32.80. Captions: "scattered / outdated" harsh.

### built-it · 36.85–52.90
V1 clip4. V2: **brand-title 41.5–43.5** (logo lands on "DirtBikeX" @41.85, on its own
blurred backdrop). V4: `feature-phones-built-it` 47.5–53.5 (language picker →
pull-to-refresh → freeze; holds past "21 languages").
SFX: `simple-whoosh-1` @41.50 (logo) · `shutter` @47.50 (phones pop in).
Captions: "DirtBikeX / bloat / twice / 21 / languages" brand.

### cta · 52.90–65.75
V1 clip5. V4: `feature-phones-cta` 54.5–59.0 (sponsorship, freezes on the rendered embed) ·
`invite-card` 59.5–63.0 (real card, "Instagram people welcome!" patched to
"New riders welcome", centered, 100% opacity, QR scannable) · `profile-card` 63.8–65.8.
Captions **stop at "…description." (@62.35)** — nothing over "My name is Rubio".
SFX: `shutter` @54.50 · `hit-1` @59.50 (invite card).

## Regenerating

`caption-map.mjs` is the sync artifact — it owns per-beat `start` / `trimIn` / `dur` and
the emphasis word lists, scales each SRT's word times by `dur / (srtEnd − trimIn)` (cue
ends overshoot real speech), and **throws** if a word would land past the track end. Run it
before rendering captions; never hand-edit `captions.all.json` or `subtitles/en-US.srt`.

Rebuild the timeline with `tools/kdenlive-run.sh <episode>/kdenlive-build.repl`, run from
inside the media bundle — **never** by piping the repl into `cli-anything-kdenlive`, which
refuses non-TTY stdin, runs nothing, and exits 0, leaving the old `.kdenlive` untouched.
Then run `tools/kdenlive-nativize.py <file> --vertical`: it repoints the root producer at
`maintractor`, adds a numeric `kdenlive:id` to every producer, renames `clipN`→`producerN`,
fixes the 9:16 profile, and validates every `producer=` ref resolves. Kdenlive reports the
raw CLI export as corrupt without it.

## DECIDE (human, on the Mac)
- Add punch-in/pull-out Transform keyframes per the `Zoom:` lines (not baked).
- Balance SFX levels; music is a flat 10% bed with no ducking, so watch the two `hit-1`s.
- `brief.md` still names E001 as this episode's teaser sibling — E001 was deleted (quality).
  Re-point or drop that line before publish.

## Preview
Rough-cut flatten (no zooms):
`media/DBX-APP-S01E002/exports/DBX-APP-S01E002_en-US_tiktok_9x16_v001_review.mp4` — 65.79s.
Review only; the final render happens on the Mac from `founder-story.kdenlive`.

## Retention checklist (fill after final cut)
1. First-frame grab? hook opens on face + "Nobody" — TBD confirm on final.
2–10. TBD after the Mac polish + render.
