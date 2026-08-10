# Edit Notes — DBX-APP-S03E002

Track layout: V1 footage · V2 overlays · V3 spare · A1 voiceover · A2 music/SFX

Footage is not shot yet. This file currently carries the **VO audio** decisions only;
the assembly plan lands after the shoot.

## VO audio — take 2 + rev-2 ending (VO_EN_012 / VO_EN_013)

Reproduce with `./vo-process.sh` (needs `auto-editor` on PATH and `ffmpeg`). One run writes
both masters, their MP3 review copies, and a review mix of each under the bed — all into
`media/**`, out of git.

### What rev 2 changed

Script rev 2 keeps take 2's hook and body **verbatim** and replaces everything from
"Anyway, enough of that." onward. The owner became the **boss**, and he turns the app down:

> …show him my gorgeous app and — *(record scratch)* — Yeah… not quite. He passed on the
> app, but gave me some solid advice: for enduro riders, GPX and live tracking can be a
> lifeline. Guess we're learning… electric warriors, let's go?!

Gone with it: the shiny badge, "Nice. Track two secured.", and the girlfriend punchline.
The count still ticks — the mission is visiting 100 tracks, not signing them.

### Policy: pure splice, now assembled per region

Same rule as v004 — **dead air is cut and nothing else is touched.** What changed is the
mechanics: instead of one auto-editor pass over one take, each region is spliced on its own
with **the identical v004 settings** and the pieces are concatenated.

```
--edit audio:threshold=-34dB --margin 0.06s,0.12s --smooth 0.10s,0.08s
```

That was necessary anyway (three source files, two soundtracks), and it buys explicit
control of the joins and of the record-scratch hole. It costs nothing in pacing: measured at
the auto-editor threshold, the joins are **0.195–0.220s** against internal gaps of the same
size, so a listener cannot tell a join from an ordinary pause.

| | v004 (rev 1) | **v005 en (current)** | **v005 cn** |
|---|---|---|---|
| Duration | 44.23s | **50.34s** | **49.84s** |
| Median gap | 0.15s | **0.16s** | **0.16s** |
| p90 gap | 0.19s | **0.20s** | **0.20s** |
| Max gap | 0.22s | **1.24s** (the scratch hole) | **1.24s** |
| Integrated | −30.0 LUFS | **−30.0 LUFS** | **−30.1 LUFS** |
| True peak | −8.7 dBFS | **−8.7 dBFS** | **−8.7 dBFS** |

Verified untouched rather than asserted — octave-band balance against the raw takes,
gated to speech frames only:

| region | vs raw | mean | tilt across 125 Hz–8 kHz |
|---|---|---|---|
| hook | take 2 | +0.04 dB | 0.19 dB |
| body | take 2 | −0.02 dB | 0.21 dB |
| ending | rev-2 ending | +0.86 dB | 0.54 dB |
| cn hook | rev-2 cn hook | −0.30 dB | 0.16 dB |

Flat means no EQ. The ending's +0.86 and the hook's −0.30 are the match gains below, and
they are flat, not shaped.

### Regions

Absolute seconds into each raw take, cut a little wide — auto-editor trims the edges to
`--margin`. Editing one never shifts another. **Re-derive these if a take is re-recorded.**

| piece | source | in | out | content |
|---|---|---|---|---|
| enhook | take 2 | 0.60 | 7.90 | Day two… / …back in my hometown. |
| body | take 2 | 9.40 | 50.30 | I used to ride… → Oh man, the flashbacks! |
| enda | rev-2 ending | 0.30 | 5.15 | Anyways, enough of that. → …my gorgeous app and |
| endb | rev-2 ending | 6.15 | 23.60 | Yeah, not quite. → …electric warriors, let's go?! |
| cnhook | rev-2 cn hook | 1.10 | 6.60 | 走遍100个越野摩托车场的第二集，搿趟…回屋里厢！ |

The splice point is the line boundary after "Oh man, the flashbacks!" — take 2 runs on to
its own "Anyways, enough of that." at 52.23s, and that read is **dropped**; the rev-2 take
re-delivers the line, so the seam falls between two lines rather than inside a thought.

Both ends of every region were checked against the raw take at 5 ms resolution before
cutting: `endb` starts at 6.15 because the real "Yeah" onset is 6.26 and there is a 30 ms
blip at 6.05 that a threshold detector would call speech — the same failure mode that put
0.56s of breath in front of a line on E001.

### The record scratch

The rev-2 take leaves **1.21s** between "…my gorgeous app and" and "Yeah… not quite.",
which is the gag: the scratch goes in that hole. The master reproduces it at **1.24s**
(`SCRATCH_GAP=1.20` plus the pieces' own margins), so the delivered timing survives the
splice instead of being flattened to 0.20s like every other pause.

**The SFX is not in the VO master.** A1 stays clean; `SFX_001` belongs on A2, at **37.88s**
on VO_EN_012 and **37.38s** on VO_EN_013. Those offsets already pull back the scratch file's
own 0.15s of lead silence, so the audible hit lands 0.05s after the voice stops.

It *is* in the review mix, so the timing can be judged. There it is peak-matched to
**3 dB under the voice's true peak** (`SFX_BELOW_VO_PEAK`) — the raw file is a clipped
0 dBFS sting, roughly 21 dB hotter than this voice, and dropping it in flat would be
comical for the wrong reason.

### Joining takes

The rev-2 session was recorded quieter than take 2, so its pieces get a **linear match
gain** — ending **+0.80 dB**, Chinese hook **−0.30 dB** — computed in the script from
measured loudness, not typed in. Both are plain gains: no dynamics, no tone change.

Verified across the seam: the last 1.2s of the body reads **−29.4 dB** speech-RMS against
the ending's first 1.2s at **−29.6 dB**. A 0.2 dB step is inaudible.

This is the same exception E001 documents. Two takes at different levels cannot be
concatenated without it; everything else stays hands-off.

### Two long pauses were flattened, on purpose

The rev-2 take leaves **2.23s** after "not quite." and **1.82s** before "Guess we're
learning…". Both are cut to the 0.20s house pacing, because that is the sound v004
established and the reaction they are waiting for is **visual** — it belongs to the shoot,
not the VO. If the edit wants that room back, split the line into its own piece in
`vo-process.sh` rather than widening the threshold; the scratch hole is the worked example.

### Level

None applied beyond the two match gains. The master sits at take 2's own −30.0 LUFS /
−8.7 dBFS. Loudness is a **video-mix decision**, not a VO-asset one, and
TikTok/Reels/Shorts all normalise quiet uploads upward anyway.

### Superseded

v001–v003 (take 1, full processing chains) and **v004** (rev-1 take 2) are deleted. They
served a script that no longer exists and `vo-process.sh` can no longer rebuild them; the
old script is in git history if a rev-1 cut is ever needed. Two attempts stay on record so
they are not retried:

- **v002 tried to fix the room** with EQ + fast-gate + compression. It measured 7.6 dB drier
  and sounded wrong — gating a room out makes the voice switch between two acoustics, which
  reads as artificial. **If the room is a problem, fix it at the mic, not in post.**
- **v003 kept a 1.05x tempo and a normalising gain.** Both are gone under the pure-splice
  policy.

### Music bed

`MUS_001`, flat, **no ducking** — the one thing the script does set. It is placed
**`MUSIC_BELOW_VO` dB under the measured voice loudness** (currently 10) rather than at a
fixed volume, so the balance survives any change of take or level. 0.5s fade in, 1.5s out;
`amix=normalize=0` (the default would halve all inputs).

In the timeline this stays a separate A2 clip — the A1 master is clean and unmixed.

### DECIDE (human)

- **MUS_001 is not licensed**, and **SFX_001's licence is unknown.** Both are fine for
  judging the cut, neither is fine for publishing. Same status as the beds on S03E000/E001.
- **The delivered body no longer matches the written lines word for word** — "all the bikes
  **have** big batteries", "**so** I'd be kicking myself", "look what **we got** here",
  "**Oh man, the flashbacks!**" (order reversed), "**Anyways**". Take 2 was not re-recorded
  and these are not worth a re-record; subtitles follow the delivery. Confirm each by ear at
  the subtitle pass — they come from a base-model transcript, not from listening.
- **Packaging is now half-stale.** `cover.en-US.md` was written when the episode ended on a
  secured track. The captions still hold (the count is visits), but the rejection is a
  stronger hook than anything on that page and the title list should be reconsidered at the
  packaging pass.
- Beat durations in `manifest.yml` are measured off VO_EN_012 but stay provisional until the
  subtitle pass.

## Subtitle notes

Not started, and this episode needs **two** passes. The bodies are identical; the hooks are
not, so every body cue sits **0.50s earlier** on the Chinese cut (hook 4.29s vs 4.79s).
Time each against its own master (VO_EN_012 / VO_EN_013), never against a raw take.

## Retention checklist

Fill after assembly, before any review export.
