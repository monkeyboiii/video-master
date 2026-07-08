# Storyboard / Edit Plan — DBX-APP-S01E003 "track-owners" · en-US

Track-owner promotion. **No reading script** — narration was recorded first; the `.srt`
files in `media/DBX-APP-S01E003/_source/srt/` are the subtitles of record.
`_source/rough.md` is the *feature-overlay guide* (where screens go), not the spoken text.

## Format & global rules

| | |
|---|---|
| Canvas | 1080×1920, 30 fps, vertical |
| Source | 6 talking-head clips (**HLG HDR**, −90° rotation → portrait) + 3 app screen-recordings (SDR) |
| **HDR** | Every narration clip tone-mapped HLG→SDR Rec.709 before edit (never import raw `.MOV`) |
| **Pause crop** | Each clip cut at its speech end (silencedetect); 2 also had a head pause. Raw 58.7s → **53.61s** |
| **Transitions** | **Hard cuts only** — including inside the screen recordings (pure cutting out, no dissolves) |
| **Motion** | Punch-in / pull-out only, added as Transform keyframes on the Mac (not baked) |
| **SFX** | Short, low-impact. **Camera shutter on every screen-overlay entrance** (the cue that worked in E002) |
| **Captions** | **One continuous whole-video track** (see decision below) |

### Timeline (trimmed, contiguous)

| Beat | Clip | In→Out (source) | Timeline | Len |
|---|---|---|---|---|
| hook | `01_hook` | 0 → 15.48 | 0.00 – 15.48 | 15.48 |
| why | `02_why` | 0.21 → 7.76 | 15.48 – 23.03 | 7.55 |
| flair | `03_flair` | 0.35 → 6.27 | 23.03 – 28.95 | 5.92 |
| create | `04_create` | 0 → 5.06 | 28.95 – 34.01 | 5.06 |
| rsvp | `05_rsvp` | 0 → 7.97 | 34.01 – 41.98 | 7.97 |
| cta | `06_cta` | 0 → 11.63 | 41.98 – 53.61 | 11.63 |

## Decision: continuous captions (with the tradeoff stated)

Per-beat caption overlays (E002) fade out at each clip boundary — subtitles "go away
subtly". **E003 uses a single caption overlay spanning all 53.61s**, with word times on the
*global* timeline. The rolling window then carries words across every cut; nothing fades
until the very end.

- **Cost:** one ~54s ProRes 4444 alpha render (bigger, slower) instead of six small ones,
  and a re-time means one big re-render.
- **Fallback:** if it reads badly, revert to per-beat overlays (E002 strategy).
- Caption word times are scaled per beat by `dur / (srtEnd − trimIn)` — the SRT cue-ends
  overshoot the real speech, so unscaled the last words would fall past the end and never
  render. `caption-map.mjs` throws if any word overflows.

## Screen recordings — chop specs (pure cuts, muted, 30 fps)

Each chopped clip is cut to **exactly** the length of the line it plays under.

| Source | Kept segments | Result | Cut out (why) |
|---|---|---|---|
| `07_screen-flair.mov` (8.60s) | `[0.00–2.40] [3.85–6.25] [7.45–8.57]` | **5.92s** | Edit-Profile dwell + scroll; the save-dim frame |
| `08_screen-create.mov` (58.45s) | `[1.50–2.75] [21.60–22.85] [36.60–38.61] [42.60–43.15]` | **5.06s** | name typing (`Bi→Big rud→Big ride`), location typing, RSVP/max fiddling, reminders detour, compose screen, and **~8.5s of the "Setting up the editor…" wait** — a **0.55s glimpse of it is kept** so the event visibly gets created |
| `09_screen-rsvp.mp4` (15.63s) | `[0.00–4.30] [7.70–8.85] [10.30–11.50] [12.25–13.57]` | **7.97s** | **map spinner (~3.4s)**; action sheet shortened so the **Going ✓** payoff holds ~1.3s |

Every boundary was checked against a settled frame — no cut lands mid-animation or
mid-keystroke.

## Screen placement (the reserved blank space)

The founder holds frame-right on all three feature clips, leaving blank wall at frame-left.
Framing is **not identical** across them — `05_rsvp` is the tightest (his hair reaches
x≈445) and its helmet sits highest (y≈985). One box was measured to clear his face on the
tightest clip and stay above the helmet, then used for **all three** so placement is
consistent:

```
box = x 24, y 96, w 391, h 852     (aspect 0.459 vs recordings 0.462 → fills, no visible stretch)
```

Verified against `03_flair`, `04_create`, `05_rsvp`: never touches his face.

## Beat-by-beat

Legend — **[SCR]** side screen · **[OV]** other overlay · **[SFX]** · **[ZOOM]** intent for the Mac.

### hook — 0.00–15.48
"can't show up to an event you never **discover** … you might just **never** find out."
- **[SFX]** soft hit @2.90 on "discover". **[ZOOM]** slow punch-in; settle on "never find out".
- Captions: `never` / `discover` in harsh red.

### why — 15.48–23.03
"one of the reasons I'm building **DirtBikeX** … tracks easier to find."
- **[OV]** `brand-title` @18.05 (2.0s) — logo lands on the word. *(reused from E002)*
- **[SFX]** soft whoosh @18.05.

### flair — 23.03–28.95  ·  feature 1
"if you run a dirt bike track, you can get **verified** as a track **owner**."
- **[SCR]** `side-screen flair` for the full beat: profile → Edit Profile → flair picker → **Track Stewards** → back to profile.
- **[SFX]** **shutter @23.03** (screen entrance).

### create — 28.95–34.01  ·  feature 2
"create ride days, races, open practices, and even **reoccurring** events."
- **[SCR]** `side-screen create`: New Event form → filled (Big ride / Osaka) → **Recurrence: Every other Wednesday** (holds through "reoccurring" at overlay t=4.22) → a **0.55s glimpse of "Setting up the editor…"** on "events." so the event visibly gets created.
- **[SFX]** **shutter @28.95**.

### rsvp — 34.01–41.98  ·  feature 3
"find them in the Events tab, filter what's nearby, **RSVP**, and get **reminded**."
- **[SCR]** `side-screen rsvp`: Events tab (month filter row) → event detail → map (loading removed) → RSVP sheet → **Going ✓**.
- **[SFX]** **shutter @34.01**.

### cta — 41.98–53.61
"help riders find places to ride … **My name is Rubio** … **comment "OWNER"**."
- **[OV]** `profile-card` @47.80 (2.8s) — clears at 50.60 *before* the CTA words so
  "comment / OWNER" stay readable in the caption. *(reused from E002)*
- **[SFX]** soft hit @47.80. **[ZOOM]** warm settle.

## Audio
- VO from the clips (A1 is the footage audio). Music `bgm-vampire-heart` at **~10%** under VO.
- SFX (A2), all short/low-impact: hit @2.90 · whoosh @18.05 · **shutter @23.03, @28.95, @34.01** · hit @47.80.

## Assembly
Tone-map → chop screens → render overlays (captions ×1, side-screen ×3; reuse brand-title +
profile-card) → `cli-anything-kdenlive` from inside the bundle → `tools/kdenlive-nativize.py
--vertical` → Mac adds zoom keyframes and renders.

`DECIDE (human):` no `invite-card` this time — the CTA is "comment OWNER", not a QR.
