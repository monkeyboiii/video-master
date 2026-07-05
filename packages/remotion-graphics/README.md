# @dirtbikex/remotion-graphics

The DirtBikeX reusable motion-design system: branded transparent overlays and
cover stills for the video pipeline. This package is the visual language — it
is not a full editor (Kdenlive is the assembly layer). See
`skills/05-remotion-graphics.md` for the production workflow.

## Compositions

Overlays are 1080x1920 @ 30fps with a **transparent** background unless noted
(`stage-cards` is dual-mode — see the note under the table). Overlay durations
derive from `durationSec` in props (via `calculateMetadata`).

| ID | Kind | Size | Props (defaults) |
|----|------|------|-------------------|
| `hook-title` | overlay | 1080x1920 | `locale`, `kicker?`, `title`, `durationSec` (3.5) |
| `checklist-card` | overlay | 1080x1920 | `locale`, `title`, `items: string[]`, `durationSec` (8) |
| `cta-card` | overlay | 1080x1920 | `locale`, `action: 'save'\|'comment'\|'follow'`, `line`, `handle` (`@dirtbikex`), `durationSec` (4) |
| `lower-third` | overlay | 1080x1920 | `locale`, `name`, `label`, `durationSec` (4) |
| `subtitle-track` | overlay | 1080x1920 | `locale`, `srt` (raw SRT text), `emphasis: string[]` ([]), `durationSec` (30) |
| `stage-cards` | overlay* | 1080x1920 | `locale`, `items: string[]` (2–6 labels), `colors: string[]` (defaults to the six stage colors), `scatterDelaySec` (1.6), `background` (true), `durationSec` (6) |
| `stage-cards-wide` | overlay* | 1920x1080 | same as `stage-cards` (3x2 grid instead of 2x3) |
| `cover-9x16` | still | 1080x1920 | `locale`, `title`, `subtitle?`, `backgroundSrc?` (null → dark brand background; else a path under `public/`) |
| `cover-3x4` | still | 1080x1440 | same as `cover-9x16` (RedNote-style text-forward cover) |
| `safe-zone-guide` | debug | 1080x1920 | none — Studio preview only, never a deliverable |

`locale` is always a full BCP-47 tag: `en-US` or `zh-CN`. zh-CN automatically
switches to Noto Sans SC and slightly smaller type. Text content comes from
per-episode props files (`templates/remotion-props/locale-props.template.json`),
never hardcoded in components.

\* `stage-cards` is the one dual-mode overlay: capsules pop in along a line and
scatter into a card grid on a dotted background. By default it renders **opaque**
(`background: true`) because it carries the whole frame as a segment card, like a
title slate. Set `background: false` to get a transparent version for layering
over footage. Default items are the six production stages
(选题/封面/脚本/拍摄/剪辑/复盘 · Topic/Cover/Script/Shoot/Edit/Review).

## Commands

```bash
npm install                # once
npm run studio             # preview (use the checkerboard to verify alpha)

# Overlays — render defaults (ProRes 4444 + alpha) are baked per composition,
# so a bare render is already correct:
npx remotion render hook-title out/hook-title.mov

# IMPORTANT: --props takes THIS composition's flat props object. The per-episode
# remotion-props/<locale>.json is keyed by composition ID — passing that whole
# file silently renders placeholder defaults (zod strips unknown keys). Either
# use node ../../tools/render-overlays.mjs (it extracts the right key), or:
node -e 'const p=require("./path/to/en-US.json");console.log(JSON.stringify({locale:p.locale,...p["checklist-card"]}))' > /tmp/props.json
npx remotion render checklist-card out/checklist.mov --props=/tmp/props.json

# Cover stills (same per-composition props rule):
npx remotion still cover-3x4 out/cover.png --props=/tmp/cover-props.json

# Verify alpha on a rendered overlay:
npx remotion ffprobe out/hook-title.mov
# expect codec "prores (ap4h)" with pix_fmt yuva444p12le — we request 10-bit,
# but ffmpeg's ProRes 4444 encoder always stores 12-bit; alpha is intact.

# MP4 preview: don't pass --codec=h264 to render (the baked ProRes profile
# rejects it). Render the ProRes master, then transcode with bundled ffmpeg:
npx remotion ffmpeg -y -i out/hook-title.mov -c:v libx264 -pix_fmt yuv420p -crf 18 -movflags +faststart out/hook-title_preview.mp4
```

Per-episode renders normally go through `node tools/render-overlays.mjs`
(see `AGENTS.md`), which also handles output naming per
`docs/naming-conventions.md`.

## Overlay master format: ProRes 4444 only

Overlays hand off to Kdenlive/MLT as **ProRes 4444 `.mov`** (pixel format
`yuva444p10le`, PNG frame capture). Every overlay composition bakes these
defaults via `calculateMetadata` — do not override the codec on render, and do
not deliver VP9/VP8 WebM to the edit (MLT alpha handling for WebM is
unreliable). If an overlay renders opaque, that is a component bug (a
background color was set somewhere) — fix it here, never key it out
downstream.

## Version pinning

All `remotion` / `@remotion/*` packages are pinned to one identical **exact**
version (currently `4.0.484`, no carets). Upgrade only with
`npx remotion upgrade`, in its own PR, never mid-episode.

## Licensing

Remotion is free for individuals and companies with up to 3 people. At 4+
employees a paid company license from <https://remotion.pro> is required.
Recheck the terms when moving to Remotion v5 or when headcount changes.
