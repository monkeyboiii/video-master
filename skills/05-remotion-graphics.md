# Skill: Remotion Motion Graphics

## Purpose

Produce the branded overlay renders (hook titles, checklist cards, CTA cards, lower
thirds, subtitle burns) and cover stills for an episode, from per-locale prop files, using
`packages/remotion-graphics/`. Remotion is the reusable visual language — not a full
editor.

In retention terms (`docs/golden-rules.md`, Edit 剪辑 section), each composition is an
attention device the edit deploys:

| Composition | Retention role |
|-------------|----------------|
| `hook-title` | First-frame grab — big hook text at 0.0s |
| `subtitle-track` | Kinetic captions from an SRT: word pacing + keyword highlight |
| `kinetic-captions` | Word-by-word streaming captions in a **fixed bounded panel**, keyword color (`brand`/`harsh`) — driven by the word-timed caption map, one render per beat |
| `checklist-card` | Save-worthy value; each tick is a pattern-interrupt beat (pair with dings) |
| `stage-cards` | Segment reset / pattern interrupt between chapters |
| `lower-third` | Context without stopping the flow |
| `brand-title` | Branded logo stinger (wordmark + orange X) on the product reveal |
| `profile-card` | Founder identity card — an in-app profile screenshot, framed |
| `feature-phones` | Side-by-side app screen-recordings; per-phone **segments + freeze-on-last-frame** so a demo holds past its line |
| `cta-card` / `invite-card` | Ending expectation — CTA card, or real invite art + scannable QR (patch text over platform-specific lines) |

A retention device we don't have yet (callout arrow, circle highlight, zoom box, animated
sticker, motion tracking — text/arrow following the subject, mask reveal) is a **new
component through the design-system PR path** — themed, locale-aware, registered,
documented — never a one-off hack inside an episode.

Patterns learned on S01E002:

- **Per-beat variants of one composition.** For overlays that recur per beat (e.g.
  `kinetic-captions`, `feature-phones`), keep one composition and render it once per beat
  with `--props=<episode>/remotion-props/<comp>.<beat>.json`, output named
  `{VIDEO_ID}_{locale}_{aspect}_{comp}-<beat>_v###.mov`. The overlay naming pattern allows
  the optional `-<variant>` suffix; keep those props files tracked in the episode dir.
- **Overlays position themselves.** A card meant for a corner / centered / lower-third
  bakes that placement (and opacity) into the component, so the same `.mov` is correct in
  Kdenlive and in any flatten preview. The edit composites it full-frame — no per-clip
  Transform for placement.
- **Freeze-on-last-frame for demo clips.** To hold an app screen-recording past its line,
  give the component per-phone *segments* ending in a still (`.png`) — extract the clip's
  last frame (`ffmpeg -sseof -0.15 -i clip.mp4 -frames:v 1 clip-freeze.png`) and play
  `video → freeze` so each phone can hold while the VO continues.

Patterns learned on S01E003:

- **A bounded caption panel must fit words by width, not by count.** With a fixed-width
  background, a fixed *word* window clips long words at the edges — and the clipped word is
  always the one just spoken (we lost `DirtBikeX.` and `reminded`). Select the newest words
  by a **width budget** (`chars × fontSize × ~0.55em + gap ≤ panel − padding`), keeping
  `window` only as an upper bound. `kinetic-captions` does this.
- **Continuous whole-video caption track.** Rendering one `kinetic-captions` overlay across
  the whole timeline (words timed *globally*) makes the rolling window carry across every
  cut, so subtitles never fade out mid-video. Costs one big ProRes render instead of several
  small ones; per-beat overlays remain the fallback.
- **`side-screen`: measure the safe box against the tightest clip.** When footage reserves
  blank space beside the speaker, the framing usually is **not** identical across takes.
  Measure the face edge and any prop on the *tightest* clip, then use that one box for every
  feature so placement stays consistent — and verify by compositing the overlay over the real
  footage before rendering the rest.

## Inputs

- `manifest.yml` — beats with `overlay` fields, formats (resolution/fps)
- `remotion-props/<locale>.json` in the episode dir (start from
  `templates/remotion-props/*.json`)
- `script.<locale>.md` — exact on-screen wording (never retype from memory; copy)
- `packages/remotion-graphics/README.md` — available compositions and their props

## Outputs

- Overlay videos with transparent background in `media/overlays/`, named
  `{VIDEO_ID}_{locale}_{aspect}_{composition}_v{version}.mov`
- Cover stills in `media/exports/`, named per `docs/naming-conventions.md`
- `manifest.yml outputs.overlays` updated with the rendered filenames

## Overlay master format (fixed decision)

**ProRes 4444 `.mov` (pixel format `yuva444p10le`, PNG frame capture).** This is what
Kdenlive/MLT decodes reliably with alpha. Do not deliver VP9/VP8 WebM to the edit —
MLT's alpha handling for WebM is unreliable; WebM is acceptable only as a lightweight
web preview artifact. Compositions in this package set these render defaults via
`calculateMetadata`, so a bare `npx remotion render <CompId>` produces correct alpha.

## Steps

1. Fill `remotion-props/<locale>.json` from the script's on-screen text. One props file
   per locale; keys are composition IDs (see package README).
2. Preview in Studio when a human is available: `npm run studio` from
   `packages/remotion-graphics/` (use the transparency checkerboard to verify alpha).
3. Render each overlay the manifest's beats call for:

   ```bash
   node tools/render-overlays.mjs series/<series>/episodes/<episode-dir> <locale>
   ```

   Prefer the tool: it extracts each composition's props from the locale file and names
   outputs correctly. If you must render manually, note that `--props` takes the **flat
   per-composition object**, not the whole locale file (which is keyed by composition
   ID — passing it whole silently renders placeholder defaults). Extract first:

   ```bash
   node -e 'const p=require("<abs path to <locale>.json>");console.log(JSON.stringify({locale:p.locale,...p["hook-title"]}))' > /tmp/props.json
   npx remotion render hook-title ../../media/overlays/<name>.mov --props=/tmp/props.json
   ```

4. Render cover stills with `npx remotion still cover-9x16 <out>.png --props=...`
   (or `cover-3x4` for RedNote/WeChat) — same per-composition props rule as step 3.
5. Record every rendered file in `manifest.yml outputs.overlays` /
   `outputs.covers` with its version number.
6. Run `node tools/validate.mjs`.

## Rules

- Never set a background color on a transparent overlay composition (unset background =
  transparent). If an overlay renders opaque, that is a bug — fix the component, don't
  key it out downstream.
- Text content comes from tracked props files, not hardcoded into components. Components
  are reusable across episodes; props are per-episode.
- Respect platform safe zones (`docs/platforms.md`): overlay text stays inside the
  central safe region baked into the components' layout constants — don't override
  positioning props to escape it.
- All `remotion` / `@remotion/*` packages stay pinned to one identical exact version.
  Upgrade only via `npx remotion upgrade`, as its own PR, never mid-episode.
- New reusable component? Add it to the package with a themed, locale-aware design +
  register a composition + document props in the package README, in its own PR. One-off
  episode tweaks belong in props, not new components.

## Done criteria

- Every beat with an `overlay` field has a rendered `.mov` in `media/overlays/`, named
  correctly, recorded in the manifest.
- Alpha verified (Studio checkerboard, or `npx remotion ffprobe <file>` shows codec
  `prores (ap4h)` with a `yuva444p…` pixel format — the encoder stores 4444 at 12-bit,
  so `yuva444p12le` is the expected readback).
- Props text is verbatim from the script wherever the script provides the line (titles,
  checklist items, CTA); composed labels with no one-line source (e.g. a lower-third
  descriptor) are assembled from script fragments, never invented.
- `node tools/validate.mjs` passes.
