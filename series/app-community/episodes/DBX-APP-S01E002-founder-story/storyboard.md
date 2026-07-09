# Storyboard / Edit Plan — DBX-APP-S01E002 "founder-story" · en-US

> **Status: PLAN — for your review before I thread & edit.** Nothing rendered yet.
> Content is locked (recorded). This is the execution plan: cuts, zooms, SFX,
> streaming captions, music, HDR.

---

## Format & global rules

| | |
|---|---|
| Canvas | 1080×1920, 30 fps, vertical |
| Source | 6 talking-head clips, **HLG HDR** (iPhone), founder to camera |
| Raw length | ~69.7s → **target ~60s** after tightening pauses |
| **HDR** | Every clip **tone-mapped HLG→SDR Rec.709** before it hits the timeline (fixes E001's pale look — validated). Nothing enters Kdenlive as raw HDR. |
| **Transitions** | **Hard cuts only.** No dissolves, wipes, or effect transitions — anywhere. |
| **Motion** | The *only* dynamic move is **punch-in / pull-out** (scale keyframes): zoom in to press on emphasis, pull out to open up on reveals. |
| **SFX** | Accent the emphasis words / turns only — punctuation, not carpet. Palette below. |
| **Captions** | **Streaming kinetic captions** — words appear incrementally, like a message typing out — with **color emphasis** on keywords. Rendered as a Remotion overlay, not a flat SRT burn. |
| **Music** | `bgm-vampire-heart` under the whole piece, ducked −16 dB under VO, lifting in gaps. |

### Caption color scheme (streaming overlay)

- **Base:** white, semi-bold, soft drop shadow, bottom-third safe.
- **Emphasis-positive** → DBX accent (chartreuse `#D8FF3A`) — product & payoff words.
- **Emphasis-punch** → hot coral (`#FF4D4D`) — the hard/negative beats.
- Reveal: word-by-word fade+rise (~60–90 ms/word), synced to the VO. Key words *pop*
  (quick 1.1× scale) as spoken. `DECIDE:` confirm the two hex values against brand.

---

## Beat-by-beat

Legend — **[ZOOM]** camera move · **[SFX]** sound accent (file) · **[CAP]** caption &
color · **[CUT]** where to tighten · **[UI]** feature cutaway.

### 1 · HOOK — `01_hook.MOV` (8.7s → ~7s)

> "**Nobody** tells you this when you first start dirt biking. The hard part is not
> learning how to ride — it's finding somebody who **gets it**."

- **[ZOOM]** Open already mid-push (energy from frame 1); slow punch-in across the line; small snap-in on "gets it."
- **[CUT]** Tighten the breath between "…dirt biking." and "The hard part" — hard cut.
- **[SFX]** Soft `Riser 1` under the first line → `Hit 2` lands on "gets it." Optional `Deep Whoosh 1` on the jump cut.
- **[CAP]** "**Nobody**" (coral, pops first frame) … "**gets it**" (chartreuse).
- *Purpose:* first-second grab + name the real problem (belonging, not skill).

### 2 · FIRST RIDE — `02_first-ride.MOV` (11.6s → ~10s)

> "My first real ride was **brutal**. It was **100 degrees** outside, I was sweating
> through everything, my legs were shaking, my hands were tired, and honestly I could
> barely stay on the bike."

- **[ZOOM]** Punch-in on "brutal," then small escalating push-ins on each hardship (sweating → legs → hands).
- **[SFX]** `Deep Hit` on "brutal"; low `Sub Drop` under "100 degrees"; soft `Hit 1` tick on each hardship clause.
- **[CAP]** "**brutal**" (coral, pop) · "**100 degrees**" (coral) · hardship clauses stream fast, one at a time, white.
- *Purpose:* earn the story with a vivid, physical low. Relatable, not heroic.

### 3 · ADDICTIVE (the turn) — `03_addictive.MOV` (11.5s → ~10s)

> "But you know what the crazy thing is? I couldn't stop thinking about it. That's when
> I realized dirt biking is **addictive** — and it gets even better when you have
> somebody to **share it with**."

- **[ZOOM]** Slight **pull-out** on "couldn't stop thinking about it" (release), then punch-in on "addictive," a touch more on "share it with."
- **[SFX]** `Riser 2` into "addictive" → clean `Hit 3` on the word; warm nothing under "share it with" (let it breathe, music lifts).
- **[CAP]** "**crazy thing**" (chartreuse) · "**addictive**" (coral, big pop) · "**share it with**" (chartreuse).
- *Purpose:* the pivot from hardship → love → *the point of the app* (sharing it).

### 4 · PROBLEM — `04_scattered.MOV` (7.5s → ~6.5s)

> "But most of what I found online felt **scattered**, **outdated**, or just not the way
> I wanted it to be built."

- **[ZOOM]** Nearly static, faint push — a colder, flatter feel than the beats around it.
- **[SFX]** **`shutter` @31.55** (phone card snaps in) · `radio-static` on "scattered/outdated".
- **[CAP]** "**scattered**" + "**outdated**" in coral, over the b-roll.
- **[UI]** **BUILT:** `07_scattered-apps` phone card (31.55–35.95) — real app b-roll that
  literalizes "scattered/outdated": a dead search ("No sites found") under "scattered," a
  member list with names/faces **redacted** under "outdated," then a rival forum with its
  **logo blurred**. Presented like the invite card — the phone scaled + centred over the
  **blurred** (not dimmed) founder, **snapping in on a shutter**. Baked via `broll-process.sh`.
- *Purpose:* name the gap the product fills — briefly, then move.

### 5 · BUILT IT + FEATURES — `05_built-it.MOV` (16.8s → ~14s, longest)

> "So as a **software engineer**, I set out to do the one thing I know how — build
> **DirtBikeX** myself. The kind of place I wish existed. **No bloat.** You don't have
> to **post the same thing twice**. **21 languages.** All the good stuff."

- **[ZOOM]** Confident punch-in on "build DirtBikeX myself," then a small snap-in per feature word.
- **[SFX]** `Mechanical Keyboard` under "software engineer" (typing); `Deep Hit 2` on "DirtBikeX"; `1 Click Mouse` per feature; light `Shutter 5Dm4` as each UI flashes.
- **[UI]** *Light* cutaways only (0.6–0.8s each, cut back to face) — **not** a montage:
  - "**No bloat**" → clean app home flash.
  - "**post the same thing twice**" → cross-post / embed flash (reuse E001 `phone-embed` concept).
  - "**21 languages**" → language-switch flash (reuse E001 `phone-language` concept).
- **[CAP]** "**software engineer**" (chartreuse) · "**DirtBikeX**" (coral, biggest pop) · "**No bloat**" / "**twice**" / "**21 languages**" each pop chartreuse as said.
- *Purpose:* solution + proof, in the founder's own hands. Features are seasoning.

### 6 · CTA — `06_cta.MOV` (13.6s → ~12s)

> "Most importantly, a real chance for **us to be seen** by fellow riders. So if you've
> been looking for dirt bike people like me, go check out the **invite code in the
> description**. My name is **Rubio**, and I'll be waiting for you there."

- **[ZOOM]** Warm settle — slight pull-out to a stable medium; one punch-in on "invite code."
- **[SFX]** `Riser 3` under "us to be seen"; bright `Hit 2` + a soft ding on "invite code in the description" (points down); gentle resolve on "waiting for you there."
- **[CAP]** "**us to be seen**" (chartreuse) · "**invite code**" (coral) with a down-arrow to the description · "**Rubio**" name pop.
- **[UI]** **BUILT:** `invite-card` (the real QR card) over the **face** on "invite code in
  the description" (59.5–63.0), with V1 **blurred** (no dim) behind it (Route B, 0.35s fade) so
  the QR is off the subtitle line. `profile-card` on "My name is Rubio" holds to the end.
- *Purpose:* turn the story into one action — grab the invite code.

---

## SFX map (from `media/DBX-APP-S01E002/sfx/`)

| Moment | File | Type |
|---|---|---|
| Hook build → land | `Riser 1.mp3` → `Hit 2.mp3` | riser + hit |
| Jump cuts | `Deep Whoosh 1.wav` | whoosh |
| "brutal" | `Deep Hit.wav` | impact |
| "100 degrees" bed | `Sub Drop.mp3` | sub |
| Hardship ticks | `Hit 1.mp3` | soft hit |
| "addictive" turn | `Riser 2.mp3` → `Hit 3.mp3` | riser + hit |
| "scattered / outdated" | `Glitch 1.mp3`, `Glitch 2.mp3` | glitch |
| "software engineer" | `Mechanical Keyboard.wav` | typing |
| "DirtBikeX" | `Deep Hit 2.wav` | impact |
| Feature clicks | `1 Click Mouse.wav` | click |
| UI flashes | `Shutter 5Dm4.mp3` | shutter |
| CTA build | `Riser 3.mp3` | riser |
| "invite code" | `Hit 2.mp3` + ding | hit |

*Accent, don't carpet — most seconds carry no SFX. Every hit lands on an emphasis word.*

## Music

- `bgm-vampire-heart.mp3` under the entire piece, **−16 dB** beneath VO (auto-duck on A1).
- Dynamics by beat: soft (hook) → low/tense (first-ride) → **lift at "addictive"** →
  dip (problem) → driving/confident (built-it) → warm resolve (CTA).
- `DECIDE:` confirm this single track carries all 60s, or add a second cue at the "addictive" turn.

## HDR pipeline (the E001 fix)

Each `narration/NN_*.MOV` → tone-mapped → `footage/NN_*_sdr.mov` (SDR Rec.709), which is
what the timeline uses:

```
ffmpeg -i in.MOV -vf "zscale=t=linear:npl=100,format=gbrpf32le,\
zscale=p=bt709,tonemap=tonemap=hable:desat=0,\
zscale=t=bt709:m=bt709:r=tv,format=yuv420p" -c:v prores_ks -profile:v 3 -c:a copy out.mov
```

Validated on `02_first-ride` (natural vs pale). Runs on the static ffmpeg 7.0.2 (has
`zscale`+`tonemap`); the bundled Remotion ffmpeg can't and mustn't be used for this.

---

## Assembly path (after you approve)

1. **Tone-map** all 6 clips → `footage/*_sdr.mov`.
2. **Render overlays** (Remotion, ProRes 4444): the **streaming-caption track** (new/updated `subtitle-track` component with color-emphasis + word reveal) and the 3 light UI feature flashes for beat 5 + the end card.
3. **Rough-assemble** via `cli-anything-kdenlive` from inside the bundle (relative paths, portable): V1 tone-mapped clips (hard cuts, tightened), V2 caption + UI overlays, A1 VO (clip audio), A2 SFX + music. Emit `founder-story.kdenlive`.
4. **You polish on Mac:** the punch-in/pull-out zoom keyframes and final trim timing (the human-judgment moves), then render.

`DECIDE:` items to confirm — (a) caption hex colors, (b) beat-4 cluttered-feed flash on/off,
(c) single vs two music cues, (d) do you want me to pre-place SFX at emphasis timecodes in
the rough cut, or leave A2 empty for you to place on Mac.
