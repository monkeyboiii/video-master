> **Archived 2026-07-05.** This is the original planning document (formerly `plan.md`)
> that shaped the repo. It is superseded by the built structure — see `AGENTS.md`,
> `docs/production-model.md`, and the skill files. Kept for decision history.
> Deviations from this plan are listed at the end of this file.

Your six-step frame is good:

```text
选题 → 封面 → 脚本 → 拍摄 → 剪辑 → 复盘
Topic → Cover → Script → Shoot → Edit → Review
```

But I would change the system underneath it. The repo should not be organized around “one video file.” It should be organized around **series → episodes → language variants → platform exports**.

Your current golden-rule document is already pointing in the right direction: topic selection should start from user pain points, the hook must happen in the first two seconds, subtitles should highlight rather than merely repeat the voiceover, and the final goal is not self-expression but designing viewer reactions: retention, understanding, saving, commenting, following. 

## Core repo principle

Use Git for:

```text
Rules
Scripts
Manifests
Design system code
Templates
Subtitle text
Edit instructions
QA reports
```

Do **not** use normal Git for:

```text
Raw footage
Generated overlays
Rendered videos
Proxy files
Kdenlive cache
Audio waveforms
Thumbnail caches
Large exports
```

For binary assets, either use external storage plus manifest references, or Git LFS only for small canonical assets you truly want versioned.

The key rule:

```text
Git tracks production logic.
External storage holds heavy media.
Manifest files connect the two.
```

## Recommended repo structure

```text
dirtbikex-video/
  README.md
  CLAUDE.md
  AGENTS.md

  docs/
    production-model.md
    golden-rules.md
    naming-conventions.md
    localization.md
    publishing-checklist.md

  skills/
    00-agent-router.md
    01-topic-selection.md
    02-cover-packaging.md
    03-script-writing.md
    04-shooting-plan.md
    05-remotion-graphics.md
    06-kdenlive-editing.md
    07-subtitles-localization.md
    08-audio-qc.md
    09-review-retrospective.md

  packages/
    remotion-design-system/
      package.json
      src/
        components/
        themes/
        compositions/
        locales/
      README.md

  tools/
    validate-project/
    render-remotion/
    generate-kdenlive/
    ffmpeg-utils/
    qa-report/
    subtitle-tools/

  templates/
    video-manifest.yml
    series-manifest.yml
    script-template.md
    shotlist-template.md
    review-template.md
    kdenlive/
      vertical-short-template.kdenlive
      horizontal-template.kdenlive
    remotion-props/
      hook-title.json
      checklist-card.json
      cta-card.json

  series/
    beginner-rider/
      series.yml
      episodes/
        S01E001-first-bike-choice/
          manifest.yml
          brief.md
          script.en-US.md
          script.zh-CN.md
          shotlist.md
          cover.en-US.md
          cover.zh-CN.md
          subtitles/
            en-US.srt
            zh-CN.srt
          remotion-props/
            en-US.json
            zh-CN.json
          edit-notes.md
          review.md

  media/
    README.md
    raw/
    selected/
    proxies/
    overlays/
    timelines/
    exports/

  .gitignore
  .gitattributes
```

## What `CLAUDE.md` and `AGENTS.md` should do

Put a short routing file at the root. Do **not** stuff all knowledge into one huge CLAUDE.md. Agents need a map.

Recommended root `CLAUDE.md`:

```md
# DirtBikeX Video Agent Guide

This repo manages short-form and long-form DirtBikeX video production.

## Start here

1. Read `docs/production-model.md`.
2. Read `docs/golden-rules.md`.
3. For the current task, read the matching file in `skills/`.

## Task routing

- Topic selection: `skills/01-topic-selection.md`
- Cover/title packaging: `skills/02-cover-packaging.md`
- Script writing: `skills/03-script-writing.md`
- Shooting plan: `skills/04-shooting-plan.md`
- Remotion graphics: `skills/05-remotion-graphics.md`
- Kdenlive timeline/editing: `skills/06-kdenlive-editing.md`
- Subtitles/localization: `skills/07-subtitles-localization.md`
- Audio and render QC: `skills/08-audio-qc.md`
- Review/retrospective: `skills/09-review-retrospective.md`

## Non-negotiable rules

- Do not commit raw footage, proxies, exports, generated overlays, or cache files.
- Every video must have a `manifest.yml`.
- English and Chinese versions are sibling variants, not parent/child copies.
- Kdenlive is the human review and assembly layer, not the source of truth.
- Remotion is the reusable motion-design system.
- Generated files must be reproducible from tracked source files.
```

Then make `AGENTS.md` almost identical so Codex-style workers see the same instructions.

## Skill file format

Every skill file should have the same structure, so agents do not have to guess.

Example: `skills/03-script-writing.md`

```md
# Skill: Script Writing

## Purpose

Create high-retention DirtBikeX scripts for short-form videos.

## Inputs

- `manifest.yml`
- `brief.md`
- Target locale
- Target platform
- Series positioning from `series.yml`

## Outputs

- `script.en-US.md` or `script.zh-CN.md`
- Updated `manifest.yml` beat list
- Suggested cover/title hooks

## Rules

- First 2 seconds must hit pain point, contrast, benefit, or counterintuitive claim.
- Do not start with self-introduction.
- Every sentence must move the information forward.
- Personal experience must support the viewer benefit.
- End by creating future expectation.

## Required sections

1. Hook
2. User problem
3. Core conclusion
4. Three key points
5. Personal experience
6. Checklist
7. Follow expectation

## Done criteria

- Viewer benefit is explicit.
- Save/comment/follow motivation is clear.
- No filler sentences.
- Chinese version is localized, not directly translated.
```

This makes skills machine-readable enough for Claude/Codex while still being human-manageable.

## Per-video structure

Each episode should be lightweight and mostly text:

```text
series/beginner-rider/episodes/S01E003-clutch-control-basics/
  manifest.yml
  brief.md
  script.en-US.md
  script.zh-CN.md
  shotlist.md
  cover.en-US.md
  cover.zh-CN.md
  subtitles/
    en-US.srt
    zh-CN.srt
  remotion-props/
    en-US.json
    zh-CN.json
  edit-notes.md
  review.md
```

The heavy files live outside Git, but the manifest records them.

Example `manifest.yml`:

```yaml
video_id: DBX-BEG-S01E003
slug: clutch-control-basics
series: beginner-rider
status: edit_review

formats:
  primary: short_vertical
  resolution: 1080x1920
  fps: 30

variants:
  en-US:
    script: script.en-US.md
    subtitles: subtitles/en-US.srt
    remotion_props: remotion-props/en-US.json
    voiceover_asset_id: VO_EN_001
  zh-CN:
    script: script.zh-CN.md
    subtitles: subtitles/zh-CN.srt
    remotion_props: remotion-props/zh-CN.json
    voiceover_asset_id: VO_ZH_001

beats:
  - id: hook
    purpose: pain point
    target_duration_sec:
      en-US: 3.5
      zh-CN: 3.0
    visual_intent: rider struggling with clutch at low speed
    overlay: hook-title

  - id: mistake
    purpose: reversal
    target_duration_sec:
      en-US: 7.0
      zh-CN: 6.0
    visual_intent: close-up of clutch hand
    overlay: callout-arrow

assets:
  raw:
    - asset_id: RAW_001
      filename: DBX-BEG-S01E003_SH010_TK01_gopro-front.MP4
      external_uri: s3://dirtbikex-video/raw/DBX-BEG-S01E003/DBX-BEG-S01E003_SH010_TK01_gopro-front.MP4
      sha256: optional_later
      notes: low-speed clutch mistake demo

  selected:
    - asset_id: SEL_001
      source_asset_id: RAW_001
      in: "00:00:04.200"
      out: "00:00:09.800"
      beat: hook

outputs:
  kdenlive:
    en-US: media/timelines/DBX-BEG-S01E003_en-US_v003.kdenlive
    zh-CN: media/timelines/DBX-BEG-S01E003_zh-CN_v003.kdenlive
  exports:
    en-US: media/exports/DBX-BEG-S01E003_en-US_rednote_9x16_v003_review.mp4
    zh-CN: media/exports/DBX-BEG-S01E003_zh-CN_rednote_9x16_v003_review.mp4
```

This is the important part: even if the media file is ignored by Git, the **name, purpose, relationship, and external location are tracked**.

## `.gitignore` recommendation

```gitignore
# Heavy media
media/raw/**
media/selected/**
media/proxies/**
media/overlays/**
media/timelines/**
media/exports/**

# Keep folder placeholders
!media/**/README.md
!media/**/.gitkeep

# Kdenlive/cache
*.mlt.cache
*.kdenlive~
*.backup
*.autosave

# Render outputs
*.mp4
*.mov
*.mkv
*.webm
*.wav
*.aiff
*.flac

# Remotion output/cache
packages/remotion-design-system/out/
packages/remotion-design-system/.cache/
packages/remotion-design-system/node_modules/

# OS/editor
.DS_Store
.vscode/*
!.vscode/extensions.json
```

Exception: you may choose to track small `.kdenlive` template files under `templates/kdenlive/`. I would not track every generated timeline unless it is a small approved edit file with relative paths and stable references.

## Naming convention

Use this base ID:

```text
DBX-{SERIES}-{SEASON}E{EPISODE}-{slug}
```

Examples:

```text
DBX-BEG-S01E001-first-bike-choice
DBX-BEG-S01E002-basic-gear-checklist
DBX-TRK-S01E001-how-track-owners-can-get-found
```

Recommended series codes:

```text
BEG = beginner rider
GEAR = gear and maintenance
TRK = track owners / track stewards
LOC = riding locations
APP = DirtBikeX app/community onboarding
NEWS = dirt-bike news/reactions
```

Shot files:

```text
DBX-BEG-S01E003_SH010_TK01_gopro-front.MP4
DBX-BEG-S01E003_SH020_TK02_facecam.MP4
DBX-BEG-S01E003_SH030_TK01_clutch-closeup.MP4
```

Generated overlays:

```text
DBX-BEG-S01E003_en-US_9x16_hook-title_v001.webm
DBX-BEG-S01E003_zh-CN_9x16_hook-title_v001.webm
```

Exports:

```text
DBX-BEG-S01E003_en-US_rednote_9x16_v001_review.mp4
DBX-BEG-S01E003_en-US_rednote_9x16_v002_final.mp4
DBX-BEG-S01E003_zh-CN_bilibili_16x9_v001_final.mp4
```

Keep the file name boring and systematic. Creativity belongs in the video, not the file system.

## How to modify your six-step plan

I would keep your six big boxes, but define each as a repo stage with required artifacts.

| Stage | Keep? | Change                                                               |
| ----- | ----: | -------------------------------------------------------------------- |
| 选题    |   Yes | Must create `brief.md` and update `manifest.yml`                     |
| 封面    |   Yes | Treat as “packaging hypothesis”: title, cover, first-frame, caption  |
| 脚本    |   Yes | Must produce beat IDs, not just spoken text                          |
| 拍摄    |   Yes | Must produce shotlist and asset IDs                                  |
| 剪辑    |   Yes | Split into Remotion graphics, Kdenlive assembly, subtitles, audio QC |
| 复盘    |   Yes | Must produce `review.md` and feed next episode ideas                 |

The adjusted workflow:

```text
1. 选题 / Topic
   → brief.md
   → manifest.yml initialized

2. 封面 / Packaging
   → cover.en-US.md
   → cover.zh-CN.md
   → title/hook variants

3. 脚本 / Script
   → script.en-US.md
   → script.zh-CN.md
   → beats added to manifest.yml

4. 拍摄 / Shooting
   → shotlist.md
   → raw asset names recorded in manifest.yml

5. 剪辑 / Editing
   → Remotion props
   → subtitles
   → Kdenlive timeline
   → review export

6. 复盘 / Review
   → review.md
   → metrics
   → next-video decisions
```

The main pushback: **封面 should start early but finalize late.** For social platforms, cover/title/hook thinking before the script is useful. But do not lock the cover before the edit, because the best first frame may come from the final footage.

## English/Chinese handling

Do not do this:

```text
English video → translate → Chinese video
```

Do this:

```text
Shared topic + shared beat IDs
  → English script
  → Chinese localized script
  → separate voiceovers
  → separate subtitles
  → shared visual system
  → variant-specific timing
```

English and Chinese should share:

```text
video_id
series
beat IDs
visual identity
core message
CTA intent
```

They can differ in:

```text
hook wording
sentence order
subtitle density
duration
examples
cultural phrasing
platform caption
```

## GitHub working model

Use issues as production tickets:

```text
[Video] DBX-BEG-S01E003 clutch control basics
[Graphics] Add checklist card component
[Script] Localize S01E003 to zh-CN
[Edit] Generate Kdenlive rough cut for S01E003
[Review] Fix subtitle density and CTA timing
```

Use PRs for agent work. Every PR should include:

```text
Changed files
Video ID affected
Skill file followed
Preview/export path, if applicable
Known limitations
Checklist completed
```

PR template:

```md
## Video ID

## Task type
- [ ] Topic
- [ ] Cover
- [ ] Script
- [ ] Shooting plan
- [ ] Remotion graphics
- [ ] Kdenlive edit
- [ ] Subtitles
- [ ] Review

## Files changed

## Preview path

## Checklist
- [ ] Manifest updated
- [ ] File naming follows convention
- [ ] No generated media committed
- [ ] Locale-specific changes are intentional
- [ ] Review notes added
```

## Final recommendation

Your plan is strong, but make these changes now:

```text
1. Add AGENTS.md in addition to CLAUDE.md.
2. Split big instructions into task-specific skill files.
3. Make manifest.yml the source of truth for each video.
4. Git-ignore almost all visual/media outputs.
5. Track media names, IDs, external locations, and purpose in manifest.yml.
6. Treat English and Chinese videos as sibling variants.
7. Use Remotion for reusable graphics, not full editing.
8. Use Kdenlive for assembly, review, and final human correction.
9. Add a strict naming convention from day one.
10. Make every agent PR point to a video ID and a skill file.
```

The production system should feel like this:

```text
CLAUDE.md / AGENTS.md
  tells agents where to go

skills/
  tells agents how to do each task

manifest.yml
  tells agents what this video is

Remotion package
  defines the visual language

Kdenlive
  gives you the human editing surface

media/
  stores local/generated/heavy files but stays mostly outside Git
```

---

## Deviations in the built structure (2026-07-05)

- `skills/00-agent-router.md` dropped — `AGENTS.md` is the router; `CLAUDE.md` imports it (`@AGENTS.md`) so the two never drift.
- `packages/remotion-design-system` → `packages/remotion-graphics`; composition IDs are kebab-case (`hook-title`) matching the manifest `overlay` tokens 1:1.
- Overlay master format fixed to **ProRes 4444 `.mov`** (not `.webm`) — MLT/Kdenlive reads VP9-alpha WebM unreliably; alpha defaults are baked into each composition.
- Per-comp `remotion-props/*.json` files merged into one props file per locale, keyed by composition ID.
- `tools/generate-kdenlive` deliberately deferred; if built, it targets OpenTimelineIO import (native in Kdenlive ≥ 25.04), not generated `.kdenlive` XML (documentversion churn). See `skills/06-kdenlive-editing.md`.
- `media/` gained `voiceover/` and `audio/`; `manifest.yml` gained `assets.voiceover` and a `status` lifecycle (`topic → packaging → scripting → shooting → editing → qc → published → retro`) enforced by `tools/validate.mjs`.
- The "golden-rule document" referenced here did not exist in the repo (the file thought to hold it was a duplicate of the background doc); `docs/golden-rules.md` was reconstructed from the principles cited in this plan.
