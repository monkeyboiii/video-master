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

**The bed is one continuous use and it cuts in hard — no fade.** The source is entered at
**00:00:42.99**, which is a clap, so the music arrives on a transient rather than swelling from
nothing, and that entry sits on the `chinese-can-fly` beat (1.27s). Full through the line, then
ducked over 0.4s to **-32 dB**. Those attenuations are not taste — the source is -6.4 LUFS with a
+3.8 dBFS true peak and is never used at unity.

**中 is 0.14s behind the clap, and the caption follows the voice.** Measured by centre-channel
energy: a clap is a broadband HF transient (clean peaks at 42.99s and 44.74s under a 4 kHz
highpass), a lead vocal is sustained mid energy in the centre, and the centre band lifts again at
~43.13s after the clap decays. So the cut lands on the clap, which is musically right, and the
caption is offset to the voice. The offset is declared in the script as `**原声:** (+0.14)`,
beside the line rather than in the manifest, because it is a fact about this line in this take.

**No riser.** Nothing is synthesised into the preview mix; the storyboard's `sfx` entries stay as
instructions for the edit.

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

**`the-jump` is gone as a beat.** It was the only thing between the hook and the source line, so
its length WAS the gap — 1.10s, then 0.40s, and the two still did not read as one thought. The jump
picture now plays under `chinese-can-fly` instead of owning a beat, so the hook ends and the music
cuts straight in. **Gap from the hook's last word to 中 is 0.22s.** 12 beats, 23 cuts, 23.70s.

**The emphasis is also a word boundary.** 中国人**能飞** segmented as 中国|人能|飞 — jieba invented
人能 and split the highlight across two units. Segmenting each bold span separately gives
中国|人|能飞. `captions.md` is explicit that a segmenter must not be a second source of truth
wherever the script declares its own boundaries, and the bold is the one place it does. Every other
block's words are unchanged.

**Cut counts are not independent of beat length.** When the trim took the piece from 38.50s to
24.60s, every cut got 36% shorter for free and the montage beats fell to 0.42s — faster than the
pace that had already been called too aggressive. not-vfx and now-here dropped from 4 cuts to 3.
Re-read `storyboard-check --cuts` after any retime.

DECIDE: the sfx names are cues, not assets. Nothing maps them to `remotion.media` files yet.

## QC

Not run — there is no render to measure. The previz is a placeholder and is explicitly out of
scope for the QC checklist in `agents.d/modules/voice-and-render-qc.md`.
