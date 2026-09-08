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

**The bed is one continuous use and it starts at frame 0.** The source is entered at
**00:00:41.33** so that the 43.0s line lands exactly on the `chinese-can-fly` beat (1.67s), and it
fades in on a cubic underneath the hook rather than appearing from nowhere. Measured in isolation:
**-44.5 dB** under the hook, -29.9 dB swelling, **-15.9 dB** on the line, **-38.0 dB** ducked. The
duck was 6 dB higher and sat too loud behind the narration. Those attenuations are not taste — the
source is -6.4 LUFS with a +3.8 dBFS true peak and is never used at unity.

**No riser.** One was synthesised as a placeholder on the hook and removed; the storyboard's `sfx`
cues stay as instructions for the edit, and nothing is synthesised into the preview mix.

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

**Caption alignment was verified after the trim, and the first verification was not enough.**
Every word span is measured against the untrimmed clip, so all of them shift back by the lead that
came off — miss that and the captions sit ~0.4s late on every beat. Checking only block STARTS said
that was fine. It was not: `zh_spans` gives the last word of a beat "the tail, including the
trailing pad", and the trim had just removed that pad from the audio, so the final word of every
beat lingered about a second past the voice and ran into the next block — 继续 ended at 23.26s
while the next beat started at 22.44s. The spans are now clamped to the trimmed clip as well as
shifted.

Re-checked on both edges against `silencedetect`: every block start and end within **±0.06s**, most
within ±0.02s, and **zero overlapping blocks**. Block 1 has no matching onset because the track
*starts* with speech (-18.2 dB in the first 0.3s), which is the trim working; block 2 is the source
beat and has no synthesised audio.

## Storyboard

`storyboard.yml` — **24 cuts** over 13 beats, median 0.95s. Pacing is semantic, not uniform: six
beats hold on one shot, and the fast runs are the four that earn them (the not-vfx montage, the
now-here faces against only-on-tv's deliberate drag, the mall gag, and takeoff/apex/landing).

**Straight cuts, no transitions.** `whip-cut`, `fade-through` and `camera: whip` are gone from the
vocabulary rather than merely unused — a word still in the list is a word someone reaches for — and
`storyboard-check` rejects them, so the rule holds without anyone remembering it. Every motion left
happens inside a shot.

**`the-jump` is 0.40s, not 1.10s.** It is the only thing between the hook and the source line, so
its length IS the gap between the first two lines. At 1.10s the two stopped reading as one thought;
the gap is now 0.48s.

**Cut counts are not independent of beat length.** When the trim took the piece from 38.50s to
24.60s, every cut got 36% shorter for free and the montage beats fell to 0.42s — faster than the
pace that had already been called too aggressive. not-vfx and now-here dropped from 4 cuts to 3.
Re-read `storyboard-check --cuts` after any retime.

DECIDE: the sfx names are cues, not assets. Nothing maps them to `remotion.media` files yet.

## QC

Not run — there is no render to measure. The previz is a placeholder and is explicitly out of
scope for the QC checklist in `agents.d/modules/voice-and-render-qc.md`.
