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
| `props/` | Shared Remotion prop sets, referenced by episodes with `$ref` |
| `packages/remotion-graphics/` | Reusable branded motion graphics (React + Remotion) |
| `tools/` | Node scripts: scaffold episodes, validate, probe media, render overlays |
| `series/` | The actual content: series → episodes → language variants |
| `media/` | Heavy files (git-ignored) — raw, proxies, overlays, VO, timelines, exports |

## Quick start

```bash
# one-time setup: the tools need their deps
pnpm install --dir tools

# scaffold a new episode
node tools/new-episode.mjs BEG my-topic-slug

# validate everything
node tools/validate.mjs

# preview / develop motion graphics
cd packages/remotion-graphics && pnpm install && pnpm studio
```

## Toolchain

- **Node ≥ 20 and pnpm** — tools and Remotion. `pnpm install --dir tools` once per clone, and
  `pnpm install` in `packages/remotion-graphics`. pnpm ≥ 10 refuses esbuild's postinstall unless
  `allowBuilds` names it (`pnpm-workspace.yaml`); without it the Remotion bundler will not start.
- **Remotion** — programmatic overlays, subtitle burn-ins, cover stills. Bundles its own
  ffmpeg (`npx remotion ffmpeg`) for rendering — but **a system ffmpeg with libass IS required**:
  `tools/burn-subtitles.py` shells out to it for the burn-in, and `tools/transcribe.mjs` needs it
  to make the 16 kHz mono WAV whisper.cpp reads. `apt install ffmpeg` covers both.


New here? Read `AGENTS.md` first — it routes every task. Humans and agents follow the
same rules.
