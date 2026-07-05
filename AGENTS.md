# DirtBikeX Video Agent Guide

This repo manages short-form and long-form DirtBikeX video production: a lightweight,
agent-assisted pipeline, not an editing folder. Humans direct and decide; agents do
structured production work.

## Start here

1. Read `docs/production-model.md` — how videos flow through the six stages.
2. Read `docs/golden-rules.md` — the content framework and quality bar; the single
   source of truth every video is judged against.
3. For the current task, read the matching skill file below. Follow it exactly.

## Task routing

| Task | Skill file |
|------|-----------|
| Topic selection / brief | `skills/01-topic-selection.md` |
| Cover / title packaging | `skills/02-cover-packaging.md` |
| Script writing (either locale) | `skills/03-script-writing.md` |
| Shooting plan / shotlist | `skills/04-shooting-plan.md` |
| Remotion motion graphics | `skills/05-remotion-graphics.md` |
| Kdenlive timeline / edit prep | `skills/06-kdenlive-editing.md` |
| Subtitles / localization | `skills/07-subtitles-localization.md` |
| Audio & render QC | `skills/08-audio-render-qc.md` |
| Review / retrospective | `skills/09-review-retrospective.md` |

Supporting references: `docs/naming-conventions.md`, `docs/localization.md`,
`docs/platforms.md`, `docs/publishing-checklist.md`.

## Repo map

```text
docs/       rules and reference (read, rarely edit)
skills/     how to do each production task
templates/  blank artifacts — never edit in place. new-episode.mjs scaffolds
            manifest.yml + brief.md; each later stage copies its own template
            from templates/episode/ (the skill file names it)
packages/remotion-graphics/   the reusable visual language (React/Remotion)
tools/      node scripts: scaffold, validate, probe, render
series/     the actual production content — one dir per episode
media/      heavy files, git-ignored; only names live in git (via manifests)
```

## Key commands

```bash
node tools/new-episode.mjs <series> <slug>     # scaffold a new episode
node tools/validate.mjs [episode-dir]          # validate manifests, naming, artifacts
cd packages/remotion-graphics && npm run studio    # preview graphics (human)
node tools/render-overlays.mjs <episode-dir> <locale>   # render overlays per manifest
```

## Non-negotiable rules

1. Never commit raw footage, proxies, exports, generated overlays, voiceovers, or cache
   files. `media/**` stays out of git; manifests record names + external locations.
2. Every episode has a `manifest.yml`. It is the source of truth for what the episode is.
   If you change an artifact, update the manifest in the same change.
3. en-US and zh-CN are **sibling variants**, not parent/child copies
   (`docs/localization.md`). Never produce one by translating the other.
4. Kdenlive is the human review/assembly layer, not the source of truth. Remotion is the
   reusable motion-design system, not a full editor.
5. Generated files must be reproducible from tracked sources. Fix sources, regenerate;
   never hand-edit generated output.
6. File names follow `docs/naming-conventions.md` exactly. Run `node tools/validate.mjs`
   before finishing any task.
7. Every PR / change references a video ID (or says `repo:` for infrastructure work) and
   the skill file followed.

## Working style

- State assumptions before producing content; if the brief is ambiguous, say so in the
  output rather than guessing silently.
- Minimum artifacts that complete the stage — no speculative extra files.
- Touch only the episode/files your task names. Don't reformat neighbors.
- Every skill file ends with **Done criteria** — verify them before declaring a task done.
