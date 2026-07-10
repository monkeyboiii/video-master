# Edit Notes — DBX-APP-S01E005 "verified-boost-rider" · en-US

Rough cut assembled programmatically via `kdenlive-build.repl`
→ `media/DBX-APP-S01E005/verified-boost-rider.kdenlive`, then made Kdenlive-native with
`tools/kdenlive-nativize.py <file> --vertical`, then checked with
`tools/kdenlive-verify.py <build.repl> <file>`. Human adds zoom keyframes and renders on the Mac.

Skills followed: `skills/04-storyboard.md`, `skills/05-remotion-graphics.md`,
`skills/06-kdenlive-editing.md`.

## Track layout

| Track | Content |
|-------|---------|
| V1 | `footage/NN_*_sdr.mp4` — the ENHANCED video + the original `.MOV` narration |
| V2 · Overlays | `side-screen-membership` @15.26 (centred) · `feature-fan` @19.26 · four more cards |
| V3 · Brand | `brand-drop` @11.49 — its own track: it overlaps the membership card in time |
| V4 · Captions | `kinetic-captions` — one clip, 0→65.28s |
| V5 · CardOnTop | `profile-card` @59.45 — **above** the captions, as in E003/E004 |
| A1 · Music | `bgm-vampire-heart.mp3` from 0.00s, full length, flat ~10% under the VO |
| A2 · SFX | see map below |

Hard cuts only between shots. Overlays *ease* in. Zoom is **not baked** — Transform keyframes on
the Mac.

**Always run `kdenlive-verify.py`.** An MLT playlist is a sequential list and cannot hold two
overlapping clips: `add-clip` silently *appends* the second and ripples the rest of that track,
exit 0, no warning. `brand-drop` (11.49–16.49) overlaps the membership card (15.26–18.81), so it
gets its own track. On E004 this bug shipped a project with the splash card 8.6s late while the
flatten preview — composited by a separate ffmpeg script — looked perfect.

## Footage — enhanced video, original audio

V1 is `enhanced/NN_beat.mp4` (the director's face-enhanced renders) carrying `narration/NN_beat.MOV`
stream `0:1`. `footage-process.sh` cuts both with one pair of `-ss`/`-t` values.

The renders are **already SDR bt709, already upright 1080×1920, already 30fps**. The HLG→SDR
tone-map that the `.MOV` path needs would *corrupt* them; the chain is kept in `footage-process.sh`,
commented, for the day someone goes back to the `.MOV`. (The originals are HLG HDR
`arib-std-b67`/`bt2020`, coded 1920×1080 with a `-90` rotation matrix.)

**They are frame-synced.** An 8×8 cross-correlation of RMS envelopes matches each render to its own
original at corr 1.000 with the next-best at 0.12–0.38, and every pair has **0 ms lag**. Re-run that
check if the renders are ever re-exported.

Each `.MOV` carries a second, undecodable 4.0 `apac` spatial audio track. `-map 1:a:0` takes the
48 kHz stereo AAC narration. Never `-map 1:a`.

## Pause cropping — both edges

Trailing cut = **end of the last speech run** + 0.15s. Head trim only where the clip opens with
>0.25s of silence (`03_flair` only).

**Two cuts were too aggressive and are relaxed.** `01_hook`→`02_layers` had 0.19s of air and
`07_insider`→`08_cta` had 0.27s: the pulse never landed. Their out-points get ~0.25s more (11.00 and
6.50), giving **0.45s and 0.51s** of room tone across the cut — a breath, not a gap. Both takes have
~0.95s of trailing silence to spend, so nothing is truncated; `speech-check.py` still gates it.

> **Not "last `silence_start` + 0.15s".** `silencedetect` only reports a silence at least `d` long,
> so a take that ends with less than `d` of silence reports none and its last `silence_start` is an
> interior breath. On S01E004 that deleted a whole sentence from the hook for three builds. Every
> E005 take ends with 0.54–1.04s of silence, so none was at risk — **`speech-check.py` runs as a
> preflight inside `footage-process.sh`** so that stays true.

| Beat | Source in→out | Timeline | Len |
|---|---|---|---|
| hook | 0 → **11.00** | 0.00 | 11.00 |
| layers | 0 → 12.19 | 11.00 | 12.19 |
| flair | 0.30 → 7.31 | 23.19 | 7.01 |
| invite | 0 → 6.95 | 30.20 | 6.95 |
| stats-intro | 0 → 3.12 | 37.15 | 3.12 |
| stats-detail | 0 → 5.56 | 40.27 | 5.56 |
| insider | 0 → **6.50** | 45.83 | 6.50 |
| cta | 0 → 12.95 | 52.33 | 12.95 |

Total **65.28s**. Keep this table, `footage-process.sh`, `speech-check.py` and `caption-map.mjs`'s
`BEATS` in lockstep — four copies of the same numbers, and `caption-map.mjs` throws if the starts
don't chain or a beat's `dur` cuts its own last speech run.

## Captions — cue boundaries snapped out of pauses

The `.srt` files are **canonical**. `rough.md` is intent; `script.en-US.md` is a readable transcript.

E004 anchored words to speech runs and split them into cue-groups at the **largest** inter-run gaps.
E005's CTA breaks that: its interior breaths (0.45 / 0.50 / 0.51s) are as long as its sentence gaps
(0.55s), so largest-gap put cue 1 at 0.12–2.61s when it is spoken to 4.86s. It also cannot express a
cue that is a *sub-span* of one run — the transcriber split the last sentence mid-phrase ("…my link
in" / "the bio.").

So cue boundaries come from the SRT and are **snapped** clear of every pause: a boundary in a silence
moves to the next run's start; one within 0.20s of a run's edge moves to that edge; one genuinely
inside a run stays (a real mid-run split). Words then spread over each cue's *speech* time.
`node caption-map.mjs --test` asserts this reproduces E004's shipped hook grouping exactly.

`01_hook.srt` marks the product name with `*asterisks*`. Those are an emphasis cue, not caption text
— stripped from the display token, used only to confirm the brand tag.

212 words, 65.28s, 13 SRT cues. Never hand-edit `captions.all.json` or `subtitles/en-US.srt`.

## The overlay conventions

### 1 · NEVER CROP A RECORDING. Redact what you don't want and keep the frame.

Got wrong twice, on two episodes, in two ways, and caught both times:

* **E004 v1** cropped 44px off *each side* to force the native aspect into the card. The app UI lost
  its edges.
* **E004 v2 and E005 v1** cropped the status bar off the *top* to remove the red screen-recording
  pill. Full width survived, but **the aspect ratio changed** — an 884×1920 phone became 884×1790,
  visibly stubbier than a real phone — and the app's nav header was sliced off at the card's top
  edge. The director called it "cut", both times.

The recording's aspect ratio is not ours to change. A red pill, a third party's name, a live QR —
those are **redaction** problems. `screen-chop.sh` paints the pill out in its own colour and blurs
the rest, at the source, and the cards carry the **native** aspect. There is now no `crop=` anywhere.

> `drawbox color=black` on a `yuv420p` stream paints **limited-range** black (Y=16 → RGB 16,16,16), a
> visibly grey rectangle on a true-black status bar. The fill runs in `rgb24` and converts back.
> Verified: 0 red pixels in the top strip of every shipped clip, and the patch is indistinguishable
> from the bar at 6× contrast.

### 1b · Card geometry

| card | source (aspect) | box | notes |
|---|---|---|---|
| membership | 1170×2532 (0.4621) | **279,230 · 522×1129** | **centred, over his face**, above the band |
| flair / invite / stats / perks | 884×1920 (0.4604) | **16,110 · 484×1051** | top-left column |

The four column cards share one box: right edge 500, and his viewer-left eye's outer corner never
comes left of ~520 in any frame of any of those windows, so the card seeps onto his hair and leaves
both eyes and his mouth clear. Bottom 1161, against a band at 1372. Area ≈ 24.5% of the frame —
E004's proportion.

The membership card is the exception the director asked for: **centred, covering his face**, its
bottom (1359) just above the caption band and its top (230) just below the retiring brand mark (212).

Markers are `rect` by default; `shape: circle` rings a round control; `enter: "shrink"` starts the
ring wide and contracts onto a small one. *With the crop gone, the perks top-right button sits at
yFrac 0.074 of the native frame instead of 0.0017 of the cropped one — it was inside the card's 30px
corner radius. If a marker lands in a corner arc, suspect the crop.*

### 2 · The logo never takes the screen (`brand-drop`, 11.49–16.49)

The wordmark surfaces through the top edge, settles at **12.04s exactly on "DirtBikeX"**, holds
1.2s, flies to the top-trailing corner over 0.8s, sits as the mark for 1.8s and fades. It rides high
(`cornerTop: 84`) and respects the right safe-zone inset (145), where the platform's action rail is.

### 3 · The four-up fan-out (`feature-fan`, 19.26–23.66) — a NEW component

`rough.md`: *"fan out features sequentially 1, 2, 3, and 4 is recording in the middle (on face), when
the recording comes in, blur background"*.

He points **top-left → top-middle → top-right**, so the three icons lay out **horizontally across
the top**, not stacked down the column.

| # | asset | box | enters | on |
|---|---|---|---|---|
| 1 | `f1_flair.png` | 147,150 · 215² | 19.26 | "the **flair**," |
| 2 | `f3_stats.png` | 432,150 · 215² | 20.18 | "the **stats**," |
| 3 | `f2_invite.png` | 717,150 · 215² | 21.26 | "the custom **invites**," |
| 4 | `f4_insider.mov` | 160,1065 · 761×270 | 21.86 | the clause "and the insider hacks" |

The three icons are flat blue transparent PNGs on **white plates** with the orange brand border, and
they are **not recoloured** — a blue verified check is a universally-read symbol and retinting costs
the meaning; the plate delivers the brand colour as a frame and keeps a blue glyph legible over
blurred footage, which a dark plate would muddy.

**The blur is hoisted.** It no longer waits for the insider clip: it ramps in at **15.10** with the
membership card and clears at **23.66** with the fan. Route B, blur only, never dim.

Item 4 is a real recording of a `@teamdirtbikex` post whose body the app has blurred because the
viewer is not a member. **The blur is unrecoverable** — at 7× with contrast and unsharp it yields
word-shapes and no letters. It has **no label chip**: a chip would land at y1392, inside the caption
band, and the post's own headline names it.

`f4_insider.mov` is VFR — its container says 2.10s but the last decodable frame is at 1.50s, and a
seek past that yields nothing. It is on screen ~1.8s, so `FeatureFan` freezes it on a last-frame
still: `OffthreadVideo` renders **nothing** past its own end, it does not hold.

**The fan runs 0.47s past the beat cut (to 23.66) and beat 3's card defers to 23.96.** Item 4 enters
on the clause, not the literal word "insider" (22.54) — at 22.54 the cut at 23.19 would leave it
0.65s, which is not a read. Even at 21.86 the headline gets ~1.0s at full opacity. See DECIDE.

## Assembly — en-US (timeline seconds, as built)

### hook · 0.00–11.00
V1 clip0. No overlay. SFX `hit-1` @2.95 ("screaming."). The product is not named until 9.55.
The out-point is 11.00, not 10.74: the cut into `layers` had no pulse.

### layers · 11.00–23.19
V1 clip1 · **`brand-drop` 11.49–16.49** (settles 12.04 on "DirtBikeX") · **`side-screen-membership`
15.26–18.81**, CENTRED over his face · **`feature-fan` 19.26–23.66**. V1 is **blurred 15.10–23.66**
(Route B, blur only, never dim, 0.35s fades) — it arrives with the membership card, not with the
insider clip. SFX `simple-whoosh-2` @11.49 · `shutter` @15.26 · quiet `shutter` @19.26 / 20.18 /
21.26 · `hit-1` @21.86 (the post lands).

### flair · 23.19–30.20
V1 clip2 · **`side-screen-flair` 23.96–30.06** (6.10s). Entry in full: the profile → **"Edit"**
(marker) → Edit Profile → the flair dropdown → "Verified Boost Riders" + a shrinking circle on the
blue verified badge. **One cut: the save step**, as the outline asks — a tap, a 4.4s greyed-out
spinner, a toast, a bounce back. The flair is legible before any of it. SFX `shutter` @23.96.
*The "Edit" marker was originally placed on the avatar, 90px low; corrected against the pixels.*

### invite · 30.20–37.15
V1 clip3 · **`side-screen-invite` 30.36–37.01** (6.65s). The nav popover → the invite tools (marker)
→ the QR sheet (marker) → the Redeemed tab (marker). **One cut**: a 1.2s backtrack to a Pending list
already shown. SFX `shutter` @30.36.

### stats-intro + stats-detail · 37.15–45.83
V1 clips 4+5 · **`side-screen-stats` 37.31–45.66** (8.35s) — the one card that stays up across a
hard cut (40.27). Five states, each on its word: the Sponsorships portal (marker, "sponsorship"
38.43), the stat cards (marker, "stats." 39.90), the prev-month chevron (40.74), a shrinking circle
on the green refresh (41.81), the "Who engaged" row (marker, "engaged" 44.45). **Four cuts, every
one a measured dead wait** (a loading view, 3.5s of idle, 1.75s of idle, a dwelling tooltip). The
counters step forward across them (Views 60 → 61); never backwards. SFX `shutter` @37.31.

### insider · 45.83–52.33
V1 clip6 · **`side-screen-perks` 46.01–51.96** (5.95s). The Chat list — the "group chat" — with a
**shrinking circle on the top-right button**, as asked; then Personal Messages, then the message
opens and loads, then the members-only post. **Two cuts**: 1.8s of idle profile, and 1.3s of
"Loading topic…" skeleton. SFX `shutter` @46.01. The out-point is 6.50, not 6.26: the cut into the CTA had no pulse.

### cta · 52.33–65.28
V1 clip7 · **`profile-card` 59.45–62.05** on track **V5, above the captions** — E003's z-order,
which is what lets it sit on the subtitle side (`bottomInset` 190) rather than over his face. It
enters **0.87s before "My"** (@60.32) and is gone **0.55s before the CTA verb "follow"** (@62.60).
SFX `hit-1` @59.45 · `simple-whoosh-1` @62.60.
**No "BOOST" anywhere.** `rough.md` drafted a comment CTA; the take says "link in the bio", and the
SRT is canonical.

## Privacy

`screen-chop.sh` runs a **redaction pre-pass before it chops**, so no un-redacted frame can reach
`public/` or an export:

| clip | what | source box | window |
|---|---|---|---|
| all five | the red screen-recording pill (**painted**, not cropped) | A: 224,18 424×106 · B: 66,20 200×90 | always |
| `13_screen-invite` | the **live invite QR** — blurred at the director's instruction | 230,1258 426×404 | `between(t,3.70,5.20)` |
| `13_screen-invite` | "Shujin Li / @Rereliii" on the Redeemed list | 24,406 330×136 | `gte(t,6.20)` |
| `15_screen-perks` | the same rider in the Chat list | 20,410 320×140 | `between(t,1.75,3.55)` |

A blur, not a black bar: a bar reads as censorship, a blur reads as privacy. `@rubio`,
`Zenkai Rubio`, `@dbx`, `登山小鲁` and `@teamdirtbikex` are all the founder's own and stay.

## Regenerating

```bash
# from the repo root
node series/app-community/episodes/DBX-APP-S01E005-verified-boost-rider/caption-map.mjs --test
node series/app-community/episodes/DBX-APP-S01E005-verified-boost-rider/caption-map.mjs
# from inside media/DBX-APP-S01E005/   (footage-process.sh runs speech-check.py first)
bash ../../series/app-community/episodes/DBX-APP-S01E005-verified-boost-rider/footage-process.sh
bash ../../series/app-community/episodes/DBX-APP-S01E005-verified-boost-rider/screen-chop.sh
bash ../../tools/kdenlive-run.sh <episode>/kdenlive-build.repl   # NEVER pipe the repl — see skills/06
python3 ../../tools/kdenlive-nativize.py verified-boost-rider.kdenlive --vertical
python3 ../../tools/kdenlive-verify.py <episode>/kdenlive-build.repl verified-boost-rider.kdenlive
```

`footage-process.sh` accepts `ONLY="03_flair 07_insider"` to rebuild a subset. Rendering is
single-threaded by design (`THREADS=1`) — this box has two cores.
`screen-chop.sh` publishes its cuts and the fan assets into `packages/remotion-graphics/public/e005/`
itself: components resolve `src` against `public/`, not `media/`, and a stale asset makes a
re-render a silent no-op rather than a failure.

## DECIDE (human)

- ~~The invite QR is live.~~ **Blurred at the source**, at the director's instruction. A scannable
  credential in a published video is one-way.
- **`登山小鲁` (@dbx)** is left in as the founder's own alt, with its avatar. Say if it isn't his.
- **The insider post gets ~1.0s at full opacity.** Enough to register the blur-lock, not enough to
  read the seven-word headline. The alternative is running the fan further past the cut and pushing
  the flair card later still. Watch it once and decide.
- **The membership card is centred over his face** (279,230 · 522×1129), not in the column: the
  director asked for it there, and it is the only card the blur arrives with.
- Add punch-in / pull-out Transform keyframes per the storyboard's `[ZOOM]` lines (not baked).
- **Enhanced renders are IN** (`enhanced/`), video only; the audio is still the `.MOV`. Frame-sync
  verified (0 ms lag, proven 1:1 pairing). Re-verify if they are ever re-exported.
- `cover.en-US.md` is not written yet (`skills/02`). The cover copy is **not** bound by the
  narration: if the bio link is the conversion path, say so on the cover.

## Preview
Rough-cut flatten (no zooms):
`media/DBX-APP-S01E005/exports/DBX-APP-S01E005_en-US_tiktok_9x16_v001_review.mp4` — 65.33s.
Review only — the final render happens on the Mac from `verified-boost-rider.kdenlive`.

## Retention checklist (fill after final cut)
1–10. TBD after the Mac polish + render.
