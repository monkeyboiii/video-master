# @dirtbikex/remotion-graphics

The DirtBikeX reusable motion-design system: branded transparent overlays and
cover stills for the video pipeline. This package is the visual language — it
is not a full editor (Kdenlive is the assembly layer). See
`skills/05-remotion-graphics.md` for the production workflow.

## Compositions

All overlays are 1080x1920 @ 30fps with a **transparent** background. Overlay
durations derive from `durationSec` in props (via `calculateMetadata`).

| ID | Kind | Size | Props (defaults) |
|----|------|------|-------------------|
| `hook-title` | overlay | 1080x1920 | `locale`, `kicker?`, `title`, `durationSec` (3.5) |
| `checklist-card` | overlay | 1080x1920 | `locale`, `title`, `items: string[]`, `durationSec` (8) |
| `cta-card` | overlay | 1080x1920 | `locale`, `action: 'save'\|'comment'\|'follow'`, `line`, `handle` (`@dirtbikex`), `durationSec` (4) |
| `lower-third` | overlay | 1080x1920 | `locale`, `name`, `label`, `durationSec` (4) |
| `subtitle-track` | overlay | 1080x1920 | `locale`, `srt` (raw SRT text), `emphasis: string[]` ([]), `durationSec` (30) |
| `cover-9x16` | still | 1080x1920 | `locale`, `title`, `subtitle?`, `backgroundSrc?` (null → dark brand background; else a path under `public/`) |
| `cover-3x4` | still | 1080x1440 | same as `cover-9x16` (RedNote-style text-forward cover) |
| `safe-zone-guide` | debug | 1080x1920 | none — Studio preview only, never a deliverable |

`locale` is always a full BCP-47 tag: `en-US` or `zh-CN`. zh-CN automatically
switches to Noto Sans SC and slightly smaller type. Text content comes from
per-episode props files (`templates/remotion-props/locale-props.template.json`),
never hardcoded in components.

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
