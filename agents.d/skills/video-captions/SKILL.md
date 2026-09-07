---
name: video-captions
description: "Build spoken-word caption overlays for a DirtBikeX short — the two locale modes (zh karaoke, en streaming), the striped band, what lights and what does not, fixed type with sentence cuts, and the transparent delivery master. Use when asked to add, restyle, retime or re-render burned-in or overlay subtitles, when a caption wraps or overflows, when a Chinese highlight lands on a character instead of a word, or when a caption .mov is too big. Args: LOCALE [COMPOSITION]"
---

# Spoken captions

| File | Does |
|---|---|
| `packages/remotion-graphics/src/components/SpokenSubtitle.tsx` | ONE line — draws it, lights it, never wraps |
| `packages/remotion-graphics/src/components/SpokenSubtitleTrack.tsx` | a whole narration — measures, cuts, sequences |
| `packages/remotion-graphics/src/theme/tokens.ts` | the palette (`spoken`) and `SAFE_ZONE` |

Registered in `packages/remotion-graphics/src/Root.tsx`: `burst-captions-{zh,en}` (1080x1920
short) and `burst-intro-captions-{zh,en}` (1920x1080, timed to `burst-intro`'s scene table).
The reasoning behind every rule below is `agents.d/modules/captions.md`; this file is how to apply it.

## The input format

One word per row. Sentences separated by a **blank line**.

```
text|startMs|endMs        ← ordinary word
text|startMs|endMs|*      ← important: this one lights its TEXT too
```

That is exactly the `Caption[]` shape `tools/transcribe.mjs` writes, so a real transcription pastes
in with only the blank lines and the `*` marks added. Times are absolute across the whole script;
the track rebases them per line.

## The two locale modes

|  | zh-CN | en-US |
|---|---|---|
| reveal | **karaoke** — whole line from frame 0 | **streaming** — a word appears when spoken |
| word gap | 0 | `size * 0.26` |
| scale | `localeScale` 0.88 | 1 |
| alignment | the same in both — see below | |

## The sentence is centred; the words inside it are not

Both, at once. Every word is laid out from frame 0 in both locales; a word en has not reached yet
is `visibility: hidden`, so it **holds its box without drawing itself or its band**. The line
therefore reserves the width of the complete sentence, that width is centred in the safe zone, and
each word sits from frame one exactly where it will be when it appears.

Do not centre the *visible* words — that re-centres the line on every new word and drags the
already-read ones sideways, so the reader re-finds their place word by word. Do not left-align the
*caption* either — that pins the words but parks every line on the safe-zone edge with no margin.

Because the hidden words really are in the layout, nothing measures anything here; the browser
reserves the width. (The track still measures, but only to decide where to cut.)

Centring is on the **true frame centre**. `SAFE_ZONE` is asymmetric (left 55, right 145 — the
right inset is the platform action rail), so captions take a **symmetric** inset of
`max(left, right)` instead: `captionInset(width, height)`. The midpoint is the frame's own and the
rail is still cleared. It costs width — 790px rather than 880 at 1080 — which comes out of the
cut budget, not the type size.

The zone is derived from the canvas via `safeZoneFor`, so the same components serve a 1080x1920
short and a 1920x1080 landscape cut. `burst-intro-captions-{zh,en}` are the landscape pair.

## Two styles — `captionStyle`

| | `band` (default) | `plain` (en only) |
|---|---|---|
| rule under the line | striped, always drawn | none |
| text | one colour throughout | white, **green on the spoken word** |
| `*` important | lights that word's text | no extra effect — every spoken word lights |

`plain` is for footage that already has something at the bottom of frame that a second horizontal
rule would fight. **zh always uses `band`** — asking for `plain` there is clamped, not obeyed,
because recolouring dense character strokes mid-line is the exact thing the band exists to avoid.
One script feeds both styles; the rows do not change.

## What lights (`band`)

- **The band always lights** under the word being spoken. In both locales.
- **The text lights only for a word marked `*`**, and only while it is being spoken. It goes
  `spoken.lit`; everything else holds `spoken.text` from first frame to last.

Do not light text per word. A line whose every glyph recolours as the voice crosses it flickers,
and the band already says where the voice is. The `*` is what makes lit text mean *this is the
word the sentence is about* — spend it two or three times a sentence, not on every noun.

## One size, and cuts instead of shrinking

The type **does not auto-fit**. `captionSize(locale, fontSize)` is the size, fixed before layout.

A sentence wider than `captionRoom(width)` (= `width - SAFE_ZONE.left - SAFE_ZONE.right`, 880px at
1080) is **split by the track**, at the word boundary that leaves the two halves closest to equal
width, recursing until each part fits. Never wraps, never shrinks.

If a line still overflows it is a single word wider than the frame — shorten the word or lower
`fontSize` for that composition. Do not reintroduce `fitText`: a per-sentence size makes the frame
twitch, and a sentence that shrank enough to fit is one nobody reads.

A line clears `tailFrames` after **its own last word**, not when the next one starts — a finished
caption sitting on screen for seconds while the picture moves on reads worse than a quiet frame.
The tail is capped at the next line's start, so two lines never overlap.

## Geometry — all derived from `size`, never fixed px

| Thing | Value |
|---|---|
| band height | `size * 0.26` unlit, `size * 0.40` lit (bottom-aligned, grows up) |
| band skew | `skewX(-12deg)` |
| band inset | zh `0`; en `-size * 0.08` each side |
| band z | `zIndex: -1` — **behind** the glyph, or a lit block hides the word it marks |
| dashes | `repeating-linear-gradient(45deg, …)`, dash `max(2, size * 0.055)`, period `× 2.6` |
| text stroke | `max(2, size * 0.045)` of `spoken.stroke`, `paintOrder: 'stroke fill'` |
| padding below text | `size * 0.16` |

**Both states carry the dashes.** Lit is the fluorescent ground under its own darker stripes; unlit
is near-black under grey ones. A flat highlight beside a striped band reads as two unrelated
objects instead of one rule lighting up.

## A word is whatever a row is

whisper.cpp emits Chinese timings **per character**, and highlighting per character is wrong —
核心 is one word and lights as one. The components do not segment; they highlight exactly the units
given. Group upstream, where the script's own boundaries are known:

```bash
node tools/transcribe.mjs <audio> --locale zh-CN     # per-character rows
node tools/group-words.mjs <rows> <script>           # → per-word rows
```

Write numbers as **digits** in both locales — `12.5%`, `4个核心`, `7天` — not spelled out. A digit
is read at a glance; a spelled number is read as words and costs the line its width.

## Render

```bash
cd packages/remotion-graphics
npx remotion still  burst-captions-en /tmp/f.png --frame=100   # inspect before committing a render
npx remotion render burst-captions-zh out/captions-zh.mov
```

Stills are the check that matters — the defects here are only visible by looking. Flatten the alpha
to see it:

```bash
ffmpeg -f lavfi -i color=c=0x555555:s=1080x1920 -i /tmp/f.png \
  -filter_complex "[0][1]overlay,crop=1080:420:0:1280" -frames:v 1 /tmp/look.png
```

Do not bundle several `remotion still` calls in parallel — they race on one webpack cache and all
fail. Run them in sequence.

## Delivery

`overlayMetadata()` in `packages/remotion-graphics/src/shared.ts` bakes the transparent master:
ProRes 4444, `yuva444p10le`, PNG frame capture. That is what the Kdenlive/MLT edit decodes
reliably with alpha — see `agents.d/modules/remotion-overlays.md` before changing it, and never
deliver WebM to the edit.

**On size.** ProRes is intra-frame and lossy; a 19s 1080×1920 caption master is ~95 MB even though
98% of every frame is transparent. Measured on this content, re-encoding the ProRes master
lossless (`ffmpeg -c:v qtrle`, bit-identical RGBA, verified by framemd5) costs ~9 MB and decodes
6× faster. It is the better master on every axis measured — but it is **not** the delivery default
until someone confirms MLT composites qtrle alpha correctly in Kdenlive. Do that check before
switching; do not switch on the numbers alone.

## Mixing captions onto a finished cut

The picture and the captions are rendered separately and composited, so one picture render serves
every locale:

```bash
# 1. the picture must have NO caption layer of its own, or you get two sets stacked
npx remotion render burst-intro-bare out/burst-intro-bare.mp4       # in the burst-intro project

# 2. the caption track, with alpha
npx remotion render burst-intro-captions-zh /tmp/cap-zh.mov         # here

# 3. overlay; the picture's audio is copied through untouched
ffmpeg -i out/burst-intro-bare.mp4 -i /tmp/cap-zh.mov \
  -filter_complex "[0][1]overlay=format=auto:shortest=1" \
  -map 0:a? -c:a copy -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p \
  out/burst-intro-captions-zh.mp4
```

**Check the base for burned-in captions before compositing.** A cut that already carries its own
subtitle layer produces two stacked sets, and it is not obvious from the filename which one you
have — look at a frame. Timings for a mix come from the picture composition's own scene table, not
from the storyboard: transitions consume frames from the series total, so a storyboard's planned
seconds and the rendered cut disagree (42s planned, 38.5s rendered, in this piece).

## Previews

A preview is for looking at, so it is lossy on purpose — what it has to be is fast and small.
Measured on the same 19s master:

```bash
# keeps alpha — for checking the overlay itself.        0.47 MB, 3.8x realtime
ffmpeg -i out/captions-zh.mov -an -c:v libvpx-vp9 -pix_fmt yuva420p \
  -crf 40 -b:v 0 -deadline realtime -cpu-used 8 -row-mt 1 out/preview-zh.webm

# flattened over grey — for reading the captions.       0.18 MB, 7.4x realtime
ffmpeg -f lavfi -i color=c=0x555555:s=1080x1920:r=30 -i out/captions-zh.mov \
  -filter_complex "[0][1]overlay=shortest=1" -an -c:v libx264 -preset veryfast \
  -crf 26 -pix_fmt yuv420p out/preview-zh.mp4
```

Both are ~200-500x smaller than the master. Do not reach for VP8 (`-c:v libvpx`): measured 4x
slower than VP9 and larger. And a preview is never the thing you hand to the edit — that is the
ProRes master, always.

**Reading a WebM preview back: name the decoder.** VP9 alpha lives in Matroska BlockAdditions, so
`ffprobe` says `pix_fmt=yuv420p` and ffmpeg's default decoder drops the layer silently — which
looks identical to an encoder that never wrote it.

```bash
ffmpeg -c:v libvpx-vp9 -i preview-zh.webm -vf alphaextract -frames:v 1 -update 1 /tmp/a.pgm
```
