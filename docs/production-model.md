# Production Model

How a DirtBikeX video goes from idea to published, and what the repo tracks at each step.

## Organizing principle

The repo is not organized around "one video file". It is organized around:

```text
series → episodes → language variants → platform exports
```

- A **series** is a positioning decision: who it serves and what promise it repeats
  (`series/<series-slug>/series.yml`).
- An **episode** is one topic with one core message
  (`series/<series-slug>/episodes/<VIDEO_ID>-<slug>/`).
- A **variant** is a language edition of that episode (`en-US`, `zh-CN`). Variants are
  **siblings, not translations** — see [localization.md](localization.md).
- An **export** is one rendered deliverable for one platform
  (`media/exports/`, recorded in the manifest, never committed).

Git tracks production logic (rules, scripts, manifests, subtitles, design-system code,
review notes). External storage holds heavy media. `manifest.yml` connects the two.

## The three layers (direction → content → execution)

Every episode's documents separate three concerns (adapted from
`docs/archive/MODEL.md`), plus one record:

| Layer | Artifact | Answers |
|-------|----------|---------|
| **Direction** 方向 | `brief.md` | Why make it, for whom, to what effect |
| **Content** 内容 | `script.<locale>.md` — the **reading script** 口播稿, per locale | What is spoken, what appears on screen |
| **Execution** 执行 | `storyboard.md` — storyboard & shot plan 分镜执行稿, locale-shared | How each shot is framed, captured, cut into, captioned, scored |
| Plan → Record | `edit-notes.md` | The assembly plan derived from the storyboard against real takes, then the record of what landed: selects, retention/SFX, QC |

Keep the layers clean: direction never gets shot details, the reading script never gets
framing/transitions (its visual seed lives in manifest beats' `visual_intent`), and the
storyboard is a plan — deviations during shoot/edit are recorded in `edit-notes.md`,
never back-edited into the plan silently.

Two deliberate deviations from the source guideline: the tone & style register lives at
the **series** level (`series.yml tone:`, inherited by episodes; deviations noted in
`brief.md`), and alternative *hooks* are staged (ranked cover title variants) while the
*ending* is designed once against golden-rules hard rule 6, not staged as alternatives.

## The six stages

```text
选题 Topic → 封面 Packaging → 脚本 Script → 拍摄 Shoot → 剪辑 Edit → 复盘 Review
```

Each stage has required artifacts. A stage is "done" when its artifacts exist and pass
`node tools/validate.mjs`.

| # | Stage | Skill file | Required artifacts |
|---|-------|-----------|--------------------|
| 1 | 选题 Topic | `skills/01-topic-selection.md` | `brief.md`, `manifest.yml` initialized |
| 2 | 封面 Packaging | `skills/02-cover-packaging.md` | `cover.en-US.md`, `cover.zh-CN.md` (title/hook/cover hypotheses) |
| 3 | 脚本 Script | `skills/03-script-writing.md` | Reading scripts `script.en-US.md`, `script.zh-CN.md`, beats in `manifest.yml` |
| 4 | 拍摄 Shoot | `skills/04-storyboard.md` | `storyboard.md` (shot plan), raw asset IDs recorded in `manifest.yml` |
| 5 | 剪辑 Edit | `skills/05-remotion-graphics.md`, `skills/06-kdenlive-editing.md`, `skills/07-subtitles-localization.md`, `skills/08-audio-render-qc.md` | Remotion props, overlays rendered, `subtitles/*.srt`, Kdenlive timeline, review export |
| 6 | 复盘 Review | `skills/09-review-retrospective.md` | `review.md` with metrics and next-episode decisions |

Two intentional overlaps:

- **Packaging starts early but finalizes late.** Title/cover/first-frame hypotheses are
  written before the script (they sharpen it), but the cover is not locked until the edit
  exists — the best first frame often comes from the final footage.
- **Review feeds Topic.** Every `review.md` must end with concrete input for the next
  episode. That loop is the point of the system.

## Episode status lifecycle

`manifest.yml` carries a single `status` field. Allowed values, in order:

```text
topic → packaging → scripting → shooting → editing → qc → published → retro
```

Move the status forward when a stage's artifacts are complete. Agents must never skip a
status past missing artifacts; `tools/validate.mjs` checks artifact presence per status.

Out-of-order preparation is allowed — status tracks the furthest **completed** stage,
not the only stage being worked. Example: provisional subtitles (timed from beat targets
before VO exists) may be prepared while the episode is still at `scripting`; the status
simply doesn't advance until the earlier stages' artifacts are complete. Anything
produced ahead of its stage is flagged as provisional in `edit-notes.md`.

## Who does what

- **Human** — project manager, creative reviewer, final decision-maker. Owns: topic
  approval, shoot, **voiceover recording** (per locale, after the script locks — specs in
  `skills/04-storyboard.md`), Kdenlive polish, publish, metric collection.
- **Agent** (Claude Code / Codex) — structured production work. Owns: briefs, scripts,
  localization, subtitle prep, Remotion props and renders, manifest bookkeeping, QA
  reports, retrospective drafting.
- **Kdenlive** — human review and assembly surface. Never the source of truth.
- **Remotion** (`packages/remotion-graphics/`) — the reusable visual language: hook
  titles, checklist cards, CTA cards, lower thirds, cover stills.
- **FFmpeg** — deterministic media ops (probe, trim, proxy, transcode). No system ffmpeg
  is required: use `npx remotion ffmpeg` / `npx remotion ffprobe` from
  `packages/remotion-graphics/`.

## Source-of-truth rules

1. `manifest.yml` is the source of truth for what an episode **is** — variants, beats,
   assets, outputs. If it's not in the manifest, it doesn't exist.
2. Generated files (overlays, subtitles burns, timelines, exports) must be reproducible
   from tracked sources. Never hand-edit a generated file; fix the source and regenerate.
3. Heavy media is never committed. Its name, purpose, relationship and external location
   are recorded in the manifest (`assets:` section).
4. File names follow [naming-conventions.md](naming-conventions.md) exactly. Boring names,
   creative videos.
