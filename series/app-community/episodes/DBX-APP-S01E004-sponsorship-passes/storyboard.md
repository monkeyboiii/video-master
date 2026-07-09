# Storyboard / Edit Plan — DBX-APP-S01E004 "sponsorship-passes" · en-US

> **Status: EDIT PLAN.** Content is locked (10 talking-head clips + 7 screen recordings,
> already shot). Director's outline: `rough.md`. Words actually said: `script.en-US.md`.
> Skill followed: `skills/04-storyboard.md` (+ `05`, `06`).

---

## Format & global rules

| | |
|---|---|
| Canvas | 1080×1920, 30 fps, vertical |
| Source | 10 talking-head clips, **HLG HDR** (iPhone, 1920×1080 coded + `-90` rotation → portrait) |
| Raw length | 75.2s → **66.25s** after both-edge pause crops |
| **HDR** | Every clip tone-mapped **HLG→SDR Rec.709** before it hits the timeline. Never import the raw `.MOV`. |
| **Audio** | Original `.MOV`, stream `0:1` (the 4.0 `apac` spatial track has no decoder). **This cut uses the original MOV for video AND audio** — enhanced visuals land later. |
| **Transitions** | **Hard cuts only** between shots. Overlays are the exception: they *ease* in. |
| **Motion** | Punch-in / pull-out only (Transform keyframes, not baked). |
| **Captions** | One continuous `kinetic-captions` track, 0→66.25s, word-anchored to **real speech runs** (see `caption-map.mjs`). |
| **Music** | `bgm-vampire-heart.mp3` from 0.00s, flat ~10% under the VO. No ducking. |

## The two overlay conventions this episode establishes

**1 · The screen recordings live in the TOP-LEFT corner.** The founder deliberately holds
frame-**right** in every feature clip, reserving the upper-left. The recordings are chopped,
freeze-extended, and pinned there as a rounded card (`side-screen` with a top-left box) — never
over his face, never on the caption band.

**2 · The logo never takes the screen.** On the word "DirtBikeX" it **surfaces through the top
edge**, holds long enough to read, then **flies to the top-trailing (right) corner**, shrinking
and cross-fading from the wordmark into the bare mark, where it sits as an icon and fades out.
No full-screen brand card, no Route-B blur behind it — `brand-drop` is a transparent overlay.
It rests inside the platform safe zone (top 150, right 145).

---

## Beat-by-beat

Legend — **[ZOOM]** camera move · **[SFX]** sound accent · **[CAP]** caption emphasis ·
**[UI]** overlay. Timeline seconds are the built cut.

### 1 · HOOK — `01_hook` · 0.00–9.79

> "I build **ad slots** in my app because I **hate ads**. / Yup, I know how that sounds, so let
> me explain. / I could've made **DirtBikeX** full of flyers and banners, and honestly, that'd
> be the easy way out."

- **[ZOOM]** Open mid-push. The contradiction *is* the hook — hold on his face, no cutaway.
- **[UI]** **`brand-drop` @6.80–11.80.** The wordmark surfaces from the top and settles at
  **7.33s, exactly on the word "DirtBikeX"**, holds 1.2s, then flies to the top-right corner as
  the mark and fades out ~2s into the next beat.
- **[SFX]** `hit-1` on "hate ads" (@2.25) · `simple-whoosh-2` @6.80 as the logo surfaces.
- **[CAP]** "slots" brand · "hate" / "ads." harsh · "DirtBikeX" brand.
- *Purpose:* state the contradiction, promise the explanation.

### 2 · HATE-ADS — `02_hate-ads` · 9.79–14.67

> "But I **hate ads** so much that I literally look **away** or close my **eyes** so that they
> don't get into my head."

- **[ZOOM]** Small push-in — this is the confession that earns the hook.
- **[CAP]** "hate" / "ads" / "away" / "eyes" harsh.
- *Purpose:* prove the hook wasn't a gimmick. No overlay — his face carries it.

### 3 · BILLBOARD — `03_billboard` · 14.67–19.61

> "And I definitely want no riders opening my app and feel like they walked into a damn
> **billboard**."

- **[SFX]** `radio-adjustment` on "billboard" (@19.19) — a flat, cheap, broadcast texture.
- **[CAP]** "billboard." harsh.
- *Purpose:* name the thing he refuses to build. The turn lands next.

### 4 · PASSES — `04_passes` · 19.61–25.45

> "So these slots work **differently**. There are **limited passes** for real **riders** who
> actually belong in the sport."

- **[ZOOM]** Pull-out slightly — the argument opens up.
- **[CAP]** "differently." / "passes" / "riders" brand.
- *Purpose:* the pivot from *what I hate* to *what I built*. Still no overlay: let the idea land
  before the UI shows up.

### 5 · SPONSORSHIP — `05_sponsorship` · 25.45–33.09

> "Here, you can go to the **Sponsorship** page and pick your **spots**. / Choose when it
> **starts**, choose how long it **runs**, and DirtBikeX got you covered."

- **[UI]** `side-screen` (top-left) — `11_screen-sponsorship`. `rough.md`:
  `[SCREEN: Sponsorship / Pass entry]` → `[SCREEN: fast montage — start date, duration, active pass]`
- **[SFX]** `shutter` as the card lands.
- **[CAP]** "Sponsorship" / "spots." / "starts," / "runs," brand.
- *Purpose:* the how. First time the product appears.

### 6 · DISCOVERY — `06_discovery` · 33.09–38.34

> "Then, your profile will show up in **multiple places** across the app where people are
> actively **looking**."

- **[UI]** Three cards **fan out in sequence, individually** (`rough.md`: *"fast montage as my
  finger points, fan out in sequence individually — user search, chat suggestion, filter
  suggestion"*): `12_screen-search` → `13_screen-chat` → `14_screen-filter`, each in the
  top-left slot, each cut to its own third of the beat.
- **[SFX]** `shutter` on each of the three card entrances.
- **[CAP]** "multiple" / "places" / "looking" brand.
- *Purpose:* placement breadth, shown not claimed.

### 7 · SPLASH — `07_splash` · 38.34–44.53

> "And the **biggest** one is the **splash screen**, where users can **pause** it, **tap** your
> face, and go straight into your **profile**."

- **[UI]** `side-screen` — `15_screen-splash`. Three legible beats: **pause → tap → profile**,
  each freeze-extended if the recording rushes it. Orange tap-markers where the cut hides the
  gesture.
- **[SFX]** `shutter` on the card · `hit-1` on "profile." (@44.15).
- **[CAP]** "biggest" / "splash" / "pause" / "tap" / "profile." brand.
- *Purpose:* the marquee placement. The most valuable 6 seconds in the video.

### 8 · CAPPED — `08_capped` · 44.53–50.61

> "And don't worry, to keep it **fair**, passes are **capped** and **rotated**, so nobody gets
> to **flood** the scene."

- **[UI]** `side-screen` — `16_screen-capped` (active pass / availability).
- **[CAP]** "fair," / "capped" / "rotated," brand · "flood" harsh.
- *Purpose:* the objection-handler. Scarcity is a feature, not a paywall.

### 9 · STATS — `09_stats` · 50.61–56.81

> "And you even get to check your **sponsorship stats** too. / **Regional exposure**, **daily
> trends**, you name it."

- **[UI]** `side-screen` — `17_screen-stats`, a fast montage; hold the final chart.
- **[CAP]** "stats" / "Regional" / "exposure," / "daily" / "trends," brand.
- *Purpose:* proof you can measure it. Closes the buyer's loop.

### 10 · CTA — `10_cta` · 56.81–66.25

> "So essentially, it's a **fair way** to get **seen** by the right people. / My name is
> **Rubio**, and I'm giving out day **passes** for **free**. / Comment **"PASS"**, and I'll see
> you in the app."

- **[UI]** `profile-card` @61.20–64.00, on "My name is Rubio" — clears **before** "PASS" (@64.22)
  so the CTA word stays readable *(comp reused from E002/E003)*.
- **[SFX]** `hit-1` @61.20 (card) · soft `simple-whoosh-1` on "PASS".
- **[CAP]** "fair" / "seen" / "Rubio," / "passes" / "free." / ""PASS"," brand.
- *Purpose:* one action, one word, a real incentive.

---

## Screen-recording chops (the `[SCREEN: …]` directives)

`rough.md` is the instruction sheet for the overlays — its bracketed lines map 1:1 onto the
seven recordings. Reproduce the chops with `screen-chop.sh`. Every boundary lands on a settled
frame; spinners, typing and waits are cut; the **final payoff frame of each clip is
freeze-extended** so it registers (the recordings always short-change it).

| `rough.md` directive | Recording | Beat |
|---|---|---|
| `[SCREEN: Sponsorship / Pass entry]` + `[SCREEN: fast montage — start date, duration, active pass]` | `11_screen-sponsorship` | 5 |
| `[SCREEN: fast montage as my finger points, fan out in sequence individually — user search, chat suggestion, filter suggestion]` | `12_screen-search`, `13_screen-chat`, `14_screen-filter` | 6 |
| `[SCREEN: sponsor card on splash screen, pause → tap → profile]` | `15_screen-splash` | 7 |
| `[SCREEN: active pass / availability capped rotated]` | `16_screen-capped` | 8 |
| `[SCREEN: fast stats montage]` | `17_screen-stats` | 9 |

## SFX map

Short, recognizable, low-impact — punctuation, not carpet. No deep whooshes, no sub-drops.

| Moment | File |
|---|---|
| "hate ads" (@2.25) | `hit-1.mp3` |
| Logo surfaces (@6.80) | `simple-whoosh-2.wav` |
| "billboard." (@19.19) | `radio-adjustment.mp3` |
| Each screen card enters | `shutter.mp3` |
| "profile." (@44.15) | `hit-1.mp3` |
| profile-card (@61.20) | `hit-1.mp3` |
| "PASS" (@64.22) | `simple-whoosh-1.wav` |

## DECIDE (human)

- **Interior breaths are left in.** Beat 1 carries two long ones (0.68s and 0.98s). Tightening
  them with jump cuts would sharpen the hook but re-times every caption downstream — do it on
  the Mac after the caption track is final, or accept the pacing.
- Zoom keyframes are **not baked** (see `[ZOOM]` lines).
- **Enhanced visuals are pending.** When they land, swap the VIDEO only and keep this audio —
  verify frame-sync first (frame counts + RMS-envelope cross-correlation).
