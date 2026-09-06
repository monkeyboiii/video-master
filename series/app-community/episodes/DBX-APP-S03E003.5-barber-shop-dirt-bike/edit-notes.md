# Edit Notes — DBX-APP-S03E003.5

Track layout: V1 footage · V2 overlays · V3 spare · A1 voiceover · A2 music/SFX

Footage is not shot yet. This file currently carries the **VO audio** decisions only;
the assembly plan lands after the shoot.

## VO audio — take 1 zh-CN (VO_ZH_006)

Reproduce with `./vo-process.sh` (needs `auto-editor` on PATH and `ffmpeg`). One run writes
the master, its MP3 review copy, and a review mix under the bed — all into `media/**`, out
of git.

### One region, for once

Same rule as the rest of S03: **dead air is cut and nothing else is touched.**

```
--edit audio:threshold=-34dB --margin 0.06s,0.12s --smooth 0.10s,0.08s
```

Every earlier S03 take needed the read carved into regions to step over something — a click
at −21.8 dB, a breath at −32 dB, a click at −29 dB, handling noise at −33 dB. **This one
needed nothing.** The stray scan comes back empty, and the −38.7 dB noise at the tail sits
under the threshold, so auto-editor drops it unaided. Single region, `0.60 → 69.39`.

Worth saying plainly because the streak made it look inevitable: the region-splitting is a
workaround for the take, not a property of the pipeline. A clean take runs straight through.

**Verified, not asserted.** Gated octave-band spectrum of the master against the raw take
(gate 0.02 ≈ −34 dBFS, so only speech frames are averaged):

| Band | 125 | 250 | 500 | 1k | 2k | 4k | 8k |
|------|----:|----:|----:|---:|---:|---:|---:|
| master − raw (dB) | +0.02 | +0.01 | −0.00 | +0.01 | +0.03 | +0.02 | +0.01 |

Mean +0.01 dB, tilt 0.03 dB. **1935 gated frames in the raw take, 1934 in the master** — a
single frame's difference, which is as close to "only silence was removed" as this
measurement gets.

### Pacing

28 speech runs, 27 gaps: **median 0.200s, p90 0.210s, max 0.280s.**

The one 0.28s gap (24.07–24.37) was checked at 5 ms in case it was another stray: it decays
cleanly from −27 dB to room tone at −50 dB and stays there until the next word. A genuine
sentence boundary with a slow tail, nothing in it.

One run is split mid-phrase at 43.07–43.21 (0.14s) by `--smooth`. That is shorter than every
sentence gap in the file (minimum 0.18s), so it reads as a breath inside the line rather than
as a pause between two.

Median 0.200s is marginally slacker than E003's 0.190s — the delivery, not the settings.

### Level

**−31.2 LUFS / −10.2 dBFS peak / 49.00s**, the take's own level; no normalisation. Delivery
loudness is set at export QC (−14 LUFS target, `skills/08`), not here.

At 49.00s this is the longest cut in S03 — E003 is 40.99s and E002.5 is ~21s.

### Music bed — review mix only

`show-me-instrumental.mp3` (219.72s, −11.8 LUFS whole-file), sat **8.5 dB under the measured
voice** — the level shared with E003 — at **−28.80 dB**, 0.5s fade in, 1.5s fade out.

**`MUSIC_START` is 50s, and that is not cosmetic.** This track is not level with itself: a
~20s intro sitting 10 dB under the body, and breakdowns at 40s, 100s, 130s, 170s and 190s.
Profiled at 5s resolution, the flattest 49-second window in the whole file starts at **50s**
(2.4 dB spread). From 0s the bed would open 10 dB too quiet and then jump; from 20s it would
walk into the 40s breakdown about 20 seconds into the episode.

**The bed gain is now measured over the window actually used**, not over the whole file
(`lufs_of "$MUSIC" "$MUSIC_START" "$duration"`). On a track with breakdowns the two differ —
here by 0.9 dB — and the whole-file figure quietly leaves the bed at the wrong level. Earlier
episodes used the whole-file measurement; on Usher and California Love it happened not to
matter, because both run flat.

**Measure the bed in stereo.** Checking it as a mono fold-down read **11.7 dB under the
voice** against a true **8.5 dB** — this track's sides cancel enough to cost 3.2 dB when
summed, and it looks exactly like a mis-set gain. Two verification passes were spent chasing
a level that was never wrong. Render the bed stem at the mix's own channel count.

**Licence: NOT CLEARED.** Commercial recording, placeholder for review only — the standing
problem across all of S03. It also **peaks +0.9 dBFS in the source**, a clipped master, same
as the Usher instrumental; the 28.8 dB attenuation keeps the mix clean but it must never run
near unity.

### The other candidate beds

Three beds are rendered from the same master, all at **8.5 dB under the voice**, all verified
in stereo, none clipping:

| bed | file | start | window | gain | mix peak |
|-----|------|------:|-------:|-----:|---------:|
| Show Me *(chosen)* | `_review-mix.mp3` | 50s | −10.9 LUFS | −28.80 dB | −13.2 dBFS |
| Magnolia | `_review-mix-magnolia.mp3` | 21s | −7.3 LUFS | −32.40 dB | −13.5 dBFS |
| Freek-a-Leek | `_review-mix-freek-a-leek.mp3` | 0s | −10.0 LUFS | −29.70 dB | −13.5 dBFS |

The gains differ by 3.6 dB across the three, which is entirely the tracks' own levels — the
bed lands in the same place under the voice in all three, so this is a straight A/B on the
music and nothing else.

**Freek-a-Leek is E001's bed**, and it is the only candidate that is flat from the first bar:
0.6 dB spread across its first 49 seconds against 2.4 dB for Show Me's best window. Its start
is 0 because that measured out best, not because 0 is the default. It also peaks **+2.4 dBFS**
— the most clipped source in `media/audio/`. Reusing it would tie this episode back to the
series opener, which is an editorial call rather than an audio one.

`vo-process.sh` now carries a `BEDS` list — first entry is the chosen bed and writes the
plain `_review-mix.mp3`, the rest write `_review-mix-<name>.mp3`. Adding or reordering beds
is a one-line change, and every candidate stays reproducible.

Two things to know before Magnolia can be chosen:

- **The file is 70.09s and the drop is at 23s.** 21s is the latest start that still covers
  the 49.00s master (21 + 49 = 70.0 exactly), so the bed swells in over the first ~2s under
  the hook — pleasant here, but there is no headroom. A longer re-cut cannot use this file
  without looping it.
- **It may not be the instrumental.** The name carries no `-instrumental` marker and a
  sampled window transcribes as "(upbeat music)" with no lyrics recovered. That is the same
  inconclusive signal California Love gave on E002.5 — suggestive, not proof. **Confirm by
  ear**; a vocal bed under a voiceover is unusable at any level.

### Not carried over from E003

No ducking: there is no two-speaker exchange in this read, so there is nothing to duck under.
No SFX. No grafts — every second of this master comes from one take.

## Relationship to S03E003

Same barber, same track, different question, **and E003 is untouched**. E003 is the mission
episode — how a track nobody has mapped gets found. This is the portrait — who built it, what
it cost, and who rides it now. Filed as an interstitial so it publishes between E003 and E004
without moving the 100-track counter; no new track is visited.

Nothing is shared between the two cuts: different take, different instrumental, no reused
audio.

## DECIDE (human)

1. **The transcription is weak and the script is built on it.** whisper base mishears heavily
   here — 全杭州 became 全行中, 土堆 became 吐嘴, 徒弟 became 图地. `script.zh-CN.md` lists
   every correction I inferred, but the **final line (65.76–68.37s) is unreadable** and three
   more places are marked (?). All need an ear pass before any subtitle work.
2. **The three numbers** — 快100万, 三层楼高的落差, 20多米的大跳台 — are the spine of the
   episode and all three are second-hand. Confirm them; the comments will test them.
3. **Consent, again.** E003 puts the barber on camera; this one is *about* him, his money and
   his age. Different question from E003's, worth asking separately.
4. No en-US variant exists. If one is wanted it is authored natively, never translated off
   the Chinese page (`docs/localization.md`).
5. **Which bed** — Show Me (current `_review-mix.mp3`), Magnolia, or Freek-a-Leek.
6. Music licence, unchanged across all of S03, plus the clipped-source notes above.
