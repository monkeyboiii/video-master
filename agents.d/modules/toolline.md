---
kind: why
status: current
summary: What this repo makes and what it deliberately does not — four jobs against a pinned Remotion workspace, and where the rest of the work went.
---

# The tool-line

This repo makes **parts of a video**, not a video. A human writes the script, records the
narration, shoots, and cuts. What comes back here is a file and a request for one of four things.

```text
script + raw narration ──▶ [ voice ]  ──▶ spliced VO
                                              │  (shoot and cut happen OUTSIDE this repo)
                                              ▼
                    cut video/audio ──▶ [ caption ] ──▶ captions, sidecar or burned in
                                    ──▶ [ overlay ] ──▶ alpha .mov to composite
                                    ──▶ [ sfx     ] ──▶ effects placed on named beats
```

## How the repo is organized

Not around "one video file" — around the thing that actually varies:

```text
series → episodes → language variants → platform exports
```

- A **series** is a positioning decision (`series/<slug>/series.yml`).
- An **episode** is one topic with one core message
  (`series/<slug>/episodes/<VIDEO_ID>-<slug>/`).
- A **variant** is a language edition — `en-US`, `zh-CN` — and they are **siblings, not
  translations** ([localization.md](localization.md)).
- An **export** is one rendered deliverable for one platform, recorded in `manifest.yml`, never
  committed.

Git tracks production logic — manifests, subtitles, props, the design system, review notes.
External storage holds the heavy media. `manifest.yml` is what connects the two, and
`tools/validate.mjs` is what says they still agree.

**Not done:** the six-stage lifecycle that used to sit here went with the pipeline. A stage
counter was meaningful when the repo owned idea→publish; with four jobs that arrive independently
and out of order, it only ever encoded which stage someone last remembered to bump.

## Module layout

| Concern | Where | Notes |
|---|---|---|
| the four jobs, in detail | [remotion-overlays.md](remotion-overlays.md), [captions.md](captions.md), [voice-and-render-qc.md](voice-and-render-qc.md) | one doc per job family; the overlay doc carries the render contract |
| the engine | `packages/remotion-graphics` | Remotion **4.0.484**, 20 components, alpha defaults in `calculateMetadata` |
| the verbs | `tools/` | `render-overlays.mjs`, `burn-subtitles.py`, `retime-subtitles.py`, `probe-media.mjs`, `validate.mjs`, `new-episode.mjs` |
| cutting silence | [`agents.d/skills/auto-editor`](../skills/auto-editor/SKILL.md) | the voice job's tool |
| naming, locales, flow | [naming-conventions.md](naming-conventions.md), [localization.md](localization.md), [toolline.md](toolline.md) | every tool joins on the names |
| episode history | `series/` | read-only; what was actually shipped |

## Architecture decisions

### The repo owns pixels and audio, not ideas

Scripts, topics, storyboards, covers and retrospectives are written by a human outside this repo.
Nine pipeline stages used to describe that work here; 1,437 lines of it were removed on
2026-09-07 because the estate had stopped using them, and reading them was not free — the routing
table sent an agent through a 314-line content framework before it reached a command.

**Not done:** the stages were not archived into this repo under another name. They are in git
history, and `agents.d/modules/.renames.tsv` records what moved where. **The threshold that flips
this:** scripts start being written here again.

### Remotion's API is linked, never vendored

`remotion.dev/docs` is the authority for every Remotion API. This repo records only what was
*chosen* — the codec, the model, the composition contract — because the workspace is pinned at
4.0.484 and a copied API doc rots silently against a pin that moves on the next upgrade.

**Not done:** no `docs/remotion/` mirror, no copied signatures. A doc here that quotes an API
quotes it as a link.

### Remotion's own agent skills are installed, and they are why "link, don't vendor" works

`npx remotion skills add` installs 12 skills from `remotion-dev/skills` into
`packages/remotion-graphics/.agents/skills`. Seven bear on the four jobs — `remotion-captions`,
`remotion-render`, `remotion-markup`, `remotion-studio`, `remotion-docs`, `remotion-upgrade` and
the `remotion-best-practices` router; the rest (`create`, `saas`, `maps`, `interactivity`,
`multimedia`) are for building apps, not videos, and cost nothing because a skill is only read when
its description is chosen.

They carry a `version:` that tracks Remotion itself — currently **4.0.521 against a workspace
pinned at 4.0.484**, so they run slightly ahead. `npx remotion skills update` is what moves them,
and that is exactly the argument against vendoring API docs here: upstream ships and versions this
knowledge, so a copy in this repo would be a second one nobody updates.

**Two skill homes, different owners.** `agents.d/skills/` is ours and the harness links it
(`dbx skills sync`); `packages/remotion-graphics/.agents/skills/` is Remotion's and its CLI
maintains it. Do not merge them — `remotion skills update` would lose anything hand-written, and
the harness would start syncing skills it does not own.

**Not done:** the CLI was not used to install them. `remotion skills add` prompts for a selection
and its `--yes`/`-y` flags did not take in a non-interactive shell, so the set was copied from the
upstream repository instead. `update` still manages them.

### The cut comes from outside, so this repo has no timeline

Kdenlive editing lived here and does not any more: the shoot is cut and synced elsewhere and
arrives as a file. `tools/kdenlive-*` and the `cli-anything-kdenlive` skill went with it.

**Not done:** no replacement editor, and no attempt to own the timeline in Remotion. Remotion
renders *parts*; the compositor assembles them. **The threshold:** the estate decides to assemble
in Remotion, at which point `@remotion/transitions` and a sequence composition become the answer
rather than an editor.

### Transcription is local whisper.cpp

`@remotion/install-whisper-cpp` runs whisper.cpp on this box: no per-minute cost, and unreleased
footage is never uploaded. `toCaptions()` hands `@remotion/captions` its `Caption` shape directly.
It needs a **16 kHz WAV** — converting first is not optional.

**Not done:** WhisperX, which is not a Remotion package and was asked for by name. Remotion's four
caption sources are `install-whisper-cpp` (local), `whisper-web` (browser), `openai-whisper` (API)
and `elevenlabs` (API); `@remotion/captions` normalizes all four. **The threshold:** a diarization
or forced-alignment need whisper.cpp cannot meet, or a box without the CPU budget — then
`@remotion/openai-whisper`.

### Sound effects come from remotion.media

`@remotion/sfx` and the `remotion.media` CDN are CC0, need no attribution, and are peak-normalized
to −3 dB. A URL works without installing the package: `https://remotion.media/whoosh.wav`.

**Not done:** no library of our own, and no per-effect licence tracking, because CC0 removes the
reason for one. Further free sources when the CDN lacks something: freesound.org, kenney.nl,
soundcn.xyz; ElevenLabs for generated effects. **The threshold:** a commissioned brand sound.

## Things intentionally left alone

- `packages/remotion-graphics` — 20 components and the alpha defaults are the visual language.
  The restructure did not touch a component.
- `series/` and `media/` — shipped episodes are history, not inputs. Media stays outside git.
- `templates/` — `remotion-props` is the contract a beat renders from.
- The three surviving docs were **renamed, not rewritten**. Their rules and scars — the
  `backdrop-filter` trap, the width-budget rule, the safe-box warning, the `--props` flat-object
  trap — cost real renders to learn and are carried whole.

## Debugging

- **an overlay renders opaque** — a background colour is set on the composition. Fix the
  component; do not key it out downstream. See [remotion-overlays.md](remotion-overlays.md).
- **an overlay renders placeholder text** — `--props` was handed the whole locale file. It takes
  the flat per-composition object; the whole file silently renders defaults.
- **`backdrop-filter` did nothing** — an overlay renders against transparency, so there is no
  footage behind it. Bake the backdrop as a prop instead.
- **captions drift after a re-cut** — `tools/retime-subtitles.py`, not a re-transcribe.
- **whisper.cpp produces nothing** — the input was not 16 kHz WAV.

## Manual verification

1. `node tools/validate.mjs` — the episode's manifest and outputs agree.
2. `node tools/probe-media.mjs <cut>` — what actually arrived, before rendering against it.
3. `node tools/render-overlays.mjs series/<series>/episodes/<ep> <locale>` — overlays for the
   beats the manifest calls for.
4. `ffprobe -v error -show_entries stream=pix_fmt -of csv=p=0 <overlay>.mov` → `yuva444p*` (alpha; the bit depth is ffmpeg's choice — 12-bit on ffmpeg 8).
