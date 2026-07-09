# Edit Notes — DBX-APP-S01E004 "sponsorship-passes" · en-US

Rough cut assembled programmatically via `kdenlive-build.repl`
→ `media/DBX-APP-S01E004/sponsorship-passes.kdenlive`, then made Kdenlive-native with
`tools/kdenlive-nativize.py <file> --vertical`. Human adds zoom keyframes and renders on the Mac.

Skills followed: `skills/04-storyboard.md`, `skills/05-remotion-graphics.md`,
`skills/06-kdenlive-editing.md`.

## Track layout

| Track | Content |
|-------|---------|
| V1 | Tone-mapped footage `footage/NN_*_sdr.mp4` — carries the narration |
| V2 · Overlays | `brand-drop` @6.80 · seven top-left `side-screen` cards · `profile-card` @61.20 |
| V3 · Captions | `kinetic-captions` — one clip, 0→66.25s |
| A1 · Music | `bgm-vampire-heart.mp3` from 0.00s, full length, flat ~10% under the VO |
| A2 · SFX | see map below |

Hard cuts only between shots. Overlays *ease* in (SideScreen slides from the left; BrandDrop
surfaces from the top). Zoom is **not baked** — Transform keyframes on the Mac.

## Footage

All 10 clips are **HLG HDR** (`arib-std-b67` / `bt2020`), coded 1920×1080 with a `-90` rotation
matrix — ffmpeg autorotates them to 1080×1920 on decode. Each is tone-mapped to SDR Rec.709
before edit (`footage-process.sh`); importing the raw `.MOV` reproduces E001's pale look.

Each `.MOV` carries a second, undecodable 4.0 `apac` spatial audio track. `-map 0:a:0` takes the
48 kHz stereo AAC narration. Never `-map 0:a`.

**This cut uses the original `.MOV` for both video and audio.** Face-enhanced renders are
expected later; when they land, swap the **video only** and keep this audio — verify frame-sync
first (frame counts + RMS-envelope cross-correlation), as on E002/E003.

## Pause cropping — both edges

`silencedetect=noise=-32dB:d=0.30`. Trailing cut = last `silence_start` + 0.15s. Head trim only
where the clip opens with >0.25s of silence (05, 06, 09 — 05 also opens on a lip-smack blip).

| Beat | Source in→out | Timeline | Len |
|---|---|---|---|
| hook | 0 → 9.79 | 0.00 | 9.79 |
| hate-ads | 0 → 4.88 | 9.79 | 4.88 |
| billboard | 0 → 4.94 | 14.67 | 4.94 |
| passes | 0 → 5.84 | 19.61 | 5.84 |
| sponsorship | 0.83 → 8.47 | 25.45 | 7.64 |
| discovery | 0.44 → 5.69 | 33.09 | 5.25 |
| splash | 0 → 6.19 | 38.34 | 6.19 |
| capped | 0 → 6.08 | 44.53 | 6.08 |
| stats | 0.29 → 6.49 | 50.61 | 6.20 |
| cta | 0 → 9.44 | 56.81 | 9.44 |

Total **66.25s**. Keep this table, `footage-process.sh` and `caption-map.mjs`'s `BEATS` in
lockstep — they are three copies of the same numbers.

## Captions — anchored to real speech, not to the SRT clock

E002/E003 scaled each beat's SRT times by `dur / srtEnd`. That works when a beat is one cue with
no pauses. E004's beats run up to three sentences with ~1s breaths, and the global scale drags
the later sentences **early** — it put "DirtBikeX" at 5.76s when he says it at **7.33s**.

So `caption-map.mjs` anchors words to the measured **speech runs**. For each beat it splits the
runs into as many groups as the beat has SRT cues, cutting at the **largest inter-run gaps** (the
real sentence boundaries) and treating smaller gaps as breaths. Each cue's words spread uniformly
over its group's *speech* time, skipping silences. A word can never land in a pause, and each
sentence starts when it is actually spoken. Verified: beat 1's three sentences begin at 0.00 /
3.44 / 6.83, matching `silencedetect` exactly.

232 words, 66.25s, 16 SRT cues. Never hand-edit `captions.all.json` or `subtitles/en-US.srt`.

## The two overlay conventions

### 1 · The logo never takes the screen (`brand-drop`, 6.80–11.80)

A **standalone** transparent overlay — no full-screen brand card, no Route-B blur behind it.
The wordmark **surfaces through the top edge**, settles at **7.33s exactly on the word
"DirtBikeX"**, holds 1.2s, then **flies to the top-trailing (right) corner** over 0.8s, shrinking
and cross-fading from the wordmark into the bare mark. It sits there as an icon for 1.8s and
fades out over 0.65s — ~2s into the next beat. The corner rest honours the platform safe zone
(top 150, right 145).

### 2 · Screen recordings live in the TOP-LEFT corner (`side-screen`, box **x24 y150 w268 h580**)

The founder deliberately holds frame-right, reserving the upper-left. **The box was measured
against the five feature clips only** (05, 06, 07, 08, 09) — not the CTA clip, which has no
overlay and would have shrunk it needlessly. `06_discovery` is the tightest: his fringe reaches
**x≈312** at t≈4.74, so the card's right edge stops at **292** (~20px margin). Bottom edge 730 is
well above the helmet. The box aspect (0.462) matches the recordings, so `objectFit: fill`
introduces no distortion.

**It is a small card**, so every chop (`screen-chop.sh`) keeps few, long, settled segments,
**freeze-extends its payoff**, and carries an orange marker on the element the narration names.
The status bar (with the red recording pill) is cropped off; width is trimmed symmetrically to
preserve the aspect.

`rough.md` is the instruction sheet — its `[SCREEN: …]` directives map 1:1 onto the seven
recordings. No privacy blurs: every account on screen (`@rubio` / Zenkai Rubio, `@dbx`) is the
founder's own.

## Assembly — en-US (timeline seconds, as built)

### hook · 0.00–9.79
V1 clip0. **`brand-drop` 6.80–11.80.** SFX `hit-1` @2.25 ("hate ads") · `simple-whoosh-2` @6.80
(the logo surfaces). Captions: "slots" brand, "hate"/"ads." harsh, "DirtBikeX" brand @7.33.

### hate-ads · 9.79–14.67
V1 clip1. The logo icon is still in the corner, fading out at 11.80. No other overlay.

### billboard · 14.67–19.61
V1 clip2. SFX `radio-adjustment` @19.19 ("billboard."). Near-static, colder.

### passes · 19.61–25.45
V1 clip3. The pivot — deliberately **no UI**, so the idea lands before the product appears.

### sponsorship · 25.45–33.09
V1 clip4 · **`side-screen-sponsorship` 25.45–33.05** (7.60s). Four states: the Sponsorships page
(marker on "Your spot +") → the calendar with the start day → the duration menu → the final pass.
SFX `shutter` @25.45.
*Known cosmetic artifact:* the segments are ordered to match the **narration**, not the source
clock, so the price reads $14.99 → $39.99 → $14.99. Illegible at card scale; word-sync wins.

### discovery · 33.09–38.34
V1 clip5 · **three cards fan out in sequence**, one per placement:
`search` 33.15–34.85 · `chat` 34.90–36.60 · `filter` 36.65–38.31. Each shows only its *payoff*
(the sponsored profile in that surface) and holds; the taps that lead there are cut, and a marker
points at the result. SFX `shutter` on each entrance.

### splash · 38.34–44.53
V1 clip6 · **`side-screen-splash` 38.50–44.45**. pause → tap (marker on the avatar) → profile,
with the profile held 1.15s. SFX `shutter` @38.50 · `hit-1` @44.15 ("profile.").

### capped · 44.53–50.61
V1 clip7 · **`side-screen-capped` 44.70–50.50**. Availability caps (marker on Pass 1/40) →
"Currently rotating", held 2.12s. SFX `shutter` @44.70.

### stats · 50.61–56.81
V1 clip8 · **`side-screen-stats` 50.80–56.70**. VIEWS dashboard → By-region bars, held 2.38s.
SFX `shutter` @50.80.

### cta · 56.81–66.25
V1 clip9 · **`profile-card` 61.20–64.00** on "My name is Rubio" — clears **before** "PASS"
(@64.22) so the CTA word stays readable *(comp reused from E002/E003)*.
SFX `hit-1` @61.20 · `simple-whoosh-1` @64.22.

## Regenerating

```bash
# from the repo root
node series/app-community/episodes/DBX-APP-S01E004-sponsorship-passes/caption-map.mjs
# from inside media/DBX-APP-S01E004/
bash ../../series/app-community/episodes/DBX-APP-S01E004-sponsorship-passes/footage-process.sh
bash ../../series/app-community/episodes/DBX-APP-S01E004-sponsorship-passes/screen-chop.sh
# then, from the media bundle:
bash tools/kdenlive-run.sh <episode>/kdenlive-build.repl   # NEVER pipe the repl in — see skills/06
python3 tools/kdenlive-nativize.py sponsorship-passes.kdenlive --vertical
```

`footage-process.sh` accepts `ONLY="05_sponsorship 06_discovery"` to rebuild a subset.
Rendering is single-threaded by design (`THREADS=1`) — this box has two cores.

## DECIDE (human, on the Mac)

- Add punch-in / pull-out Transform keyframes per the storyboard's `[ZOOM]` lines (not baked).
- **Interior breaths are left in.** Beat 1 carries two long ones (0.68s @2.75 and 0.98s @5.85).
  Tightening them with jump cuts sharpens the hook but re-times every caption downstream — do it
  after the caption track is final, or accept the pacing.
- **The card is small** (268px wide). If the app UI still doesn't read on a phone, the next lever
  is cropping each recording to its region of interest rather than enlarging the card — the box
  cannot grow without touching his hair.
- **Enhanced visuals are pending.** Swap the video only; keep this audio.
- `cover.en-US.md` is not written yet (`skills/02`).

## Preview
Rough-cut flatten (no zooms):
`media/DBX-APP-S01E004/exports/DBX-APP-S01E004_en-US_tiktok_9x16_v001_review.mp4`
Review only — the final render happens on the Mac from `sponsorship-passes.kdenlive`.

## Retention checklist (fill after final cut)
1–10. TBD after the Mac polish + render.
