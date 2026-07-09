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

### 2 · Screen recordings live in the TOP-LEFT corner — and they are BIG

A single card is **470×1017** at **x18 y140** — about **23% of the frame**. It bleeds over the
founder's hair and a little of his brow; that is deliberate. An earlier pass used a 268×580 card
that cleared him entirely, and the app UI was illegible. The box aspect (0.462) matches the
recordings, so `objectFit: fill` introduces no distortion.

**Cuts and freezes are a last resort, not a default.** Each recording plays through, showing the
**entry** into its surface (a buyer has to see where the portal is). Segments are dropped only for
a genuine wait (a spinner, a nav load) and a frame is held only when the source is shorter than
its beat. The status bar (with the red recording pill) is cropped off.

Markers are `rect` by default; `shape: "circle"` rings a round control.

### 2b · The discovery beat FANS OUT — three cards, in sequence

Per the director's sketch, the three placements appear **one, two, three at a fixed 0.55s delay**
— `search` @33.15 (right), `chat` @33.70 (middle, riding high), `filter` @34.25 (left) — and each
**plays its own recording in full**, entry included. They all fade out together around 38.08.
V1 is **blurred** behind them (Route B, blur only, 0.35s fade in and out), returning to normal as
they clear. The fan is the *sequence*, not the blur.

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
V1 clip4 · **`side-screen-sponsorship` 25.45–33.05** (7.60s). Plays start to finish with **one
cut**. Card time == source time, so the words land themselves: the entry (profile → nav menu,
**orange border on "Sponsorships"** → the page, **circle on the round "Your spot +" tile**) ends
on "Choose" @28.73; the calendar sheet carries "Choose when it starts," (28.73–29.74); the
duration dropdown opens and resolves 30d→7d across "choose how long it runs," (29.74–31.68) with
the picker animation intact; the start day moves 9→22 and the pass is bought on "and DirtBikeX
got you covered." The single cut removes 0.25s (source 6.23–6.48) in which literally nothing
changes. SFX `shutter` @25.45.
*Two earlier passes reordered this clip to chase the narration, and both made the app's state
regress on screen ($14.99 → $39.99 → $14.99). Neither was needed — the calendar sheet is already
up while he says "when it starts", because it IS the start picker. Measure before you rearrange.*

### discovery · 33.09–38.34
V1 clip5, **blurred 33.00–38.30** (0.35s fade in/out) · **three cards fan out in sequence at a
fixed 0.55s delay**: `search` @33.15 (right), `chat` @33.70 (middle-high), `filter` @34.25 (left).
Each plays its **own recording in full** — the tap into search, the `+` into New Chat, the filter
into Author Username — so the entry is visible. Only `search` (the shortest) holds its payoff to
reach the group fade. A marker points at the sponsored row in each. SFX `shutter` per entrance.

### splash · 38.34–44.53
V1 clip6 · **`side-screen-splash` 38.50–44.45**. Plays through: the paused splash (the ▶ control
is showing) → the tap on the @rubio avatar → the profile. The **1.85s "Loading @rubio…" spinner is
the only thing cut**; what remains is 0.75s short of the beat, so the finished profile is held —
it has to still be on screen when he says "profile." @44.15. The marker is a **circle around the
play/pause control** — "pause it" is the action, not the tap.
SFX `shutter` @38.50 · `hit-1` @44.15 ("profile.").

### capped · 44.53–50.61
V1 clip7 · **`side-screen-capped` 44.70–49.60**. **Nothing is cut** — the whole 3.23s recording
plays. It is 1.67s shorter than the beat, so that time has to be held somewhere: 1.00s on the head
(the screen is static there anyway, and the caps table + budget donut is the densest frame in the
episode) and 0.67s on the tail payoff. That also keeps the caps on screen through "capped" @47.16,
with "rotated," @47.75 landing on the rotating list. An earlier pass dumped all 1.65s on the
near-empty "Currently rotating" list, which then sat dead for three seconds.
Marker on the **Pass 1/40** caps row. SFX `shutter` @44.70.

### stats · 50.61–56.81
V1 clip8 · **`side-screen-stats` 50.80–56.70**. Plays straight through, entry included. No cuts,
no freezes. SFX `shutter` @50.80.

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
- **The right-hand fan card** (`search`, x740 w306 → right edge 1046) sits inside the platform's
  right safe-zone inset (145px), where TikTok's action rail lives. It is placed where the director
  sketched it; check it against a real TikTok preview before publish.
- **Enhanced visuals are pending.** Swap the video only; keep this audio.
- `cover.en-US.md` is not written yet (`skills/02`).

## Preview
Rough-cut flatten (no zooms):
`media/DBX-APP-S01E004/exports/DBX-APP-S01E004_en-US_tiktok_9x16_v001_review.mp4`
Review only — the final render happens on the Mac from `sponsorship-passes.kdenlive`.

## Retention checklist (fill after final cut)
1–10. TBD after the Mac polish + render.
