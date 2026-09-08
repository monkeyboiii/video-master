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
seasons → episodes → language variants → platform exports
```

- A **season** is the category (`series/S03/`), and its `README.md` is what makes the number mean
  anything — `S03E003` reads as "the third episode of the 100-track challenge" only because that
  file says what S03 is. **Not done:** there is no `series.yml` any more. A series-level manifest
  sitting above three seasons could only ever describe one of them, and its `season:` field was
  demonstrably wrong on disk — it said `1` while holding S01 through S03.
- An **episode** is one topic with one core message (`series/S0N/E0NN-<slug>/`), optionally linked
  to another by `lineage:`.
- A **variant** is a language edition — `en-US`, `zh-CN` — and they are **siblings, not
  translations** ([localization.md](localization.md)).
- An **export** is one rendered deliverable for one platform, recorded in `manifest.yml`, never
  committed.

Git tracks production logic — manifests, subtitles, props, the design system, review notes.
External storage holds the heavy media. `manifest.yml` is what connects the two, and
`tools/vm check` is what says they still agree.

**Not done:** the six-stage lifecycle that used to sit here went with the pipeline. A stage
counter was meaningful when the repo owned idea→publish; with four jobs that arrive independently
and out of order, it only ever encoded which stage someone last remembered to bump.

## Module layout

| Concern | Where | Notes |
|---|---|---|
| the four jobs, in detail | [remotion-overlays.md](remotion-overlays.md), [captions.md](captions.md), [voice-and-render-qc.md](voice-and-render-qc.md) | one doc per job family; the overlay doc carries the render contract |
| the engine | `packages/remotion-graphics` | Remotion **4.0.484**, 20 components, alpha defaults in `calculateMetadata` |
| the verbs | `tools/` | `vm` (the series tree), `render-overlays.mjs`, `render-captions.sh`, `burn-subtitles.py`, `retime-subtitles.py`, `probe-media.mjs`, `validate.mjs` |
| cutting silence | [`agents.d/skills/auto-editor`](../skills/auto-editor/SKILL.md) | the voice job's tool |
| narrating a cut | [`agents.d/skills/auto-narrate`](../skills/auto-narrate/SKILL.md) | Kokoro-82M; the caption rows come out of the same pass |
| styling captions | [`agents.d/skills/video-captions`](../skills/video-captions/SKILL.md) | the two locale modes, the striped band, the transparent delivery master |
| naming, locales, flow | [naming-conventions.md](naming-conventions.md), [localization.md](localization.md), [toolline.md](toolline.md) | every tool joins on the names |
| the series tree | `series/S0N/E0NN-slug/` | one folder per season; each season's `README.md` says what it is |
| shared props | `props/<name>/base.json` | promoted from episodes, referenced by `$ref`; `vm props` moves them either way |
| episode history | `series/` | read-only; what was actually shipped |
| the heavy media | `media/` | outside git, ~3 GB; `manifest.yml` is what connects it to the tree |

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

### The TTS stack is a cache, not a dependency

`tools/tts/` is ~48 KB of Python in the repo. Everything it needs to run — a pinned Python 3.12,
CPU torch, kokoro, misaki, and the checkpoint — is ~1.7 GB and lives in
`${DBX_TTS_DIR:-~/.cache/dbx-tts}`, **beside the repo and never in it**. That is the same rule
`tools/transcribe.mjs` already follows for whisper.cpp, for the same reason: per-box, large, and
reproducible from a lockfile.

`tools/tts/ensure.sh` is the only thing that downloads and every entry point calls it first, so a
checkout that never narrates never pays for any of it. Deleting the cache directory costs a
re-download and nothing else.

Python 3.12 is pinned rather than taken from the box: Ubuntu 26.04 ships 3.14 as its only
interpreter and this stack has no wheels for it. uv fetches a standalone 3.12 without touching
the system one — which is also why uv is installed on demand and nothing else uses it.

`espeak-ng` is a system package and is **not** installed silently; `ensure.sh` reports it missing
and prints the apt line. Installing system packages on someone's box is their call, not a
side effect of asking for a voice.

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

### `vm` is this repo's `dbx`

The series tree grew facts that no per-episode validator could see. Season shape, two episodes
claiming one id, a lineage edge pointing at nothing, a props `$ref` with no catalogue entry — all
cross-episode, all invisible from inside one directory, and `tools/validate.mjs` is structurally
unable to check any of them because it is handed one episode at a time.

`tools/vm` is the entry point that can. It is shaped after `dbx` on purpose — a bare verb prints
what it found, `--json` is for machines, a non-zero exit is a real error — because that is the
muscle memory in this estate and a second dialect would cost more than it bought.

| Verb | Answers |
|---|---|
| `vm check [--json]` | is the tree correct — shape, naming, manifests, lineage, props refs |
| `vm tree` | what exists, at what status, linked to what |
| `vm new S0N slug` | scaffold an episode in a season, `--parent`/`--follows` for a companion |
| `vm link ID --parent … --relation …` | write a lineage edge, both ends verified, or `--clear` |
| `vm props where NAME` | every episode using a prop set — the question that had no answer |
| `vm props index` | every prop set, most-used first, catalogued ones marked |
| `vm props promote\|demote NAME` | move a prop set into or out of the catalogue. **Reversible** |
| `vm selftest` | run `vm` against fixture trees that are each wrong in one specific way |

**`repos.toml` declares `verify = "tools/vm check"`**, so this is what `dbx check` runs for this
repo. That one line is the whole integration: the plumbing already existed and was pointed at the
narrower command.

**`vm selftest` exists because `vm check` cannot grade itself.** Running the checker against the
real repo answers "is the repo right" and can never answer "is the checker right" — a checker that
passes everything looks exactly like a clean tree. Each fixture is wrong in one way (a dangling
`lineage.parent`, a cycle, a `$ref` with no entry, two episodes claiming one id) and asserts the
checker says so. Without it the migration had no way to tell green-because-correct from
green-because-blind.

### Props are promoted, not migrated

Before the catalogue: 48 props files, 34 distinct names, 8 names used by more than one episode
(`profile-card` in four, `captions.all` in four), 2 byte-identical. Changing a shared card meant
`find`, then N edits, and nothing answered "where is this used".

A promoted prop set lives at `props/<name>/base.json` and each episode keeps a
`{"$ref": "<name>", …overrides}` file. Overrides are shallow-merged, deliberately: a deep merge
makes it impossible to see from the episode file alone what the rendered object will be.

**Promote never invents a base.** Keys the episodes agree on become the base; keys they disagree on
stay as per-episode overrides. Silently picking one of four values for a disputed key is how a
catalogue quietly changes four videos at once.

**Demote is what makes promote safe to try.** It writes each reference back out as the object it
resolved to and drops the entry — byte-for-byte what the renderer was already seeing. Because the
operation is reversible, the decision is not load-bearing, which is the point: whether two episodes
*should* share a prop set is an editorial judgement, and it should be cheap to change your mind.

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
- `props/` — a promoted prop set is the contract a beat renders from; `vm props index` lists them.
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
