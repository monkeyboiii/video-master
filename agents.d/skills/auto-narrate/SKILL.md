---
name: auto-narrate
description: "Synthesise a DirtBikeX narration track with Kokoro-82M, en-US and zh-CN, and get the word-level caption rows out of the same pass so the two cannot disagree. Use when asked to add or regenerate voiceover, narrate a cut, change the narration voice or pace, retime captions against a voice, or when captions run faster than anything can be spoken. The model is fetched on first use, never committed. Args: LOCALE [--speed S] [--voice V] [--write]"
---

# Narration, and the captions that come out of it

```bash
tools/tts/narrate --locale zh-CN --speed 1.15 --write
tools/tts/narrate --locale en-US --speed 1.15 --write
```

Writes into `${DBX_TTS_DIR:-~/.cache/dbx-tts}/out/`:

| | |
|---|---|
| `narration-{en,zh}.wav` | the voice, sentences placed at their beat anchors |
| `rows-{en,zh}.txt` | caption rows, `text|startMs|endMs[|*]`, timed off that voice |

`--write` also puts the rows into the `burst-intro-captions-*` compositions in
`packages/remotion-graphics/src/Root.tsx`. Then render — preview first, final once:

```bash
tools/render-captions.sh --preview burst-intro-captions-zh    # 27s
tools/render-captions.sh --final   burst-intro-captions-zh    # 69s, mixes the narration in
```

`--final` picks the narration up from this same cache directory automatically. Details and the
caption visual spec are in `/video-captions`.

## The rule this exists to enforce

**Captions are read off the narration; they are never hand-timed against it.** The burst-intro
zh captions were once laid out at a rate chosen for a silent cut and ran **2.1x faster than any
voice speaks them**. Timing captions against anything but the audio that will actually play is a
guess, and it does not survive the next line change. One pass produces both.

A silent cut is different and still wants the faster rate — that half is in
`agents.d/modules/captions.md § The caption rate and the speaking rate are not the same number`.

## Nothing downloads until you narrate

`tools/tts/ensure.sh` is the only thing that fetches, and every entry point calls it first. It
builds `${DBX_TTS_DIR:-~/.cache/dbx-tts}` — a pinned Python 3.12 venv, CPU torch, kokoro,
misaki[zh], and the checkpoint under its own `HF_HOME`. About **1.7 GB, beside the repo, never in
it** — the same rule `tools/transcribe.mjs` follows for whisper.cpp, for the same reason. Delete
the directory to reclaim it; the next run rebuilds it.

Python **3.12 is pinned deliberately**: Ubuntu 26.04 ships 3.14 as its only interpreter and this
stack has no wheels for it. uv fetches a standalone 3.12 without touching the system one.

`espeak-ng` is misaki's fallback phonemiser and is NOT installed for you — `ensure.sh` says so and
tells you the apt line. It is a system package, so it is the operator's call.

## Editing what is said

`tools/tts/script.py` holds it: one sentence per beat per locale, plus the zh word units and the
en important words. Beat anchors are frames in `burst-intro`'s own scene table, not the
storyboard's planned seconds — the storyboard says 42s and the cut renders 38.5s.

Every run prints each beat's slot against what the voice actually took:

```
  burst    18.20s  cap 6.50s  spoke 4.80s  ok    渲染一开始，占用直接冲到顶，这时候你在花额度
```

**A line marked OVER is a line to shorten, not audio to stretch.** Two en lines were, and were.

## Where word timings come from, per locale

- **en-US — the voice's own tokens.** misaki returns per-word `start_ts`/`end_ts` for Latin
  script. Exact and free. Punctuation is filtered out: a comma is a pause the voice takes, not a
  word the reader sees, and without that filter the caption grows a lone `,` that lights like a
  word.
- **zh-CN — the model's `pred_dur`.** No tokens come back, but every phoneme's duration does, in
  units of exactly 600 samples (25 ms at 24 kHz) — verified, `sum(pred_dur) * 600 == len(audio)`.

### Do not reach for whisper here

`tools/transcribe.mjs` + `tools/group-words.mjs` is the right loop for a **human** take and stays
that way. It was tried on synthetic zh first and fails: whisper drops ~35% of zh tokens as
byte-split U+FFFD, 100 of 107 characters failed to match, and the rows came back with words whose
start exceeded their end and a sentence ending at 0.00s. It also OOM-kills an 8 GB box, since
large-v3 peaks ~4.6 GB with torch still resident. Never ask a recogniser what the synthesiser
already knows.

### And do not split zh on misaki's word boundaries

They are not ours and they cross ours: in 多数时候，它安静地待在线的下面 misaki segments
安静|地待|在线 — 在线 is one word to it ("online") and two to us. Consuming whole phoneme groups
per declared word overshoots and leaves the last words with zero-length spans. The mapping walks
phoneme **characters**, each declared word claiming as many as its own phonemisation is long,
scaled to fit. Length rather than identity is what survives tone sandhi.

## Voices

Defaults are `am_michael` (en) and `zm_yunxi` (zh) — one v1.0 checkpoint carries both locales, so
the two tracks come from the same voice family rather than two unrelated engines. `--voice` takes
any of the 54; `zf_*`/`zm_*` are zh, `af_*`/`am_*`/`bf_*`/`bm_*` are en.
`DBX_TTS_REPO` takes a mirror (`NobodyWho/Kokoro-82M` is the same v1.0 weights with voices as
`.safetensors`), or `hexgrad/Kokoro-82M-v1.1-zh` for a much larger zh voice set.

**Both defaults were picked from the v1.0 roster, not chosen by listening** — nobody has compared
them. If a voice sounds wrong that is an open question, not a regression. Whether v1.1-zh's larger
zh set is worth a second download is the other one.

## When the script is fixed and the slots are not

`tools/tts/srt-to-narration.py` takes an SRT instead and makes each cue fit its slot, in two
stages: re-synthesise faster first (`--max-tts-speed`, default 1.60), stretch only the remainder
(`rubberband`, pitch held, `formant=preserved`). The order matters — a voice re-synthesised at
1.3x sounds like a person talking faster, the same 1.3x stretched sounds like a recording being
rushed. At 1.30 the zh residue was 1.31–1.50x on every cue; at 1.60 it is 1.03–1.16x. Use this
only when the wording cannot change; `narrate` needs none of it.
