# DirtBikeX video-master

Agent-assisted video production pipeline for DirtBikeX content: bilingual (en-US /
zh-CN) short-form video for TikTok, YouTube Shorts, Instagram Reels, RedNote, Douyin,
Bilibili and WeChat Channels.

```text
Git tracks production logic.
External storage holds heavy media.
Manifest files connect the two.
```

## What lives where

| Path | Contents |
|------|----------|
| `docs/` | Production model, golden rules, naming, localization, platform specs |
| `skills/` | Step-by-step task instructions for AI agents (and humans) |
| `templates/` | Blank episode artifacts, series manifest, Remotion prop presets |
| `packages/remotion-graphics/` | Reusable branded motion graphics (React + Remotion) |
| `tools/` | Node scripts: scaffold episodes, validate, probe media, render overlays |
| `series/` | The actual content: series → episodes → language variants |
| `media/` | Heavy files (git-ignored) — raw, proxies, overlays, VO, timelines, exports |

## Quick start

```bash
# one-time setup: the tools need their deps
npm install --prefix tools

# scaffold a new episode
node tools/new-episode.mjs BEG my-topic-slug

# validate everything
node tools/validate.mjs

# preview / develop motion graphics
cd packages/remotion-graphics && npm install && npm run studio
```

## Toolchain

- **Node ≥ 20** — tools and Remotion. Run `npm install --prefix tools` once per clone.
- **Remotion** — programmatic overlays, subtitles burns, cover stills. Bundles its own
  ffmpeg (`npx remotion ffmpeg`), so no system ffmpeg is required.
- **Kdenlive** — human editing surface (installed on the editing machine, not required
  here).

New here? Read `AGENTS.md` first — it routes every task. Humans and agents follow the
same rules.
