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
plan so it still gets a caption. The line is 中国人能飞 — no 真的.

VOX_002 is **one continuous use, not two**: entered at 00:00:43 for the line, then left running
as the bed for the rest of the piece.

## Preview mix

`media/previz/S05E002-previz.mp4` carries a real mix so the pacing can be judged by ear:
narration, plus VOX_002 from 43.0s placed at the beat (timeline 3.45s), at **−10 dB** for the
1.30s line and ducking over 0.3s to **−26 dB** underneath. Those attenuations are not taste — the
source is −6.4 LUFS with a +3.8 dBFS true peak, so it is never used at unity.

**Measured: −15.8 LUFS integrated, −1.5 dBTP.** That is 1.8 LU under the −14 LUFS the QC
checklist asks for, and it is peak-limited rather than wrong: two-pass `loudnorm` at a −1.5 dBTP
ceiling cannot lift this material further, because sparse speech over a quiet bed has a high
peak-to-loudness ratio. Reaching −14 needs either a higher ceiling or real compression, and
neither belongs in a previz. The shipping render is where that gets decided.

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

**Timing source: synthesised, not a take.** The `target_duration_sec` values were first estimated
from character count and eleven of twelve beats came back OVER on the first narrate run. They are
now what Kokoro actually took at speed 1.15 **plus 0.05s** — two frames, not nine. The first pass
left 0.30s after every line and it read as sentences with gaps, which is the opposite of this
format. Total 38.50s, down from 41.85s. A recorded read re-times all of them.

## Storyboard

`storyboard.yml` — 26 cuts over 13 beats, median 1.25s. **Pacing is semantic, not uniform.** The
first pass cut 36 times and gave every beat the same treatment, including the jump the whole piece
is a claim about. Six beats now hold on one shot; the four that cut fast are the ones that earn it
(the not-vfx montage, the now-here faces against only-on-tv's drag, the mall gag, and
takeoff/apex/landing). Checked with
`node tools/storyboard-check.mjs S05E002 --cuts`. The previz renders from
`remotion-props/previz.zh-CN.json` (`tools/previz-props.mjs`). See
`agents.d/modules/storyboard-previz.md` — this is the repo's first one and is not yet a convention.

DECIDE: the sfx names are cues, not assets. Nothing maps them to `remotion.media` files yet.

## QC

Not run — there is no render to measure. The previz is a placeholder and is explicitly out of
scope for the QC checklist in `agents.d/modules/voice-and-render-qc.md`.
