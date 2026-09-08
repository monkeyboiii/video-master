---
kind: note
status: proposal
summary: 分镜设计 as a parsable file plus a placeholder previz render — one episode, one experiment, deliberately not yet a convention.
---

# 分镜设计 — a parsable storyboard, and a previz you can cut against

**This is one experiment on one episode.** S05E002 has a `storyboard.yml`, a checker and a
renderer; no other episode has any of them, there is no skill, and nothing in `tools/vm check`
requires one. It is written down so the next person can decide whether it earns a convention —
not because it is one.

## The problem it was built for

The footage does not exist. A short in this format lives or dies on its cut rhythm, and the only
way to judge rhythm before a shoot is to put something on screen at the real lengths. The
alternatives were a paper storyboard (says nothing about timing) and waiting for a shoot (too
late to change the script).

## Three files, three owners, no restatement

| File | Owns | Does NOT carry |
|---|---|---|
| `manifest.yml` | how long each beat is (`target_duration_sec`) | what is on screen |
| `storyboard.yml` | what is on screen, per cut | any duration |
| `script.<locale>.md` | what is said, and which words are emphasised | timing, shots |

**A cut has a `share`, not a duration.** It is a relative weight inside its beat, so retiming a
beat retimes its cuts and the two cannot disagree. This is the one decision worth keeping if
everything else here is thrown away: the repo has already been bitten by two statements of one
number — the Docs-table kind drift in the harness, `versions.lock` against the gitlink — and a
storyboard carrying its own seconds is the same defect waiting for a re-cut.

**The unit is a cut, not a beat.** A beat is a sentence; this format cuts three or four times
inside one. S05E002 is 13 beats and 36 cuts, median 1.20s. A storyboard with one shot per
sentence cannot describe the thing that makes the format work.

## What checks what

```bash
node tools/storyboard-check.mjs S05E002 --cuts   # beats agree, vocabularies valid, cut timings
node tools/previz-props.mjs      S05E002         # -> remotion-props/previz.<locale>.json
cd packages/remotion-graphics && npx remotion render previz-storyboard out.mp4 \
  --props=../../series/S05/E002-mxgp-shanghai-this-weekend/remotion-props/previz.zh-CN.json \
  --scale=0.5 --codec=h264                        # ~31s for 41.85s at 1080x1920
```

`storyboard-check` exports `timeline()` and `previz-props` imports it, so **cut timing has one
implementation**. A previz that computed its own would drift from the checker that blesses it,
and the drift would look like a rendering bug.

The checker rejects a word outside its vocabulary rather than rendering a default. A typo that
renders something plausible is worse than one that fails: `camera: snapzoom` would have drawn a
static frame and read as a deliberate choice. Verified against four induced failures — a bad
vocabulary word, a beat with no cuts, a zero `share`, and a reordered beat — each caught.

## Negative space

- **No sfx are played.** The storyboard's `sfx` names are cues for the edit; the previz draws
  them as marks so the cut points are visible. `toolline.md` records that effects come from
  `@remotion/sfx` and the CC0 `remotion.media` CDN — mapping each cue to a file there is the
  edit's job, and **UNVERIFIED** until someone does it.
- **No `storyboard.<locale>.yml`.** Shots are shared across editions and only captions differ.
  Per `localization.md` the variants are siblings rather than translations, so an edition wanting
  different shots gets its own file — nothing here assumes zh-CN, and nothing pretends the split
  has been needed yet.
- **`tools/vm check` does not run the storyboard checker.** Wiring it in would make a storyboard
  mandatory for every episode, and twelve of thirteen episodes do not have one. The threshold
  that flips this: a second episode gets a storyboard voluntarily.
- **No skill.** `skills/README.md`'s test is whether a model must choose it from a description at
  runtime. Two named commands in a fixed order are a runbook, and this page is it.

## Debugging

- **a cut renders but reads as a still** — its `camera` is `static` or `freeze`, which is a legal
  design choice; check the storyboard before changing the renderer.
- **the slate or a title is unreadable** — the field is a LIGHT one (`sky`, `mall`) and something
  is drawing pale ink. `PrevizStoryboard.tsx`'s `BG` table carries a `dark` flag per field and the
  ink derives from it; the first version hardcoded light-on-dark and the 希望别摔 title ghosted
  into its own white halo on the sky beat. Nothing about that was visible in an exit code.
- **the previz is silent** — it is. No audio is mixed in; the narration is a separate artifact
  from `/auto-narrate`, and the captions are what carry the words here.
- **captions missing from the previz** — `previz-props.mjs` prints a `note` line naming the
  `/auto-narrate --write` command when the captions file is absent, and renders without them.
