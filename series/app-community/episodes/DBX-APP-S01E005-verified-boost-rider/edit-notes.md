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
| V1 | Tone-mapped footage `footage/NN_*_sdr.mp4` — carries the narration |
| V2 · Overlays | `side-screen-membership` @15.00 · `feature-fan` @19.00 · four more cards |
| V3 · Brand | `brand-drop` @11.23 — its own track: it overlaps the membership card in time |
| V4 · Captions | `kinetic-captions` — one clip, 0→64.78s |
| V5 · CardOnTop | `profile-card` @58.95 — **above** the captions, as in E003/E004 |
| A1 · Music | `bgm-vampire-heart.mp3` from 0.00s, full length, flat ~10% under the VO |
| A2 · SFX | see map below |

Hard cuts only between shots. Overlays *ease* in. Zoom is **not baked** — Transform keyframes on
the Mac.

**Always run `kdenlive-verify.py`.** An MLT playlist is a sequential list and cannot hold two
overlapping clips: `add-clip` silently *appends* the second and ripples the rest of that track,
exit 0, no warning. `brand-drop` (11.23–16.23) overlaps the membership card (15.00–18.55), so it
gets its own track. On E004 this bug shipped a project with the splash card 8.6s late while the
flatten preview — composited by a separate ffmpeg script — looked perfect.

## Footage

All 8 clips are **HLG HDR** (`arib-std-b67` / `bt2020`), coded 1920×1080 with a `-90` rotation
matrix — ffmpeg autorotates them to 1080×1920 on decode. Each is tone-mapped to SDR Rec.709 before
edit (`footage-process.sh`); importing the raw `.MOV` reproduces E001's pale look.

Each `.MOV` carries a second, undecodable 4.0 `apac` spatial audio track. `-map 0:a:0` takes the
48 kHz stereo AAC narration. Never `-map 0:a`.

**No enhanced renders yet.** When they land, swap the **video only**, DROP the tone-map (an SDR
render re-tonemapped is corrupted), and re-verify frame-sync first: an N×N cross-correlation of RMS
envelopes must pick each render's own original by a wide margin, at 0ms lag, with matching frame
counts, and frame 0 of each cut must match `enhanced@trimIn`. See E004's `footage-process.sh`.

## Pause cropping — both edges

Trailing cut = **end of the last speech run** + 0.15s. Head trim only where the clip opens with
>0.25s of silence (`03_flair` only).

> **Not "last `silence_start` + 0.15s".** `silencedetect` only reports a silence at least `d` long,
> so a take that ends with less than `d` of silence reports none and its last `silence_start` is an
> interior breath. On S01E004 that deleted a whole sentence from the hook for three builds. Every
> E005 take ends with 0.54–1.04s of silence, so none was at risk — **`speech-check.py` runs as a
> preflight inside `footage-process.sh`** so that stays true.

| Beat | Source in→out | Timeline | Len |
|---|---|---|---|
| hook | 0 → 10.74 | 0.00 | 10.74 |
| layers | 0 → 12.19 | 10.74 | 12.19 |
| flair | 0.30 → 7.31 | 22.93 | 7.01 |
| invite | 0 → 6.95 | 29.94 | 6.95 |
| stats-intro | 0 → 3.12 | 36.89 | 3.12 |
| stats-detail | 0 → 5.56 | 40.01 | 5.56 |
| insider | 0 → 6.26 | 45.57 | 6.26 |
| cta | 0 → 12.95 | 51.83 | 12.95 |

Total **64.78s**. Keep this table, `footage-process.sh`, `speech-check.py` and `caption-map.mjs`'s
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

212 words, 64.78s, 13 SRT cues. Never hand-edit `captions.all.json` or `subtitles/en-US.srt`.

## The overlay conventions

### 1 · Cards live TOP-LEFT, and the column is narrow

E005 is framed like E002–E004 (he holds frame-right of centre, blank column left) but his head is
**large**: his hair reaches x≈300–430 depending on the beat, against E004's ≈540. And he **drifts
inside a beat**. Each card was measured over its own on-screen window:

| card | box | right edge | his left eye, tightest |
|---|---|---|---|
| membership | 32,120 · 344×712 | 376 | **398** ← binding |
| flair / invite / stats / perks | 32,120 · 438×887 | 470 | 540 / 585 / 540 / 490 |

The four later cards share one box; membership is smaller because that is the only window where his
face comes far enough left to constrain it. Cards seep onto his hair — allowed — and leave both eyes
and his mouth outside. The column is **width-limited by his face, not by the caption band**: card
bottoms are 832 / 1007 against a band at 1372.

Nothing is trimmed horizontally. The only crop is vertical, because every recording carries a red
screen-recording pill:

| family | sources | crop | aspect |
|---|---|---|---|
| A | the four 884×1920 mirror captures | `crop=884:1790:0:130` | 0.493855 |
| B | `11_screen-membership` (1170×2532) | `crop=1170:2422:0:110` | 0.483072 |

Markers are `rect` by default; `shape: circle` rings a round control; `enter: "shrink"` starts the
ring wide and contracts onto a small one.

### 2 · The logo never takes the screen (`brand-drop`, 11.23–16.23)

The wordmark surfaces through the top edge, settles at **11.78s exactly on "DirtBikeX"**, holds
1.2s, flies to the top-trailing corner over 0.8s, sits as the mark for 1.8s and fades. It rides high
(`cornerTop: 84`) and respects the right safe-zone inset (145), where the platform's action rail is.

### 3 · The four-up fan-out (`feature-fan`, 19.00–23.40) — a NEW component

`rough.md`: *"fan out features sequentially 1, 2, 3, and 4 is recording in the middle (on face), when
the recording comes in, blur background"*.

| # | asset | box | enters | on |
|---|---|---|---|---|
| 1 | `f1_flair.png` | 46,120 · 210² | 19.00 | "the **flair**," |
| 2 | `f3_stats.png` | 46,440 · 210² | 19.92 | "the **stats**," |
| 3 | `f2_invite.png` | 46,760 · 210² | 20.75 | "the custom **invites**," |
| 4 | `f4_insider.mov` | 160,1065 · 761×270 | 21.60 | the clause "and the insider hacks" |

The three icons are flat blue transparent PNGs, **plated** (dark plate, orange brand border) and
**not recoloured** — a blue verified check is a universally-read symbol and retinting costs the
meaning; the plate delivers the brand colour as a frame. They sit over a **sharp** background: the
blur is the members-only reveal and spending it early would cost the payoff.

Item 4 is a real recording of a `@teamdirtbikex` post whose body the app has blurred because the
viewer is not a member. **The blur is unrecoverable** — at 7× with contrast and unsharp it yields
word-shapes and no letters. It has **no label chip**: a chip would land at y1392, inside the caption
band, and the post's own headline names it.

`f4_insider.mov` is VFR — its container says 2.10s but the last decodable frame is at 1.50s, and a
seek past that yields nothing. It is on screen ~1.8s, so `FeatureFan` freezes it on a last-frame
still: `OffthreadVideo` renders **nothing** past its own end, it does not hold.

**The fan runs 0.47s past the beat cut (to 23.40) and beat 3's card defers to 23.70.** Item 4 enters
on the clause, not the literal word "insider" (22.28) — at 22.28 the cut at 22.93 would leave it
0.65s, which is not a read. Even at 21.60 the headline gets ~1.0s at full opacity. See DECIDE.

## Assembly — en-US (timeline seconds, as built)

### hook · 0.00–10.74
V1 clip0. No overlay. SFX `hit-1` @2.95 ("screaming."). The product is not named until 9.55.

### layers · 10.74–22.93
V1 clip1 · **`brand-drop` 11.23–16.23** (settles 11.78) · **`side-screen-membership` 15.00–18.55**
(3.55s; the chop lands at 3.567s — a card must never outrun its own clip) · **`feature-fan`
19.00–23.40**, with V1 **blurred 21.45–23.40** (Route B, blur only, never dim, 0.35s fades).
SFX `simple-whoosh-2` @11.23 · `shutter` @15.00 · quiet `shutter` @19.00 / 19.92 / 20.75 ·
`hit-1` @21.60 (the post lands, the blur arrives).

### flair · 22.93–29.94
V1 clip2 · **`side-screen-flair` 23.70–29.80** (6.10s). Entry in full: the profile → **"Edit"**
(marker) → Edit Profile → the flair dropdown → "Verified Boost Riders" + a shrinking circle on the
blue verified badge. **One cut: the save step**, as the outline asks — a tap, a 4.4s greyed-out
spinner, a toast, a bounce back. The flair is legible before any of it. SFX `shutter` @23.70.
*The "Edit" marker was originally placed on the avatar, 90px low; corrected against the pixels.*

### invite · 29.94–36.89
V1 clip3 · **`side-screen-invite` 30.10–36.75** (6.65s). The nav popover → the invite tools (marker)
→ the QR sheet (marker) → the Redeemed tab (marker). **One cut**: a 1.2s backtrack to a Pending list
already shown. SFX `shutter` @30.10.

### stats-intro + stats-detail · 36.89–45.57
V1 clips 4+5 · **`side-screen-stats` 37.05–45.40** (8.35s) — the one card that stays up across a
hard cut (40.01). Five states, each on its word: the Sponsorships portal (marker, "sponsorship"
38.17), the stat cards (marker, "stats." 39.64), the prev-month chevron (40.48), a shrinking circle
on the green refresh (41.55), the "Who engaged" row (marker, "engaged" 44.19). **Four cuts, every
one a measured dead wait** (a loading view, 3.5s of idle, 1.75s of idle, a dwelling tooltip). The
counters step forward across them (Views 60 → 61); never backwards. SFX `shutter` @37.05.

### insider · 45.57–51.83
V1 clip6 · **`side-screen-perks` 45.75–51.70** (5.95s). The Chat list — the "group chat" — with a
**shrinking circle on the top-right button**, as asked; then Personal Messages, then the message
opens and loads, then the members-only post. **Two cuts**: 1.8s of idle profile, and 1.3s of
"Loading topic…" skeleton. SFX `shutter` @45.75.

### cta · 51.83–64.78
V1 clip7 · **`profile-card` 58.95–61.55** on track **V5, above the captions** — E003's z-order,
which is what lets it sit on the subtitle side (`bottomInset` 190) rather than over his face. It
enters **0.87s before "My"** (@59.82) and is gone **0.55s before the CTA verb "follow"** (@62.10).
SFX `hit-1` @58.95 · `simple-whoosh-1` @62.10.
**No "BOOST" anywhere.** `rough.md` drafted a comment CTA; the take says "link in the bio", and the
SRT is canonical.

## Privacy

`screen-chop.sh` runs a **redaction pre-pass before it chops**, so no un-redacted frame can reach
`public/` or an export:

| clip | who | source box | window |
|---|---|---|---|
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

- **The invite QR is live.** `13_screen-invite` shows a scannable QR for his own invite link,
  captioned "Instagram people welcome!" and capped at 0/3,000. It is on screen ~1.1s at card scale.
  Left in because it is deliberately public — but publishing is irreversible. **Confirm.**
- **`登山小鲁` (@dbx)** is left in as the founder's own alt, with its avatar. Say if it isn't his.
- **The insider post gets ~1.0s at full opacity.** Enough to register the blur-lock, not enough to
  read the seven-word headline. The alternative is running the fan further past the cut and pushing
  the flair card later still. Watch it once and decide.
- **The membership card is 344px wide** — the narrowest in the series, because that beat is where his
  face comes closest to the column. Its plan list is small. Consider a punch-in on the Mac.
- Add punch-in / pull-out Transform keyframes per the storyboard's `[ZOOM]` lines (not baked).
- **No enhanced renders yet.** Swap the video only; keep this audio; drop the tone-map; re-verify sync.
- `cover.en-US.md` is not written yet (`skills/02`). The cover copy is **not** bound by the
  narration: if the bio link is the conversion path, say so on the cover.

## Preview
Rough-cut flatten (no zooms):
`media/DBX-APP-S01E005/exports/DBX-APP-S01E005_en-US_tiktok_9x16_v001_review.mp4` — 64.85s.
Review only — the final render happens on the Mac from `verified-boost-rider.kdenlive`.

## Retention checklist (fill after final cut)
1–10. TBD after the Mac polish + render.
