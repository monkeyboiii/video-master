# Edit notes — S05E002

What this repo actually did to the material, in enough detail to reproduce it. Clips by asset id
and timecode, never "the good take". Open questions are explicit `DECIDE:` lines.

**Nothing is shot.** What exists is a script, a beat plan, a synthesised caption track and a
placeholder previz. Every number below is either synthesised or estimated, and each says which.

## Voice

No human take. The caption preview's voice is Kokoro `zm_yunxi` at speed 1.15, via
`tools/tts/narrate --locale zh-CN --episode S05E002 --write`. That writes
`~/.cache/dbx-tts/out/narration-S05E002_zh.wav` (49.85s including its tail pad) and the rows the
captions are built from.

`chinese-can-fly` is **not synthesised**. Its script section uses `**原声:**` instead of
`**口播:**`, which is the marker that keeps the synthesiser off a beat while leaving it in the
plan so it still gets a caption. The audio is the speaker's own line from VOX_002 at roughly
00:00:43–00:00:44.

VOX_002 is now on this box, at `media/audio/The Chinese Can Fly.mp3`, and measured: 117.45s,
**-6.4 LUFS integrated, true peak +3.8 dBFS** — a clipped master, the hottest source in the repo.
Every bed in S05E001 peaked lower and was pulled down 28.8-32.4 dB to sit under a voice.

DECIDE: the 43-44s window is still the operator's and unconfirmed. The phrase **cannot be cut on
silence** — level is flat at about -6 dB mean across 40-47s and `silencedetect` at -32 dB finds no
gap in that window, because it is a continuous music bed with the line over it. Setting the in/out
needs an ear or a transcription; only whisper.cpp's 575 KB dummy test models are installed, and a
real one is a ~3 GB download nobody has asked for.
DECIDE: VOX_002 has no licence on file. It is a third-party clip used two ways (the line at full
level, then ducked as the bed from `not-vfx` onward). Clear it or replace it before publish.

## Captions

From `/auto-narrate`, read off the synthesised voice — not hand-timed. 91 rows, 42.02s, written
to `remotion-props/spoken-captions.zh-CN.json`.

**Highlights are automatic.** The bold spans in `script.zh-CN.md`'s `**口播:**` lines are the
`*` marks in the rows; there is no second list of important words to keep in step. 22 of 91 rows
carry a mark.

`chinese-can-fly`'s four caption rows are **evenly spaced across its 1.80s slot**, because there
is no synthesised voice to read timings off and the source clip is not on this box. The narrate
run says so on every run. Re-time them off VOX_002 with `tools/transcribe.mjs` +
`tools/group-words.mjs` before this is cut — that is the documented loop for a human take.

## Beats

**Timing source: synthesised, not a take.** The thirteen `target_duration_sec` values were first
estimated from character count and eleven of twelve beats came back OVER on the first narrate run.
They are now what Kokoro actually took at speed 1.15 plus about 0.3s of air. A recorded read
re-times all of them.

## Storyboard

`storyboard.yml` — 36 cuts over 13 beats, median 1.20s, 30 sfx cues. Checked with
`node tools/storyboard-check.mjs S05E002 --cuts`. The previz renders from
`remotion-props/previz.zh-CN.json` (`tools/previz-props.mjs`). See
`agents.d/modules/storyboard-previz.md` — this is the repo's first one and is not yet a convention.

DECIDE: the sfx names are cues, not assets. Nothing maps them to `remotion.media` files yet.

## QC

Not run — there is no render to measure. The previz is a placeholder and is explicitly out of
scope for the QC checklist in `agents.d/modules/voice-and-render-qc.md`.
