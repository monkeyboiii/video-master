# Skill: Kdenlive Edit Preparation

## Purpose

Prepare everything the human needs to assemble and polish the edit in Kdenlive quickly:
selected clips, an edit plan mapped to beats, a **per-beat retention plan**, overlays in
the right format, and (when enabled) a machine-generated rough-cut timeline. Kdenlive is
the human surface — the agent prepares, the human decides.

The edit follows the retention-editing doctrine in `docs/golden-rules.md` (Edit 剪辑
section): first-second grab, a pattern interrupt every 1–3 seconds, SFX as punctuation,
subtitles as navigation, engineered reasons to keep watching — and never over-edited.

**Lock the subtitle→timeline map before editing (learned on S01E002).** The single most
useful pre-edit artifact is a **word-timed caption map** synced to the timeline: every
spoken word with its timecode and its emphasis tag. It is what lets the edit know *where
to look* — which words to color, where each SFX hit lands, where to punch in/out, and
when to drop an overlay. Build it first (from the SRT), then everything downstream —
kinetic captions, SFX placement, zoom cues, overlay in/out points — reads off the same
timeline. Editing before the caption timing is locked means guessing; don't.

## Inputs

- `manifest.yml` — beats (purpose per beat), `assets.raw`, `assets.selected`, variant timing
- `storyboard.md` — the shot plan: framing, transitions, caption/overlay and SFX intents
  per shot (the retention plan's first commitment)
- `script.<locale>.md` — spoken lines **and emphasis words** (they anchor the retention plan)
- **Word-timed caption map** — per-beat `remotion-props/captions.<beat>.json`: each word
  `{t, s, e?}` (text, start-seconds-into-clip, emphasis `brand`|`harsh`). Generated from
  `subtitles/<locale>.srt` by distributing words across each cue and tagging emphasis from
  the script. This is the timeline reference for captions, SFX, zoom, and overlay timing.
- `brief.md` — the designed reactions the edit must serve
- Rendered overlays in `media/overlays/`, `subtitles/<locale>.srt`
- `templates/kdenlive/` seed projects (if present)

## Outputs

- `assets.selected` entries in `manifest.yml`: per beat, source asset + in/out timecodes
- `edit-notes.md` — the assembly plan the human follows in Kdenlive (see below)
- Optionally a seed timeline file in `media/timelines/`, named
  `{VIDEO_ID}_{locale}_v{version}.kdenlive`
- Manifest `status: editing`, `outputs.kdenlive` recorded

## Edit-notes format

`edit-notes.md` is the rough cut in text form. Per beat, in timeline order:

```text
## Assembly plan — en-US

### hook (target 3.5s)

V1: SEL_001 (RAW_001 00:00:04.200–00:00:09.800) — clutch stall, cut on the lurch
V2: DBX-BEG-S01E003_en-US_9x16_hook-title_v001.mov from 0.0s
Audio: VO_EN_001 from 0.0s; engine SFX under, duck −12dB
Retention: punch-in on "wrong bike" (emphasis word); jump cut mid-stall; no static
  stretch >2s in this beat
SFX: hit on the lurch; pop when hook text lands
Notes: hold the stall frame 8 extra frames before cutting
```

zh-CN beats go under their own `## Assembly plan — zh-CN` section — only where selects
or timing differ from en-US; otherwise write "same as en-US" (template comment says the
same).

Every clip is referenced by asset ID + timecode, never by "the good take".

The `Retention:` and `SFX:` lines are **derived, not invented**: they start from the
storyboard's per-shot Transition/SFX intents, adjusted against the real takes. Pattern
interrupts land on the script's emphasis words, punch-ins on key sentences and
reversals, SFX on the moments the beat's `purpose` says matter, and the whole plan
serves the brief's designed reactions. If a flourish can't be traced to
storyboard/script/beat/brief, it doesn't go in.

## The editor's toolbox

What's actually available when planning retention moves (don't prescribe what the
stack can't deliver):

- **Kdenlive (human, on the timeline):** hard cuts / jump cuts (the default), punch-in
  and pull-out via Transform keyframes, speed ramps (our riding footage staple), whip
  pan / match cut when the footage supports it, clip-level audio ducking, the subtitle
  tool (imports our SRT). Fancy built-in transitions are a last resort — hard cut wins.
- **Remotion overlays (agent-rendered, ProRes 4444 on V2):** each composition is a
  retention device — `hook-title` (first-frame grab), `subtitle-track` (kinetic
  captions with keyword highlight), `checklist-card` (save-worthy value, ding-per-tick),
  `stage-cards` (segment reset / pattern interrupt), `lower-third` (context without
  stopping), `cta-card` (ending expectation). Props/renders via
  `skills/05-remotion-graphics.md`. Missing device (e.g. a callout arrow, zoom
  highlight)? That's a new component through the design-system PR path, not a one-off
  editor hack.
- **SFX palette (A2, licensed per `media/README.md`, recorded in `assets.audio`):**
  click/pop, whoosh, hit/impact, ding, riser, record-scratch/glitch, bass drop — usage
  table in `docs/golden-rules.md`. Accents at key moments; breathing room elsewhere.
  **Selection (learned on S01E002):** prefer **short, recognizable, low-impact** cues —
  a soft whoosh, a light click, a camera shutter on a UI pop, a subtle static for
  "scattered/outdated." **Avoid long/deep/boomy** (deep whoosh, sub-drop, heavy impacts)
  unless a beat genuinely needs weight — they read as over-produced and muddy the VO.
  One accent per emphasis word or turn; keep levels low (≈0.4–0.6) and **most seconds
  carry no SFX**. The voice is the priority: music sits ~10% under the VO, not competing.

## Timeline generation policy (current decision)

- **Now:** the human assembles in Kdenlive from `edit-notes.md`. Track layout
  convention: V1 footage, V2 overlays, V3 spare; A1 voiceover, A2 music/SFX. Subtitles
  imported from the SRT via Kdenlive's subtitle tool.
- **Template seeds:** small `.kdenlive` templates with this track layout may live in
  `templates/kdenlive/` (relative paths, saved by the pinned Kdenlive version). They are
  generate-once seeds — never hand-merge or diff Kdenlive-saved XML; regenerate instead.
- **Programmatic rough cut — always via `cli-anything-kdenlive`.** Never hand-write or
  hand-merge MLT/`.kdenlive` XML; assemble through the CLI (installed; see
  `.claude/skills/cli-anything-kdenlive/SKILL.md`) and regenerate, never diff-edit. It's
  REPL-stateful (project new → bin import → add-track → add-clip → `export xml`), emitting
  an MLT/`.kdenlive` with **relative** media paths (portable across machines). Run it from
  **inside the episode media bundle** so paths stay relative; keep the command script tracked as
  `kdenlive-build.repl` in the episode dir (production logic — regenerate from it).
- **Run the repl with `tools/kdenlive-run.sh <build.repl>`, never with a pipe.** The REPL
  refuses non-TTY stdin: `cat build.repl | cli-anything-kdenlive` prints
  `Warning: Input is not a terminal`, executes **nothing**, and **exits 0** — leaving the
  previous `.kdenlive` in place, so the run looks successful and you ship a stale timeline.
  Its subcommands aren't a workaround either: each invocation loads the project file and
  throws its mutations away (`bin import` then `timeline add-clip` → "Track not found: 0").
  `kdenlive-run.sh` hands it a pty via `script(1)`, then asserts the export was written and
  warns if the bytes didn't change. After any regeneration, grep the `.kdenlive` for a clip
  you *removed* — that is the cheapest proof the export really re-ran.
- **Make it Kdenlive-native after every export (learned on S01E002).** The CLI emits
  lightweight MLT that Kdenlive flags as invalid/corrupt: the root `<mlt producer=…>`
  points at a non-existent producer, bin producers are `clipN` with **no** numeric
  `kdenlive:id`, and vertical projects get a 16:9 / non-square sample aspect. After
  `export xml`, run:

  ```bash
  python3 tools/kdenlive-nativize.py media/<VIDEO_ID>/<name>.kdenlive --vertical
  ```

  It repoints the root to `maintractor`, adds a unique `kdenlive:id` to every producer,
  renames `clipN`→`producerN`, fixes the 9:16 profile, and validates that every
  `producer=` reference resolves (fails on any dangling ref). Only then does the project
  open cleanly on another machine. The CLI has no subtitle or alpha-composite transition
  support, so import the SRT and confirm overlay compositing in Kdenlive on open.
- **Chopping screen recordings (learned on S01E003).** App demos are mostly dead time. Cut
  each recording down to **exactly the length of the line it plays under**, with *pure cuts*
  — `-vf "fps=30,select='between(t,a1,b1)+between(t,a2,b2)+…',setpts=N/30/TB"`, muted, no
  transitions. Rules that earned their keep: (a) verify **every boundary lands on a settled
  frame** (contact-sheet the recording, then frame-check each cut) — never mid-animation or
  mid-keystroke; (b) cut typing, spinners and long waits, but **keep a ~0.5s glimpse** of a
  loading step rather than erasing it, or the action looks like it never happened; (c) check
  the **payoff holds** — our RSVP "Going ✓" confirmation was only 0.27s until we rebalanced
  it; (d) align the segment that answers the line's key word (e.g. "reoccurring") to that
  word's timecode from the caption map. Keep the spec in a tracked `screen-chop.sh`.
- **Trim trailing pauses before stitching (learned on S01E002).** Talking-head takes
  usually end with a pause + the stop-recording tap. Before threading clips back to back,
  set each clip's out-point at its **speech end** — detect it with
  `ffmpeg -i clip -af silencedetect=noise=-32dB:d=0.35 -f null -` and use the last
  `silence_start` (+~0.15s) as the out. This removes the dead gap/click between takes and
  tightens the cut; captions/SFX/overlay positions are then computed off the trimmed
  cumulative timeline.
- **Overlays position themselves; the timeline places them full-frame.** A card that must
  sit bottom-left, centered, or lower-third bakes that placement into the Remotion
  component (so the same overlay is correct in Kdenlive *and* any flatten preview) — the
  timeline just drops the full-frame `.mov` at its in-point on an overlay track. Don't
  rely on per-clip Transform for placement of agent-rendered overlays.
  Worked example: `series/app-community/episodes/DBX-APP-S01E002-founder-story/kdenlive-build.repl`
  + `tools/kdenlive-nativize.py`.
- **Template seeds / OTIO** remain fallbacks: small `.kdenlive` seeds in
  `templates/kdenlive/`, or OpenTimelineIO import (Kdenlive ≥ 25.04; carries
  tracks/clips/markers, not effects). Never hand-merge or diff Kdenlive-saved XML —
  regenerate instead.

## Steps

1. From the storyboard + reading script + probe data, choose selects per beat: `assets.selected`
   entries with `source_asset_id`, `in`, `out`, `beat`. Respect per-locale
   `target_duration_sec` (selects may differ slightly per locale). When a clip ends with a
   pause/stop-tap, set its `out` at the **speech end** (silencedetect — see toolbox). Then
   build/refresh the **word-timed caption map** (Inputs) so cut, caption, SFX, and zoom
   positions all reference one locked timeline before anything is assembled.
2. Verify every overlay the beats need exists in `media/overlays/` at the right
   version (else run `skills/05-remotion-graphics.md` first).
3. Write `edit-notes.md` in the format above (if it doesn't exist yet, copy
   `templates/episode/edit-notes.md` and fill the `{{...}}` tokens), complete enough
   that assembly requires no creative guessing — creative *choices* stay flagged as
   `DECIDE:` lines for the human.
4. Write the per-beat `Retention:` and `SFX:` lines from the script's emphasis words,
   the beat's purpose, and the brief's designed reactions. Confirm no beat leaves a
   static stretch over ~3 seconds without an intentional reason.
5. Confirm audio plan per beat: VO segment, music/SFX intent, ducking notes. Every
   music/SFX track must be recorded in `assets.audio` with `source` and `license` —
   only tracks licensed for commercial social use (see `media/README.md`).
6. Update the manifest (`status: editing`, `outputs.kdenlive` planned filename).
7. Run `node tools/validate.mjs`.
8. **After assembly** (before any review export): run the post-edit retention
   checklist from `docs/golden-rules.md` and record the ten answers in
   `edit-notes.md` under `## Retention checklist`.

## Rules

- The manifest's selects are the source of truth; the `.kdenlive` file is a working
  surface. If the human's edit diverges creatively, update `assets.selected` and
  `edit-notes.md` to match reality afterwards (that record feeds the retro).
- Overlays must be ProRes 4444 `.mov` (see `skills/05-remotion-graphics.md`). Never ask
  the editor to key or matte an opaque render.
- **Track order is load-bearing.** Any overlay that bakes its own backdrop is *opaque*, so it
  belongs on a `V2-Backdrop` track **below** the caption track. Layout that works:
  `V1 footage · V2 backdrop · V3 captions · V4 overlays · A1 music · A2 SFX`.
- **iPhone `.MOV` has two audio streams.** `0:1` is the 48 kHz stereo AAC narration; `0:2` is
  a 4.0 `apac` Apple spatial track with **no decoder** (plus six `mebx` data tracks).
  ffmpeg's auto-select and `-map 0:a` can grab the spatial one and fail. In
  `filter_complex`, `[1:a]` picks the first audio stream — correct. Always `ffprobe` before
  muxing.
- **Verify sync before swapping in re-encoded footage** (face enhancement, upscales,
  regrades). Compare frame counts, then cross-correlate RMS envelopes against the original
  audio. Cheap to check; a silently drifted lip-sync is not recoverable downstream.
  Note that enhanced renders usually arrive **already tone-mapped to SDR with rotation
  baked** — re-running the HDR chain on them double-maps and washes the image out.
- **Music serves the voice.** A flat ~10% bed under the VO, running the whole video, is the
  default and it wins. Pushing its entry back (`adelay`) and ducking it around a cue was tried
  on S01E002/E003 and rejected — it draws attention to the seam. If a moment needs lift, spend
  a *short* accent on it, not a sustained bed: a stretched 2.8s whoosh under narration smears
  the line it was meant to sell.
- **Freeze the frame the recording rushes past.** Screen recordings spend 0.5s on the thing the
  viewer needs 1.5s to read. Chop to few, long takes and end each on a **held frame** — grab a
  still and concat it, rather than making the viewer catch it live. Hold the payoff, cut the
  waiting (spinners, saves, toasts, transitions): the result is what the narration promised.
- **Redact real PII in b-roll, and cover the motion with the geometry.** Real usernames /
  faces / third-party logos in screen recordings get blurred (`boxblur` over a crop, overlaid
  back). To follow content that only moves along one axis (a list that slides in horizontally),
  use a **full-width band at the row's fixed y** — the content stays in its band, so no
  per-frame tracking is needed. Gate each band with `enable='between(t,a,b)'`, and where a
  band would smear an unrelated incoming scene (a nav slide bringing in a bright screen), just
  **hard-cut the transition out** (`select`) rather than blurring through it. Check the exact
  boundary frame: an off-by-one in the enable window leaks one PII frame onto the next scene.
- **Blur behind an overlay = blur V1 in the compositor, not a baked backdrop (Route B).** When
  a logo / QR / card needs a soft background, the honest way is to **blur the *actual footage***
  underneath it, ramped with a ~0.35s fade — the background is then exactly the frame, which a
  separately-extracted backdrop clip never quite matches. **Blur only — don't dim.** Darkening
  the footage drops the mood of the whole shot; the blur alone is enough separation. The overlay
  stays transparent; the blur is an effect on the V1 clip (keyframed Blur on the Mac; baked in
  the ffmpeg preview via a faded, blurred copy overlaid on the sharp base). Put cards that must
  clear the subtitles on the subject's face, not the lower third. A screen-recording cutaway can
  be presented the same way — the phone scaled to a card, centred over the blurred subject,
  snapping in on a shutter SFX — instead of full-bleed.
- **`setpts` drops the frame-rate hint.** After `fps=30,select=...,setpts=N/30/TB`, a following
  `tpad` reads `stop_duration` against a bogus rate (1.11s silently became 2 frames) and libx264
  quietly encodes 25 fps. Re-assert `fps=30` after `setpts`, and pass `-fps_mode cfr -r 30`.
  Always `ffprobe nb_frames,r_frame_rate` the chop — a wrong-fps clip still *looks* fine.
- Timecodes are `HH:MM:SS.mmm`, source-relative (not timeline-relative).
- Every retention move has a function (emphasis, turn, explanation, humor, information
  gap). If every second screams, nothing lands — over-editing fails review.
- Don't commit anything from `media/` — timelines included.

## Done criteria

- Every beat has selects with timecodes and an edit-notes entry covering video, overlay,
  audio, `Retention:`, and `SFX:` lines — each move traceable to script/beat/brief.
- All referenced overlays/VO exist at the stated versions.
- Open questions for the human are explicit `DECIDE:` lines, not silent choices.
- (Post-assembly) the ten-item retention checklist is answered in `edit-notes.md`.
- `node tools/validate.mjs` passes with `status: editing`.
