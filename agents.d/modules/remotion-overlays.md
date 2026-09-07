---
kind: why
status: current
summary: Alpha overlays rendered from the Remotion workspace, the ProRes 4444 contract, and the props trap that renders placeholders silently.
---

# Remotion overlays

## Purpose

Produce the branded overlay renders (hook titles, checklist cards, CTA cards, lower
thirds, subtitle burns) and cover stills for an episode, from per-locale prop files, using
`packages/remotion-graphics/`. Remotion is the reusable visual language — not a full
editor.

> **Captions ARE a Remotion job — through `spoken-subtitle-track`.** This note previously said the
> opposite, and pointed at a `subtitles.yml` that exists in exactly one episode. Both halves were
> stale: captions came back into Remotion as `SpokenSubtitleTrack`, whose source is an episode's
> `remotion-props/spoken-captions.<locale>.json` and whose design is [captions.md](captions.md).
>
> `subtitle-track` and `kinetic-captions` are the retired ones. `kinetic-captions` was kept "only
> so the S01/S02 overlays that already shipped can be rebuilt" — that reason is gone: S01 was
> converted by `tools/captions-import.mjs` and S02 never used it. **No episode references either
> composition.** They stay registered because deleting a composition is a separate decision from
> retiring it, and the components are what a rebuild of a pre-2026-09 render would need.

In retention terms (the episode script, Edit 剪辑 section), each composition is an
attention device the edit deploys:

| Composition | Retention role |
|-------------|----------------|
| `spoken-subtitle-track` | The caption track: word-timed, locale-differentiated, one per variant |
| `hook-title` | First-frame grab — big hook text at 0.0s |
| ~~`subtitle-track`~~ | **RETIRED** — superseded by `spoken-subtitle-track`, see [captions.md](captions.md) |
| ~~`kinetic-captions`~~ | **RETIRED** — no episode uses it; S01 was converted, S02 never did |
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
  `props/<name>/base.json`)
- `script.<locale>.md` — exact on-screen wording (never retype from memory; copy)
- `packages/remotion-graphics/README.md` — available compositions and their props

## Outputs

- Overlay videos with transparent background in `media/overlays/`, named
  `{VIDEO_ID}_{locale}_{aspect}_{composition}_v{version}.mov`
- Cover stills in `media/exports/`, named per `docs/naming-conventions.md`
- `manifest.yml outputs.overlays` updated with the rendered filenames

## Overlay master format (fixed decision)

**ProRes 4444 `.mov` with an alpha channel (`yuva444p*`, PNG frame capture).** This is what
Kdenlive/MLT decodes reliably with alpha. Do not deliver VP9/VP8 WebM to the edit —
MLT's alpha handling for WebM is unreliable; WebM is acceptable only as a lightweight
web preview artifact. Compositions in this package set these render defaults via
`calculateMetadata`, so a bare `npx remotion render <CompId>` produces correct alpha.

**Assert the alpha, not the bit depth.** Measured 2026-09-07 on ffmpeg 8.0.1, `mark-pop` rendered
`yuva444p12le` where this doc's header had long said `yuva444p10le` — while its own QC section
said 12-bit was "the expected readback". The doc disagreed with itself; the measurement settles it,
and ffmpeg picks 12-bit for ProRes 4444. Nothing downstream cared, because what matters is the `yuva` prefix. A check that pins the
exact pixel format goes red on an ffmpeg upgrade and teaches nobody anything:

```bash
ffprobe -v error -show_entries stream=pix_fmt -of csv=p=0 <overlay>.mov   # expect yuva444p*
```

### The masters are big, and that is the codec, not a defect

ProRes is **intra-frame**: every frame is stored whole, with no reference to its neighbours. A 19s
1080×1920 caption master is ~95 MB (~40 Mbit/s) even though 98.3% of every frame is fully
transparent, because no ProRes frame is allowed to know that the frame before it was identical.
Nothing is wrong; that is what a mezzanine codec is for, and it is the same property that makes it
scrub instantly in the edit.

Measured 2026-09-07 on `captions-zh.mov` (575 frames, 1080×1920, video only, source 94.7 MB),
losslessness verified by comparing `framemd5` of the decoded **RGBA** — colour and alpha both:

| Encode | Size | Lossless vs source | Decode |
|---|---|---|---|
| ProRes 4444 (re-encode) | 93.2 MB | **no** — 546/575 frames differ | 475 fps |
| QuickTime RLE (`qtrle`) | **9.3 MB** | **yes**, bit-identical | **2848 fps** |
| PNG-in-MOV (`-c:v png`) | 31.5 MB | yes, bit-identical | 232 fps |
| FFV1 (`-level 3`, rgba) | 29.5 MB | yes, bit-identical | 361 fps |
| VP9 `-lossless 1` (yuva420p) | 1.5 MB | no — 575/575 frames differ | 1670 fps |
| VP9 `-lossless 1` (yuva444p) | 1.5 MB | no — 575/575 frames differ | — |

Two things fall out of that table. **ProRes → ProRes is itself lossy**, so "keep it in ProRes to
avoid a generation loss" is backwards. And **`qtrle` wins on every axis measured** — a tenth of the
size, bit-identical RGBA, six times the decode speed — because run-length coding is exactly right
for flat colour over a mostly-empty frame, which is what a caption overlay is.

`-lossless 1` on VP9 is lossless *in its own colour space*; the conversion into `yuva420p` on the
way in is where the loss happens. The flag does not make the pipeline lossless — and `yuva444p`
does not rescue it either, so the loss is not only chroma subsampling.

**The delivery default is unchanged.** WebM was rejected here on MLT's alpha handling, not on
size, and `qtrle` has not been through that same check — nobody has yet composited one in
Kdenlive. If it does composite correctly, `qtrle` should replace ProRes 4444 as the master, and
this table is the evidence for that change.

### Previews are lossy on purpose

A preview is looked at, not edited, so quality is not the axis — speed and size are. Lossless
`qtrle` is the wrong tool for it (9.3 MB where 0.5 MB will do). Measured on the same clip:

| Preview | Size | Encode | Alpha |
|---|---|---|---|
| VP9 `yuva420p -crf 40 -deadline realtime -cpu-used 8` | 0.47 MB | 3.8x realtime | yes |
| H.264 flattened over grey, `-preset veryfast -crf 26` | 0.18 MB | 7.4x realtime | no |
| VP8 `yuva420p -crf 40` | 0.66 MB | 1.0x realtime | yes |

VP9 when the overlay's own alpha is what is being checked; flattened H.264 when the captions are
what is being read. VP8 is slower **and** bigger — there is no case for it. This is the
"lightweight web preview artifact" exception above, and it stays an exception: a preview never
goes to the edit.

**Name the decoder when you read a WebM alpha preview back, or the alpha vanishes silently.**
VP9 alpha rides in Matroska BlockAdditions, not in the video stream's pixel format: `ffprobe`
reports `pix_fmt=yuv420p` and `tags.alpha_mode=1`, and ffmpeg's *default* decoder selection drops
the layer without a word — `alphaextract` then fails with "Requested planes not available", which
reads exactly like an encode that never wrote alpha. It is not.

```bash
ffprobe -v error -show_entries stream_tags=alpha_mode -of csv=p=0 preview.webm   # expect 1
ffmpeg -c:v libvpx-vp9 -i preview.webm -vf alphaextract -frames:v 1 -update 1 a.pgm
```

Measured 2026-09-07: with the decoder named, the same file reads back 98.0% fully transparent;
with it omitted, no alpha plane at all. Costs one wrong conclusion about the encoder each time.

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
- **`backdrop-filter` does nothing in an overlay.** An overlay renders in isolation against
  transparency, so there is no footage behind it to blur or tint. To put a frosted /
  ultra-thin material behind an element, **bake the backdrop**: pass the footage segment in
  as a prop (`bgSrc`, in `public/`) and render it, blurred, inside the comp — `BrandTitle`
  does exactly this. That makes the overlay **opaque for its duration**, so it must then sit
  on a *lower* track than the captions or it hides them. (Alternative: blur V1 in the
  compositor.) Never ship a `backdrop-filter` and assume it worked.
- **Bounded text panels need a width budget, not a word count.** A fixed N-word rolling
  window clips the just-spoken emphasis word at the panel edge — the exact word the caption
  exists to land. Select words newest-first while
  `chars × fontSize × AVG_CHAR_EM + gap ≤ panel − padding`, and treat the word count as an
  upper bound only. Verify against the *longest* word in the script, not a random frame.
- **A safe box is only valid on the clips it was measured against.** Overlay placement (the
  left-hand screen inset, say) is measured against the tightest framing in the set. Reusing
  it on a clip outside that set — or extending an overlay into the next beat "for
  continuity" — can land it on the subject's face. Draw the box on the target frame and look
  before extending.
- **When cuts make an overlay hard to read, annotate rather than slow down.** A chopped
  screen recording loses the causal thread (what got tapped?). A breathing orange marker at
  the tap point, positioned in `%` of the screen box so it survives re-placement, restores
  it without spending seconds.
- **QC a value change on the frame that would break, before re-rendering the episode.**
  Render `--frames=<a>-<b>` at the two or three worst timecodes; an hstack of variants
  answers "how strong should this be" in seconds instead of a full render round.
- **An asset `src` resolves against `public/`, never against `media/`.** If a script generates
  a clip that a component consumes, that script must also copy it into `public/`. A manual
  copy is a step you will forget, and the next render silently reuses the previous asset —
  it does not fail. When a re-render "changes nothing", diff the mtimes in `public/` first.
- **Redact a third party at the SOURCE, before the asset is generated.** A blur applied downstream
  leaves an un-redacted intermediate somewhere — in `public/`, in a chop, in an export. S01E005's
  `screen-chop.sh` runs its redaction pre-pass first and chops the redacted file, so no clean frame
  of the other rider ever exists. Blur, not a black bar: a bar reads as censorship, a blur reads as
  privacy. And verify the blur is *unrecoverable*: upscale 7x with contrast and unsharp and try to
  read it. A real Gaussian yields word-shapes and no letters; a mosaic can sometimes be inverted.
- **A marker's coordinates are a measurement, not a guess.** Overlay a labelled grid on the
  actual clip frame (`drawbox` every 5% + `drawtext`), read the element off it, and convert.
  An eyeballed fraction lands the ring on the wrong row and looks deliberate. Better still, find
  the element by colour: a threshold on the raw `rgb24` pixels gives a bbox to the pixel, and it
  caught a 21px error a grid read had missed.
- **A ring that shrinks onto a control finds it; a ring that pops on top of it does not.** For a
  small round button on a busy screen, start the circle ~3x oversize and ease it down (0.55s,
  `Easing.out(cubic)`), and hold its fill alpha at 0 until it is nearly landed — otherwise the
  entrance paints a huge orange wash. `SideScreen`'s `enter: "shrink"` does this.
- **`OffthreadVideo` renders NOTHING past its own end — it does not hold the last frame.** A clip
  shorter than its time on screen must freeze on an extracted last-frame still (`FeaturePhones`,
  `FeatureFan`). And a VFR screen recording's container duration lies: S01E005's insider post claims
  2.10s and its last decodable frame is at 1.50s, with any seek past that yielding nothing.
- **NEVER CROP A SCREEN RECORDING. Redact what you don't want and keep the frame.**
  Got wrong twice, on two episodes, in two different ways, and caught by the director both times:
    * S01E004 v1 cropped 44px off *each side* to force the native aspect into the card. The app UI
      lost its edges.
    * S01E004 v2 and S01E005 v1 cropped the status bar off the *top* to remove the red
      screen-recording pill. Full width survived, but **the aspect ratio changed** — an 884x1920
      phone became 884x1790, visibly stubbier than a real phone — and the app's nav header was
      sliced off at the card's top edge. He called it "cut", both times.

  The recording's aspect ratio is not yours to change. A red recording pill, a notification banner,
  a third party's name, a live QR — all of these are **redaction** problems, not crop problems.
  Paint over the pill, blur the credential, and size the card to the **native** aspect. The only
  thing a crop ever buys you is a smaller, wronger picture.

  Two corollaries:
    * `drawbox color=black` on a `yuv420p` stream paints **limited-range** black (Y=16 → RGB 16,16,16),
      a visibly grey rectangle on a true-black status bar. Do the fill in `rgb24` and convert back.
      Verify by boosting the region's contrast 6x and looking; and by counting red pixels, not by eye.
    * Cropping also moves every marker. S01E005's top-right chat button sat at yFrac 0.0017 of the
      cropped clip — inside the card's 30px corner radius — and at a comfortable 0.074 of the native
      frame. If a marker lands in a corner arc, suspect the crop before you nudge the marker.
- **When a card stretches a video to fill it (`objectFit: fill`), the card's aspect IS the
  contract.** Compute `h` from the source's native aspect and the chosen `w`. Never eyeball it, and
  never let a crop silently redefine it.
- Text content comes from tracked props files, not hardcoded into components. Components
  are reusable across episodes; props are per-episode.
- Respect platform safe zones (`agents.d/modules/platforms.md`): overlay text stays inside the
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
