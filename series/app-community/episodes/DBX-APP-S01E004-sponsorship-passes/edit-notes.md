# Edit Notes — DBX-APP-S01E004 "sponsorship-passes" · en-US

Rough cut assembled programmatically via `kdenlive-build.repl`
→ `media/DBX-APP-S01E004/sponsorship-passes.kdenlive`, then made Kdenlive-native with
`tools/kdenlive-nativize.py <file> --vertical`. Human adds zoom keyframes and renders on the Mac.

Skills followed: `skills/04-storyboard.md`, `skills/05-remotion-graphics.md`,
`skills/06-kdenlive-editing.md`.

## Track layout

| Track | Content |
|-------|---------|
| V1 | `footage/NN_*_sdr.mp4` — the ENHANCED video + the original `.MOV` narration |
| V2 · Overlays | `brand-drop` @7.08 · seven top-left `side-screen` cards |
| V3 · Captions | `kinetic-captions` — one clip, 0→68.48s |
| V4 · CardOnTop | `profile-card` @62.00 — **above** the captions, as in E003 |
| A1 · Music | `bgm-vampire-heart.mp3` from 0.00s, full length, flat ~10% under the VO |
| A2 · SFX | see map below |

Hard cuts only between shots. Overlays *ease* in (SideScreen slides from the left; BrandDrop
surfaces from the top). Zoom is **not baked** — Transform keyframes on the Mac.

## Footage — enhanced video, original audio

V1 is `enhanced/NN_beat.mp4` (the director's face-enhanced renders) carrying `narration/NN_beat.MOV`
stream `0:1`. `footage-process.sh` cuts both with one pair of `-ss`/`-t` values.

The enhanced renders are **already SDR bt709, already upright 1080×1920, already 30fps, and carry
no rotation matrix**. The HLG→SDR tone-map and the transpose that the `.MOV` path needs would both
*corrupt* them; the chain is kept in `footage-process.sh`, commented, for the day someone goes back
to the `.MOV`. (The originals are HLG HDR `arib-std-b67`/`bt2020`, 10-bit, coded 1920×1080 with a
`-90` rotation matrix.)

**They are frame-synced.** A 10×10 cross-correlation of RMS envelopes matches each render to its
original at corr 0.996–0.999 with the next-best original at 0.23–0.40 — so the 1:1 pairing is
proven, not assumed — and every pair has **0 ms lag** at 1 ms resolution. Decoded frame counts
agree exactly on 9 of 10; `01_hook`'s render is one frame short at a tail we cut away anyway.
Re-run that check if the renders are ever re-exported.

Each `.MOV` carries a second, undecodable 4.0 `apac` spatial audio track. `-map 1:a:0` takes the
48 kHz stereo AAC narration. Never `-map 1:a`.

## Pause cropping — both edges

`silencedetect=noise=-32dB:d=0.30`. Trailing cut = **end of the last speech run** + 0.15s. Head trim
only where the clip opens with >0.25s of silence (05, 06, 09 — 05 also opens on a lip-smack blip).

> **Not "last `silence_start` + 0.15s".** `silencedetect` only reports a silence at least `d` long.
> `01_hook` ends with **0.24s** of silence, so it reports **no trailing silence at all**, and its
> last `silence_start` (9.638) is the interior breath before *"and honestly, that'd be the easy way
> out."* Cutting there deleted that sentence from the episode — and, because `caption-map.mjs`'s
> `runs` were copied from the same log, crammed the whole third cue into the surviving half, which
> is what made the captions drift. `01_hook` is the only beat whose trailing silence is under 0.30s;
> every other clip ends with 0.6–1.0s and was unaffected. **`speech-check.py` now gates this** and
> `footage-process.sh` runs it before it encodes anything.

| Beat | Source in→out | Timeline | Len |
|---|---|---|---|
| hook | 0 → **12.02** | 0.00 | 12.02 |
| hate-ads | 0 → 4.88 | 12.02 | 4.88 |
| billboard | 0 → 4.94 | 16.90 | 4.94 |
| passes | 0 → 5.84 | 21.84 | 5.84 |
| sponsorship | 0.83 → 8.47 | 27.68 | 7.64 |
| discovery | 0.44 → 5.69 | 35.32 | 5.25 |
| splash | 0 → 6.19 | 40.57 | 6.19 |
| capped | 0 → 6.08 | 46.76 | 6.08 |
| stats | 0.29 → 6.49 | 52.84 | 6.20 |
| cta | 0 → 9.44 | 59.04 | 9.44 |

Total **68.48s**. Keep this table, `footage-process.sh`, `speech-check.py` and `caption-map.mjs`'s
`BEATS` in lockstep — they are four copies of the same numbers, and `caption-map.mjs` now throws if
the starts don't chain or a beat's `dur` cuts its own last speech run.

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

`01_hook` has **four** speech runs and three cues: the 0.53s breath at 9.638–10.167 is interior, so
the third cue spans runs 3 *and* 4 and its words skip the pause — "honestly," lands at 9.48 and
"that'd" at 10.28.

232 words, 68.48s, 16 SRT cues. Never hand-edit `captions.all.json` or `subtitles/en-US.srt`.

## The two overlay conventions

### 1 · The logo never takes the screen (`brand-drop`, 7.08–12.08)

A **standalone** transparent overlay — no full-screen brand card, no Route-B blur behind it.
The wordmark **surfaces through the top edge**, settles at **7.63s exactly on the word
"DirtBikeX"**, holds 1.2s, then **flies to the top-trailing (right) corner** over 0.8s, shrinking
and cross-fading from the wordmark into the bare mark. It sits there as an icon for 1.8s and
fades out over 0.65s — ~2s into the next beat. The corner rest honours the platform safe zone
(top 150, right 145).

### 2 · Screen recordings live in the TOP-LEFT corner — and they are BIG

**Nothing is trimmed horizontally.** An earlier pass cropped 44px off each side of every phone
capture to force the native aspect into the card; the app UI lost its edges. The only crop now is
a vertical one, because **every one of these recordings has a red screen-recording pill in the iOS
status bar** and that cannot be on screen:

| family | sources | crop | resulting aspect |
|---|---|---|---|
| A | the six 1170×2532 iPhone captures | `crop=1170:2412:0:120` | 0.4851 |
| B | `17_screen-stats` (884×1920 mirror) | `crop=884:1800:0:120` | 0.4911 |

So the aspect *does* change, and the cards are sized to the new aspect — `objectFit: fill` plus a
mismatched box silently distorts the UI.

A single card is **496 wide at x16 y110** (h 1023 family A, 1010 family B). x=512 is the furthest
right the edge can go **without covering his left eye**, measured across the whole of every carded
beat on the enhanced footage — the tightest is `09_stats`, where his eye's outer corner reaches
x≈520. He allows the card to seep onto his face; he does not allow it to cover it. Card bottom
1133, well clear of the caption band.

**Cuts and freezes are a last resort, not a default.** Each recording plays through, showing the
**entry** into its surface (a buyer has to see where the portal is). Segments are dropped only for
a genuine wait (a spinner, a nav load) and a frame is held only when the source is shorter than
its beat.

Markers are `rect` by default. `shape: "circle"` rings a round control; `enter: "shrink"` starts
the ring wide and contracts it onto a small control, which *finds* it for the viewer.

### 2b · The discovery beat FANS OUT — three cards, in sequence, each named

Per the director's sketch the three placements appear **one, two, three at a fixed 0.55s delay**,
each 306×631, each carrying an E002-style label chip:

| # | box | recording | enters | label |
|---|---|---|---|---|
| 1 | right, x740 y645 | `12_screen-search` | 35.38 | **Search users** |
| 2 | middle, riding high, x416 y221 | `14_screen-filter` | 35.93 | **Filter authors** |
| 3 | left, x66 y645 | `13_screen-chat` | 36.48 | **Create chat** |

Each **plays its own recording in full**, entry included (tap search → Users tab; open Advanced
Filters → Author Username; tap `+` → New Chat). They fade out together at 40.53. Only `chat` is
trimmed, by 0.27s of keyboard-idle tail after its payoff is already up; `search` and `filter` hold
their payoff to reach the group fade.

V1 is **blurred** behind them (Route B, blur only, 0.35s fade in and out), returning to normal as
they clear. The fan is the *sequence of entrances*, not the blur.

`rough.md` is the instruction sheet — its `[SCREEN: …]` directives map 1:1 onto the seven
recordings. No privacy blurs: every account on screen (`@rubio` / Zenkai Rubio, `@dbx`) is the
founder's own.

## Assembly — en-US (timeline seconds, as built)

### hook · 0.00–12.02
V1 clip0. **`brand-drop` 7.08–12.08.** SFX `hit-1` @2.25 ("hate ads") · `simple-whoosh-2` @7.08
(the logo surfaces). Captions: "slots" brand, "hate"/"ads." harsh, "DirtBikeX" brand @7.63.
The beat runs to 12.02 so the third sentence — *"...and honestly, that'd be the easy way out."* —
is actually in the episode. It was cut at 9.79 for the first three builds.

### hate-ads · 12.02–16.90
V1 clip1. The logo icon fades out at 12.08, just across the cut. No other overlay.

### billboard · 16.90–21.84
V1 clip2. SFX `radio-adjustment` @21.42 ("billboard."). Near-static, colder.

### passes · 21.84–27.68
V1 clip3. The pivot — deliberately **no UI**, so the idea lands before the product appears.

### sponsorship · 27.68–35.32
V1 clip4 · **`side-screen-sponsorship` 27.68–35.28** (7.60s). Plays start to finish with **one
cut**. Card time == source time, so the words land themselves: the entry (profile → nav menu,
**orange border on "Sponsorships"** → the page, **circle on the round "Your spot +" tile**) ends
on "Choose" @30.96; the calendar sheet carries "Choose when it starts," (30.96–31.97); the
duration dropdown opens and resolves 30d→7d across "choose how long it runs," (31.97–33.91) with
the picker animation intact; the start day moves 9→22 and the pass is bought on "and DirtBikeX
got you covered." The single cut removes 0.25s (source 6.23–6.48) in which literally nothing
changes. SFX `shutter` @27.68.
*Two earlier passes reordered this clip to chase the narration, and both made the app's state
regress on screen ($14.99 → $39.99 → $14.99). Neither was needed — the calendar sheet is already
up while he says "when it starts", because it IS the start picker. Measure before you rearrange.*

### discovery · 35.32–40.57
V1 clip5, **blurred 35.23–40.53** (0.35s fade in/out) · **three cards fan out in sequence at a
fixed 0.55s delay**: `search` @35.38 (right), `filter` @35.93 (middle-high), `chat` @36.48 (left).
Each plays its **own recording in full** — the tap into search, the `+` into New Chat, the filter
into Author Username — so the entry is visible. Only `search` (the shortest) holds its payoff to
reach the group fade. A marker points at the sponsored row in each. SFX `shutter` per entrance.

### splash · 40.57–46.76
V1 clip6 · **`side-screen-splash` 40.73–46.68**, from the director's **re-shoot**
(`15_screen-enter-splash.mov`), which opens on him **entering the app from Spotlight** — the entry
is the point. Then the splash plays, he taps pause, he taps the @rubio avatar, the app pushes in,
and the profile lands. Three cuts, all inside frozen or dead frames (the static paused splash, the
"Opening profile…" wait, the "Loading @rubio…" spinner); the loaded profile is held so it is still
up on "profile." @46.38.
The marker is a **shrinking circle** that starts wide and contracts onto the round play/pause
control — "pause it" is the action, not the tap, and on a busy splash a static ring would not find
it. SFX `shutter` @40.73 · `hit-1` @46.38 ("profile.").

### capped · 46.76–52.84
V1 clip7 · **`side-screen-capped` 46.93–51.83**. **Nothing is cut** — the whole 3.23s recording
plays. It is 1.67s shorter than the beat, so that time has to be held somewhere: 1.00s on the head
(the screen is static there anyway, and the caps table + budget donut is the densest frame in the
episode) and 0.67s on the tail payoff. That also keeps the caps on screen through "capped" @49.39,
with "rotated," @49.98 landing on the rotating list. An earlier pass dumped all 1.65s on the
near-empty "Currently rotating" list, which then sat dead for three seconds.
Marker on the **Pass 1/40** caps row. SFX `shutter` @46.93.

### stats · 52.84–59.04
V1 clip8 · **`side-screen-stats` 53.03–58.93**. Plays straight through, entry included. No cuts,
no freezes. A **shrinking circle narrows onto the round star button in the page's top-right
corner** (card 1.65→2.45, i.e. 54.68–55.48, exactly under "check your **sponsorship stats**") —
that button is the portal to the stats view, and he taps it at card 2.32. SFX `shutter` @53.03.

### cta · 59.04–68.48
V1 clip9 · **`profile-card` 62.00–64.80**, on track **V4, above the captions** — E003's z-order,
which is what lets the card live on the subtitle side (`bottomInset` back to the default 190)
instead of floating up over his chin. Its clip starts **0.92s before "My"** (@62.92) — with the spring entrance it is fully up ~0.7s
before, just after "people." (@61.89) — and it is gone **1.41s before "Comment"** (@66.21) and 1.65s before "PASS"
(@66.45). E003's card entered *on* the word and cleared 0.43s before its CTA verb; the director
asked for more daylight on both sides, so this leads by ~0.9s and clears by ~1.4s.
SFX `hit-1` @62.00 · `simple-whoosh-1` @66.45.

## Regenerating

```bash
# from the repo root
node series/app-community/episodes/DBX-APP-S01E004-sponsorship-passes/caption-map.mjs
# from inside media/DBX-APP-S01E004/   (footage-process.sh runs speech-check.py first)
bash ../../series/app-community/episodes/DBX-APP-S01E004-sponsorship-passes/footage-process.sh
bash ../../series/app-community/episodes/DBX-APP-S01E004-sponsorship-passes/screen-chop.sh
# then, from the media bundle:
bash ../../tools/kdenlive-run.sh <episode>/kdenlive-build.repl  # NEVER pipe the repl — see skills/06
python3 ../../tools/kdenlive-nativize.py sponsorship-passes.kdenlive --vertical
python3 ../../tools/kdenlive-verify.py <episode>/kdenlive-build.repl sponsorship-passes.kdenlive
```

**Always run `kdenlive-verify.py`.** An MLT playlist is a sequential list and cannot hold two
overlapping clips: `add-clip` silently *appends* the second one and ripples the rest of that track,
exit 0, no warning. The three fan cards overlap by design, so they get a track each, and two SFX do
too. Before the checker existed, the exported project had the splash card at 49.37s instead of
40.73s and the "PASS" whoosh 0.38s late — while the flatten preview, which is composited by a
separate ffmpeg script, was perfectly correct.

`footage-process.sh` accepts `ONLY="05_sponsorship 06_discovery"` to rebuild a subset.
Rendering is single-threaded by design (`THREADS=1`) — this box has two cores.
`screen-chop.sh` publishes its cuts into `packages/remotion-graphics/public/e004/` itself:
`SideScreen` resolves `src` against `public/`, not `media/`, and a stale asset makes a re-render a
silent no-op rather than a failure.

## DECIDE (human, on the Mac)

- Add punch-in / pull-out Transform keyframes per the storyboard's `[ZOOM]` lines (not baked).
- **Interior breaths are left in.** Beat 1 carries two long ones (0.68s @2.75 and 0.98s @5.85).
  Tightening them with jump cuts sharpens the hook but re-times every caption downstream — do it
  after the caption track is final, or accept the pacing. The hook also carries a 0.53s breath at
  9.64 before its last clause; that one is load-bearing (see the pause-cropping note) — do not
  "tidy" it away without re-running `speech-check.py`.
- **The right-hand fan card** (`search`, x740 w306 → right edge 1046) sits inside the platform's
  right safe-zone inset (145px), where TikTok's action rail lives. It is placed where the director
  sketched it; check it against a real TikTok preview before publish.
- **The profile-card is 860px wide and centred, and the CTA shot is a centred face-fill.** At
  `bottomInset: 190` its top edge (y≈1118) clears his mouth (y≈1094) by ~24px. It reads as E003
  does, but there is no `bottomInset` that both clears this face and keeps the "Founder · DirtBikeX"
  chip on screen — the only real fix is a narrower card, which is a component change.
- `cover.en-US.md` names the corner mark's inset; it now rides higher (`cornerTop: 84`).

## Preview
Rough-cut flatten (no zooms):
`media/DBX-APP-S01E004/exports/DBX-APP-S01E004_en-US_tiktok_9x16_v001_review.mp4`
Review only — the final render happens on the Mac from `sponsorship-passes.kdenlive`.

## Retention checklist (fill after final cut)
1–10. TBD after the Mac polish + render.
