# Edit Notes — DBX-APP-S03E001

Track layout: V1 footage · V2 overlays · V3 spare · A1 voiceover · A2 music/SFX

Footage is not shot yet. This file currently carries the **VO audio** decisions only;
the assembly plan lands after the shoot.

## VO audio — take 1 (VO_EN_003)

Reproduce with `./vo-process.sh` (needs `auto-editor` on PATH and `ffmpeg`). Writes the
master, an MP3 review copy, and a review mix under the bed — all into `media/**`, out of git.

### Policy: splice + named word-level tweaks

**No tone processing.** No EQ, denoise, gate, compression, limiting or overall gain. The only
level set anywhere is the music bed's. This matches S03E002 and is the standing policy for
the series — see that episode's edit-notes for the two rejected alternatives (a de-room chain
that made the voice switch between acoustics, and a tempo + normalising gain pass).

Verified rather than asserted: v001's octave-band balance matched the raw take to **0.1 dB**
across 80 Hz–8 kHz, and true peak is **unchanged at −8.9 dBFS** through v002.

### Word-level tweaks (v003)

Four timing edits on top of the splice, listed in the script's `EDITS` array:

| Tweak | Before | After |
|---|---|---|
| Beat before "Boom" | 0.20s gap | **0.55s** |
| bow → beg | 0.19s | **0.34s** |
| beg → tear up | 0.21s | **0.36s** |
| "pull out the whole childhood trauma" | 1.72s | **1.59s** (1.08x) |
| Beat before closing "That's it" | 0.21s gap | **0.51s** |

**The speed-up uses `atempo`, not `rubberband`.** v002 ran the phrase at 1.15x through
rubberband and it sounded processed — a phase vocoder smears speech transients even when it
holds pitch. `atempo` is WSOLA (overlap-add): it keeps timbre and pitch untouched, and at
1.08x the phrase reads as a nudge rather than an effect. The segment's level is then matched
back to the source with `volumedetect` (verified: −30.1 dB both sides), so the sped words sit
at exactly the same volume as everything around them.

Word positions were located with `auto-editor whisper <file> <model> --split-words`, then
refined against energy-based run detection — whisper's boundaries snap to neighbouring words
and are ~0.2s loose, so they are good enough to *identify* a word but not to cut on.

**The offsets are relative to the spliced audio, so they move if `THRESHOLD`, `MARGIN` or
`SMOOTH` change.** `SPLICE_DUR` guards this: the script aborts rather than applying stale
offsets to a different splice.

**Gotcha that bit once:** in the `fast` step `-ss/-to` must come *before* `-i`. As output
options ffmpeg applies the tempo filter to the whole stream first and then trims the
*filtered* timeline — which silently splices in a chunk from the wrong part of the take and
doesn't shorten anything. Symptom: output longer than the arithmetic predicts.

### Result

| | take 1 raw | v001 splice | **v003 master** |
|---|---|---|---|
| Duration | 68.29s | 36.23s | **37.05s** |
| Speech | 27.68s (40.5%) | 27.54s (76.0%) | **27.5s** |
| Max gap | 3.58s | 0.32s | **0.55s (the Boom beat)** |
| p90 gap | 1.55s | 0.22s | **0.25s** |
| Gaps > 1s | 15 | 0 | **0** |
| Integrated | −31.3 LUFS | −31.1 LUFS | **−31.2 LUFS (take's own)** |

This take is the sparsest of the three recorded so far — only 40.5% speech, so the splice
removes almost half the file. Speech lost: **0.14s**.

At 37.05s the VO runs well under the ~47s the script was drafted against, which is a good
problem: it leaves room for the on-location punchline, the track-dog beat to breathe, and
reaction/B-roll pauses that carry no narration.

### Splice (auto-editor)

```
--edit audio:threshold=-34dB --margin 0.06s,0.12s --smooth 0.10s,0.08s
```

- Measured on this take: room-tone peaks ≈ −48.5 dB (p95 −44.2), speech peaks ≈ −20.4 dB.
  auto-editor's threshold is **peak-based**, so −34 dB clears the room tone by ~10 dB and
  still sits ~14 dB under speech. Re-measure before reusing these numbers on a take recorded
  somewhere else.
- **`--smooth` mincut is the knob for in-phrase pauses.** The default 0.2 s leaves any
  shorter silence alone; 0.10 s removes them. Below ~0.05 s the delivery sounds clipped.
- **`--margin` sets the pacing**: the silence between kept clips is removed entirely, so the
  residual pause is `margin_after + margin_before` ≈ 0.18 s. Never use threshold for pacing.

### Level

None applied. The master sits at the take's own −31.2 LUFS / −8.9 dBFS. Loudness is a
**video-mix decision**, not a VO-asset one, and TikTok/Reels/Shorts all normalise quiet
uploads upward anyway.

### Music bed

`MUS_001` (Freek-A-Leek instrumental), flat, **no ducking** — the one thing the script sets.
It is placed **`MUSIC_BELOW_VO` dB under the measured voice loudness** (currently 10) rather
than at a fixed volume, so the balance survives any change of take or level. 0.5 s fade in,
1.5 s out; `amix=normalize=0` (the default would halve both inputs). Lower the number for a
more present bed. Perceived voice level is preserved through the mix (−31.2 → −31.2 LUFS);
the lower mix *peak* is only mono being spread across two channels, not an attenuation.

The track is 235.9s against a 37.1s master, so the bed uses only its opening — check that
the section under the hook is the part you want, and offset the music start if not.

In the timeline this stays a separate A2 clip — the A1 master is clean and unmixed.

### DECIDE (human)

- **MUS_001 is not licensed.** Commercial instrumental, fine for judging the cut, not for
  publishing. Swap for a cleared track before any export leaves review. Same status as
  S03E002's bed.
- **Take 1 was captured at −31.3 LUFS in a live room.** Under the pure-splice policy that
  character ships as-is; only a re-record changes it.
- The punchline (girlfriend / "group chat") is **not** in this master — it is on-location
  dialogue. Leave A1 clear for it after `mission-accomplished`.
- Beat durations in `manifest.yml` follow the 37.05s master — the tweak time was added to the
  beats that actually changed (`build-app`, `rider-to-rider`, `mission-accomplished`), not
  spread across all nine. Still provisional; lock them against VO_EN_003 at the subtitle pass.

## Subtitle notes

Not started. Time against VO_EN_003 — not the raw take, and not v001 (the tweaks shift
everything after 5.42s).

## Retention checklist

Fill after assembly, before any review export.
