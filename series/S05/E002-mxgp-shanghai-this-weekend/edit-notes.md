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

**The music runs from frame 0, and the swell happens after the first line.** Two versions cut the
bed in — on the clap at 42.99s, then on the vocal at 43.15s — and both sounded wrong for the same
reason: the phrase arrived out of silence with no bar of groove ahead of it, so it read as a sound
effect rather than as a song. Laying it from the top fixed that but introduced the opposite fault:
the fade reached normal at 0.8s, which is still inside the hook, and the bed buried the line.

So the bed sits **low under the hook** and only swells once that line has finished. The source is
entered at **00:00:41.88 → 00:00:41.20**, which puts the 43.15s vocal at 1.95s. Measured in
isolation:

| Where | Bed level |
|---|---|
| 0.30s — under the hook | **−40.4 dB** |
| 1.10s — still under it | −32.1 dB |
| 1.16s | hook speech ends; the swell starts here, not before |
| 1.40s — swelling | −17.5 dB |
| **1.67s — normal reached** | **−15.5 dB** |
| 1.92s — 中 lands | −15.7 dB, so **0.25s of normal ahead of the vocal** |
| to 7.10s — the hold | ≈ −16 to −17 dB, all three repetitions |
| 7.40s — ducking | −28.3 dB |
| **7.68s — down, settled** | **−39.4 dB** |
| 7.93s — narration returns | −38.0 dB, so **0.25s settled ahead of the voice** |

**The envelope is symmetric, and both gaps are music cues.** The bed cannot duck while the next
line is being spoken any more than it could swell while the last one was. So the drop gets the
mirror of the swell: `flying-broll` is 4.26s = 3.50s of song + a **0.76s reserve**, holding full
through the third repetition, 0.51s down, then 0.25s settled before `not-vfx`. Tightening either
gap puts the bed back on top of a voice — which is exactly the fault both were added to fix.

The curve is a quadratic ease-out, fast first and settling in, not the cubic ease-in an earlier
version used, which crept.

**The hook is 你相不相信我说.** It is deliberately half a sentence — it does not stand up alone and
is completed by the source line that follows, 中国人能飞. That is also why the gap between them is
not minimal: it carries the swell.

**相不相信 is one caption unit.** The A-not-A question form is a single verb; jieba splits it
相|不|相信, which would light three units for one word. Added to `tools/tts/zh-words.txt` alongside
中国人, 越野摩托 and 赛道挑战. A trailing comment on an entry line does NOT work there — jieba parses
`word freq tag` and eats the `#` as the tag, which is how the first attempt silently did nothing.

**It holds at source volume for three repetitions.** The song sings the line three times on a clap
grid measured dead regular at **1.75s** (transients at 42.99, 44.74, 46.49, 48.25, 49.99, 51.75s
under a 4 kHz highpass). The bed holds full to 6.52s and the drop lands exactly where the narration
comes back — about −16 dB through the hold, **−38 dB** after. Never at unity: the source is
−6.4 LUFS with a +3.8 dBFS true peak.

**No riser.** Nothing is synthesised into the preview mix.

Mix measures **−14.8 LUFS / −1.5 dBTP** — inside the ±1 the QC checklist asks for, which the
earlier cuts were not: laying the bed from the top raises the average without touching a peak — sparse speech over a quiet bed has a high peak-to-loudness ratio,
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

**`flying-broll` is a new picture beat, 3.50s.** It is the song's second and third repetitions with
no narration over them, and it exists so the third script line can be pushed back: that line calls
this the F1 of dirt biking, and the claim only lands if the viewer has been allowed to watch the
flying first. Two cuts of 1.75s each — the longest holds in the piece.

**中国人 is one word.** The bold boundary fixed 中国|人能|飞, but left 中国|人, because jieba's
default dictionary does not carry 中国人. `tools/tts/zh-words.txt` is a repo user-dict for exactly
this: a caption unit is a WORD, so a wrong split is a wrong highlight and a wrong reading. It also
corrects 越野摩托 and 赛道挑战, which were splitting in two. 90 rows → 87.

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
