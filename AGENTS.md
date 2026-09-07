# DirtBikeX Video Agent Guide

This repo makes **parts of a video**, not a video. A human writes the script, records the
narration, shoots and cuts. What arrives here is a file and a request for one of four things.

Read [`agents.d/modules/toolline.md`](agents.d/modules/toolline.md) once — what this repo does,
what it deliberately does not, and why. Then read only the doc for the job you were asked for.

## The four jobs

| Asked for | Read | Produces |
|---|---|---|
| splice the raw narration, place sound effects | [voice-and-render-qc.md](agents.d/modules/voice-and-render-qc.md) | a spliced VO track; effects on named beats |
| subtitles for a cut | [captions.md](agents.d/modules/captions.md) | captions as data, sidecar or burned in |
| an overlay, a segment, a background asset | [remotion-overlays.md](agents.d/modules/remotion-overlays.md) | alpha `.mov` to composite |
| QC a render before it ships | [voice-and-render-qc.md](agents.d/modules/voice-and-render-qc.md) | measured pass/fail, not an eyeball |

Names, locales and how an episode flows: [naming-conventions.md](agents.d/modules/naming-conventions.md),
[localization.md](agents.d/modules/localization.md),
[production-model.md](agents.d/modules/production-model.md).

## Not this repo's job

Topics, scripts, storyboards, covers, retrospectives — written by a human, elsewhere. The shoot,
the cut and the sync happen outside; this repo never owns the timeline. Removed 2026-09-07;
`agents.d/modules/.renames.tsv` records what moved and git history holds the rest.

## Repo map

```text
agents.d/modules/   the why: one doc per job, plus toolline.md
agents.d/skills/    auto-editor — cutting silence out of a raw take
packages/remotion-graphics/   the engine: Remotion 4.0.484, 20 components, alpha defaults
tools/              the verbs: render-overlays, burn-subtitles, retime-subtitles,
                    probe-media, validate, new-episode
templates/          blank artifacts — never edit in place
series/             shipped episodes; read-only history
media/              outside git (~3 GB)
```

## Rules

- **Remotion's API is at remotion.dev/docs.** This repo records what was *chosen*, never a copy of
  the API — the workspace is pinned at 4.0.484 and a copy rots against it.
- **Overlays are ProRes 4444 with alpha (`yuva444p*`).** Set by `calculateMetadata`, so a bare
  `npx remotion render <CompId>` is already correct. Never deliver WebM to the edit.
- **`--props` takes the flat per-composition object**, not the whole locale file. The whole file
  renders placeholder defaults and says nothing.
- **Measure, don't eyeball.** `tools/validate.mjs` and `ffprobe` decide whether a render shipped.
