# Edit Notes — DBX-APP-S03E002

Track layout: V1 footage · V2 overlays · V3 spare · A1 voiceover · A2 music/SFX

Footage is not shot yet. This file currently carries the **VO audio** decisions only;
the assembly plan lands after the shoot.

## VO audio — take 2 (VO_EN_004)

Reproduce with `./vo-process.sh` (needs `auto-editor` on PATH and `ffmpeg`). Defaults to
take 2; run `TAKE=take1 ./vo-process.sh` for the other read. Writes the master, an MP3
review copy, and a review mix under the bed — all into `media/**`, out of git.

### Policy: pure splice

**Dead air is cut and nothing else is touched.** No EQ, denoise, gate, compression,
limiting, tempo or gain. The only level set anywhere is the music bed's.

Verified rather than asserted: the master's octave-band balance matches the raw take to
**0.1 dB** across 80 Hz–8 kHz, and its true peak is **unchanged at −8.7 dBFS**.

Two earlier attempts are recorded here so they don't get retried:

- **v002 tried to fix the room** with EQ + fast-gate + compression. It measured 7.6 dB drier
  and sounded wrong — gating a room out makes the voice switch between two acoustics, which
  reads as artificial. **If the room is a problem, fix it at the mic, not in post.**
- **v003 kept a 1.05x tempo and a normalising gain.** Both are gone under the pure-splice
  policy. `TEMPO` is still in the script (set to `1.0`); change that one line to re-enable
  the speed-up.

### Versions

| | v001 (t1) | v002 (t1) | v003 (t1) | **v004 (t2, current)** |
|---|---|---|---|---|
| Duration | 47.00s | 39.97s | 43.17s | **44.23s** |
| Max gap | 0.42s | 0.18s | 0.40s | **0.34s** |
| p90 gap | 0.32s | 0.12s | 0.22s | **0.22s** |
| Integrated | −14.4 LUFS | −14.2 LUFS | −23.7 LUFS | **−30.0 LUFS (take's own)** |
| Processing | full chain | full chain | tempo + gain | **none** |

Take 2 is a 67.24s read with more dead air than take 1 (52% speech vs 57%), including eleven
gaps over a second — all removed. Speech lost to the splice: **0.08s** (35.16 → 35.08s).

### Splice (auto-editor)

```
--edit audio:threshold=-34dB --margin 0.06s,0.12s --smooth 0.10s,0.08s
```

- Both takes are bimodal: room tone ≈ −57 dB RMS, speech ≈ −30 dB RMS. auto-editor's
  threshold is **peak-based**, and room-tone peaks sit at ≈ −47 dB on take 2 — which is why
  −45 dB barely cuts and −48 dB cuts nothing. −34 dB clears the room tone with margin.
- **`--smooth` mincut is the knob for in-phrase pauses.** The default 0.2 s leaves any shorter
  silence alone — that is why the gaps inside "same dirt, jumps, berms" survived v001. 0.10 s
  removes them; below ~0.05 s the delivery starts to sound clipped (v002's mistake).
- **`--margin` sets the pacing**: the silence between kept clips is removed entirely, so the
  residual pause is `margin_after + margin_before` ≈ 0.18 s. Never use threshold for pacing.

### Level

None applied. The master sits at the take's own −30.0 LUFS / −8.7 dBFS. Loudness is a
**video-mix decision**, not a VO-asset one, and TikTok/Reels/Shorts all normalise quiet
uploads upward anyway.

### Music bed

`MUS_001`, flat, **no ducking** — the one thing the script does set. It is placed
**`MUSIC_BELOW_VO` dB under the measured voice loudness** (currently 10) rather than at a
fixed volume, so the balance survives any change of take or level. 0.5 s fade in, 1.5 s out;
`amix=normalize=0` (the default would halve both inputs). Lower the number for a more
present bed. Perceived voice level is preserved through the mix (−30.0 → −29.9 LUFS); the
lower mix *peak* is only mono being spread across two channels, not an attenuation.

In the timeline this stays a separate A2 clip — the A1 master is clean and unmixed.

### DECIDE (human)

- **MUS_001 is not licensed.** Commercial instrumental, fine for judging the cut, not for
  publishing. Swap for a cleared track before any export leaves review.
- **Which take.** v004 (take 2) is current; v003 (take 1) is kept for A/B. Both takes were
  recorded at ≈ −30 LUFS in a live room; under the pure-splice policy that character ships
  as-is, and only a re-record changes it.
- The punchline (girlfriend / "research purposes") is **not** in this master — it is
  on-location dialogue. Leave A1 clear for it after `track-two-secured`.
- Beat durations in `manifest.yml` sum to 44.23s but are provisional; lock them against
  VO_EN_004 at the subtitle pass.

## Subtitle notes

Not started. Time against VO_EN_004 — not the raw take (23.0s of silence removed) and not
any v001–v003, which came from a different read.

## Retention checklist

Fill after assembly, before any review export.
