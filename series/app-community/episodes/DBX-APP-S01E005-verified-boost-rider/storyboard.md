# Storyboard / Edit Plan — DBX-APP-S01E005 "verified-boost-rider" · en-US

> **Status: EDIT PLAN.** Content is locked (8 talking-head clips + 5 screen recordings + 4 feature
> assets, already shot). Director's outline: `_source/rough.md`. Words actually said — and
> **canonical** — the `.srt` files; `script.en-US.md` is a readable transcript of them.
> Skill followed: `skills/04-storyboard.md` (+ `05`, `06`).

---

## Format & global rules

| | |
|---|---|
| Canvas | 1080×1920, 30 fps, vertical |
| Source | 8 talking-head clips, **HLG HDR** (iPhone, 1920×1080 coded + `-90` rotation → portrait) |
| Raw length | 70.5s → **64.78s** after both-edge pause crops |
| **HDR** | Every clip tone-mapped **HLG→SDR Rec.709** before it hits the timeline. Never import the raw `.MOV`. |
| **Audio** | Original `.MOV`, stream `0:1` (the 4.0 `apac` spatial track has no decoder). No enhanced renders yet. |
| **Transitions** | **Hard cuts only** between shots. Overlays are the exception: they *ease* in. |
| **Motion** | Punch-in / pull-out only (Transform keyframes, not baked). |
| **Captions** | One continuous `kinetic-captions` track, 0→64.78s, word-anchored to **real speech runs**, cue boundaries snapped out of pauses (see `caption-map.mjs`). |
| **Music** | `bgm-vampire-heart.mp3` from 0.00s, flat ~10% under the VO. No ducking. |

## The framing is the opposite of E004 — and the column is narrow

He sits **centre-right**; the reserved blank column is on the **LEFT**, as in E002–E004. But his head
is large here: his hair reaches x≈300–430 depending on the beat, against E004's ≈540. And he
**drifts inside a beat** — in `02_layers` he is far enough left at t=1.5s to fill the frame and not
at t=9.0s. So every card was measured over its **own on-screen window**, never over the whole beat.

| card | box | right edge | his left eye, at its tightest |
|---|---|---|---|
| membership | 32,120 · 344×712 | 376 | **398** ← the binding window |
| flair / invite / stats / perks | 32,120 · 438×887 | 470 | 540 / 585 / 540 / 490 |

The four later cards share one box; membership is smaller because that is the one window where his
face comes far enough left to constrain it. Every card seeps onto his hair — allowed — and leaves
both eyes and his mouth outside it. The column is **width-limited by his face, not by the caption
band**: the card bottoms (832 / 1007) clear y1372 with 350–500px to spare.

Nothing is cropped horizontally. Only the iOS status bar comes off the top (every recording carries
a red screen-recording pill), and each card carries the resulting aspect so nothing stretches.

---

## Beat-by-beat

Legend — **[ZOOM]** camera move · **[SFX]** sound accent · **[CAP]** caption emphasis ·
**[UI]** overlay. Timeline seconds are the built cut.

### 1 · HOOK — `01_hook` · 0.00–10.74

> "Riders, you know what time it is when the bike starts **screaming**. / Yep, you don't stay in the
> same gear, you kick it up a **notch**. / And that's exactly the idea behind **Verified Boost Rider**."

- **[ZOOM]** Open mid-push and hold. The metaphor is the hook — no cutaway, no overlay.
- **[SFX]** `hit-1` on "screaming." (@2.95).
- **[CAP]** "screaming." / "notch." / "Verified Boost Rider" brand.
- *Purpose:* speak rider, not product. The name arrives at 9.55s, after the idea has landed.

### 2 · LAYERS — `02_layers` · 10.74–22.93

> "And yes, **DirtBikeX** is always the real home to free riders, and the verified boost rider is for
> the people who want the next layer, the **flair**, the **stats**, the custom **invites**, and the
> **insider hacks**."

- **[UI]** **`brand-drop` @11.23–16.23.** The wordmark surfaces from the top and settles at **11.78s,
  exactly on "DirtBikeX"**, then flies to the top-right corner as the mark and fades out.
- **[UI]** **`side-screen-membership` @15.00–18.55** — `[SCREEN: open membership]`. Entry in full:
  the profile → the menu (marker on "Membership") → the sheet, with a shrinking circle on the
  verified badge and a marker on "Become a Member".
- **[UI]** **`feature-fan` @19.00–23.40** — the four-up. Three plated icons fan down the left column
  on the words that name them, then the members-only post lands **on his face** and the background
  blurs. See below.
- **[SFX]** `simple-whoosh-2` @11.23 (the logo surfaces) · `shutter` @15.00 · soft `shutter` on each
  icon (19.00 / 19.92 / 20.75) · `hit-1` @21.60 when the post lands and the blur arrives.
- **[CAP]** "DirtBikeX" / "flair," / "stats," / "invites," / "insider hacks." brand.
- *Purpose:* name the tier, then show its four contents in eleven seconds.

### 2b · The four-up fan-out

`rough.md`: *"fan out features sequentially 1, 2, 3, and 4 is recording in the middle (on face),
when the recording comes in, blur background"*.

| # | asset | box | enters | on the word | label |
|---|---|---|---|---|---|
| 1 | `f1_flair.png` | 46,120 · 210² | 19.00 | "the **flair**," | Custom flair |
| 2 | `f3_stats.png` | 46,440 · 210² | 19.92 | "the **stats**," | Deeper stats |
| 3 | `f2_invite.png` | 46,760 · 210² | 20.75 | "the custom **invites**," | Custom invites |
| 4 | `f4_insider.mov` | 160,1065 · 761×270 | 21.60 | the clause "and the insider hacks" | *(none — see below)* |

The three icons are **flat blue transparent PNGs**, not screenshots. They are **plated** (a dark
rounded plate with the orange brand border) and **not recoloured**: a blue verified check is a
universally-read symbol, and retinting it costs the meaning. The plate delivers the brand colour as
a frame instead of repainting the glyph. They sit over a **sharp** background — the blur is the
members-only reveal, and spending it early would cost the payoff.

Item 4 is a real screen recording of a `@teamdirtbikex` post whose body the app has **blurred
because the viewer is not a member**. That blur never resolves; it is the joke and the point. It has
**no label chip** — its own headline names it, and a chip would land at y1392, inside the caption band.

**The fan runs 0.47s past the beat cut (to 23.40), and beat 3's card defers to 23.70.** Item 4 enters
on the clause "and the insider hacks" (21.77) rather than on the literal word "insider" (22.28): at
22.28 the hard cut at 22.93 would leave it 0.65s, which is not a read. Even at 21.60 the seven-word
headline gets ~1.0s at full opacity — enough to register the blur-lock, not enough to read every
word. That is the trade; it is recorded in `edit-notes.md` DECIDE.

### 3 · FLAIR — `03_flair` · 22.93–29.94

> "Once you get the **membership**, you can go ahead and go to Profile Edit and set up your custom
> **flair** so others know you're **verified**."

- **[UI]** `side-screen-flair` @23.70–29.80 — `[SCREEN: Custom flair setting with pointing them out
  boxes, cut out save]`. Markers on "Edit", on the flair row, and a shrinking circle on the blue
  verified badge. **The save step is cut**, exactly as the outline asks.
- **[SFX]** `shutter` @23.70.
- **[CAP]** "membership," / "flair" / "verified" brand.
- *Purpose:* the first perk, and the only one with a place in the app you must be told how to find.

### 4 · INVITE — `04_invite` · 29.94–36.89

> "You can bring fellow riders in with stronger **invite** tools, your custom invite **code**, and you
> get to see who actually **accepted**."

- **[UI]** `side-screen-invite` @30.10–36.75 — `[SCREEN: invite show off]`. The invite tools → the QR
  sheet → the Redeemed tab. **A third party on the Redeemed list is redacted at the source.**
- **[SFX]** `shutter` @30.10.
- **[CAP]** "invite" / "code," / "accepted." brand.
- *Purpose:* the perk that grows the place. It is also the only beat carrying a credential on screen.

### 5 · STATS-INTRO — `05_stats-intro` · 36.89–40.01

> "And if you hold a sponsorship **pass**, you get **deeper stats**."

- **[UI]** `side-screen-stats` @37.05 — one card, spanning **into the next beat**.
- **[CAP]** "pass," / "deeper" / "stats." brand.
- *Purpose:* the handoff to E004's buyer. The shortest beat in the series.

### 6 · STATS-DETAIL — `06_stats-detail` · 40.01–45.57

> "Previous **months**, faster **updates**, and more insight into who actually **engaged** with your
> spot."

- **[UI]** the same card, still up, to 45.40. `[SCREEN: sponsorship open → stats → previous months →
  refresh → engagement detail]` — five states, each on the word that names it: the Sponsorships
  portal, the stat cards, the prev-month chevron, a shrinking circle on the green refresh, and the
  "Who engaged" row.
- **[SFX]** `shutter` @37.05 (the card, one beat earlier).
- **[CAP]** "months," / "updates," / "engaged" brand.
- *Purpose:* prove the upsell is real. The one card that survives a hard cut.

### 7 · INSIDER — `07_insider` · 45.57–51.83

> "Boost Rider also get a special group **chat**, **early** updates, and features I'm testing with the
> community **first**."

- **[UI]** `side-screen-perks` @45.75–51.70 — `[SCREEN: group chat → message through top right
  button, circle it, load message]`. A **shrinking circle** on the top-right button, as asked. The
  chat list's third-party row is redacted at the source.
- **[SFX]** `shutter` @45.75.
- **[CAP]** "chat," / "early" / "first." brand.
- *Purpose:* the perk that is really the pitch — proximity to the person building it.

### 8 · CTA — `08_cta` · 51.83–64.78

> "So no, you don't need this to enjoy the community, but if you want to be part of what I'm
> building, / I can guarantee you this will help shape it. / My name is **Rubio**, and if you want to
> become one, **follow** and go check out my **link** in the **bio**."

- **[UI]** `profile-card` @58.95–61.55, on track **V5, above the captions** (E003's z-order), on the
  **subtitle side**. It enters 0.87s *before* "My" (@59.82) and clears 0.55s before the CTA verb
  "follow" (@62.10).
- **[SFX]** `hit-1` @58.95 (card) · soft `simple-whoosh-1` on "follow" (@62.10).
- **[CAP]** "Rubio," / "follow" / "link" / "bio." brand.
- *Purpose:* refuse the hard sell, then ask once. **No "BOOST" anywhere** — `rough.md` drafted a
  comment CTA, the take says "link in the bio", and the SRT is canonical.

---

## Screen-recording chops (the `[SCREEN: …]` directives)

`rough.md` is the instruction sheet for the overlays. Reproduce the chops with `screen-chop.sh`.
Every boundary lands on a settled frame. **Cutting and freezing are a last resort:** a segment is
dropped only for a genuine wait, and a frame is held only where the source is shorter than its slot.

| directive | recording | beat | cuts |
|---|---|---|---|
| `[SCREEN: open membership]` | `11_screen-membership` | 2 | none |
| `[SCREEN: Custom flair setting …, cut out save]` | `12_screen-flair` | 3 | 1 — the save step, as asked |
| `[SCREEN: invite show off]` | `13_screen-invite` | 4 | 1 — a 1.2s backtrack |
| `[SCREEN: sponsorship open → … → engagement detail]` | `14_screen-stats` | 5+6 | 4 — all measured dead waits |
| `[SCREEN: group chat → … → load message]` | `15_screen-perks` | 7 | 2 — idle head, loading spinner |

## SFX map

Short, recognizable, low-impact — punctuation, not carpet.

| Moment | File |
|---|---|
| "screaming." (@2.95) | `hit-1.mp3` |
| Logo surfaces (@11.23) | `simple-whoosh-2.wav` |
| Each screen card enters | `shutter.mp3` |
| Each fan icon (19.00 / 19.92 / 20.75) | `shutter.mp3`, quieter |
| The insider post + blur (@21.60) | `hit-1.mp3` |
| profile-card (@58.95) | `hit-1.mp3` |
| "follow" (@62.10) | `simple-whoosh-1.wav` |

## DECIDE (human)

- **Privacy.** "Shujin Li / @Rereliii" — a real third party — appears on the invite Redeemed list and
  in the group-chat list. Both are **blurred at the source** by `screen-chop.sh`, so no un-redacted
  frame can reach an export. `登山小鲁` (@dbx) is left in as the founder's own alt — **say if it isn't.**
- **The invite QR is live.** `13_screen-invite` shows a scannable QR for his own invite link,
  captioned "Instagram people welcome!" and capped at 0/3,000. It is on screen ~1.1s at card scale.
  It is left in because it is deliberately public — but publishing is irreversible, so confirm.
- Zoom keyframes are **not baked** (see the `[ZOOM]` lines).
- **No enhanced renders yet.** When they land, swap the video only, drop the tone-map, and re-verify
  frame-sync first (an N×N envelope cross-correlation, 0ms lag, matching frame counts).
- `cover.en-US.md` is not written yet (`skills/02`). The cover copy is **not** bound by the narration:
  if the bio link is the conversion path, say so on the cover.
