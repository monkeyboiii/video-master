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

`media/previz/S05E002-previz.mp4` carries a real mix so the pacing can be judged by ear.

**The bed is one continuous use and it now starts at frame 0.** The source is entered at
**00:00:40.63** so that the 43.0s line lands exactly on the `chinese-can-fly` beat (2.37s), and
it fades in on a cubic underneath the hook rather than appearing from nowhere. Measured in
isolation:

| Where | Bed level |
|---|---|
| 0.3s — under the hook | **−44.5 dB**, very faint |
| 1.2s — swelling | −29.9 dB |
| 2.6s — the source line 中国人能飞 | **−15.9 dB**, full |
| 4.6s onward — ducked under the narration | **−38.0 dB** |

The duck was −26 dB and sat too high behind the voice; it is −32 dB in the envelope now, which
measures −38 dB on this material. Those attenuations are not taste — the source is −6.4 LUFS with
a +3.8 dBFS true peak and is never used at unity.

**The riser on the hook is synthesised here**, not a library asset: a 140→920 Hz sweep plus
high-passed pink noise, swelling on a cubic across the hook and cut on the jump. The storyboard's
`sfx: riser` cue is what the edit replaces it with.

Mix measures **−15.1 LUFS / −1.5 dBTP**, 1.1 LU under the −14 the QC checklist asks for and
peak-limited rather than wrong — sparse speech over a quiet bed has a high peak-to-loudness ratio,
and two-pass `loudnorm` cannot lift it further at that ceiling. The shipping render is where a
higher ceiling or real compression gets decided.

## Beats

**Timing source: synthesised, not a take.** And the gaps were never the beat lengths. Two passes
shortened the beats — 0.30s of air, then 0.05s — and it still read as sentences with pauses,
because `silencedetect` at −45 dB showed the real gaps between spoken words were **1.31–1.45s**
the whole time. Kokoro pads every clip with roughly 0.37s of lead and 1.0s of tail, and the
reported `spoke` was that padded length.

`build-narration.py` now trims it (`trim_silence`; `--keep-padding` opts out), so the beats are
speech lengths plus 0.08s. The hook went 2.48s → **1.19s of actual voice**. Total **24.60s**, down
from 38.50s, with nothing said faster and no word clipped.

**Caption alignment was verified after the trim, not assumed.** Every word span is measured against
the untrimmed clip, so all of them shift back by the lead that came off; miss that and the captions
sit ~0.4s late on every beat. Checked against `silencedetect` onsets: 10 of 12 blocks land within
**±0.06s**. Block 1 has no matching onset because the track now *starts* with speech (−18.2 dB in
the first 0.3s), which is the trim working; block 2 is the source beat and has no synthesised
audio.

## Storyboard

`storyboard.yml` — **24 cuts** over 13 beats, median 0.95s. Pacing is semantic, not uniform: six
beats hold on one shot, and the fast runs are the four that earn them (the not-vfx montage, the
now-here faces against only-on-tv's deliberate drag, the mall gag, and takeoff/apex/landing).

**Cut counts are not independent of beat length.** When the trim took the piece from 38.50s to
24.60s, every cut got 36% shorter for free and the montage beats fell to 0.42s — faster than the
pace that had already been called too aggressive. not-vfx and now-here dropped from 4 cuts to 3.
Re-read `storyboard-check --cuts` after any retime.

DECIDE: the sfx names are cues, not assets. Nothing maps them to `remotion.media` files yet.

## QC

Not run — there is no render to measure. The previz is a placeholder and is explicitly out of
scope for the QC checklist in `agents.d/modules/voice-and-render-qc.md`.
