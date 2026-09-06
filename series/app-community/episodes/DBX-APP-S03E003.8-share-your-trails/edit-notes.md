# Edit Notes — DBX-APP-S03E003.8

Track layout: V1 footage · V2 overlays · V3 spare · A1 voiceover · A2 music/SFX

Footage is not shot yet. This file currently carries the **VO audio** decisions only;
the assembly plan lands after the shoot.

## VO audio — take 3 en-US (VO_EN_025, v003)

`./vo-process.sh` now builds **both locales** in one run (needs `auto-editor` on PATH and
`ffmpeg`): each master, its MP3 review copy, and a review mix under the bed — all into
`media/**`, out of git. **v001 and v002 are superseded and their masters are deleted**; all
three en-US recordings are still on disk.

The two locales are **sibling variants, not translations** (`docs/localization.md`). Same
thirteen beats, separately authored, and they differ where it matters — see § zh-CN below.

### A clean take, cut in two on purpose

Same rule as the rest of S03: **dead air is cut and nothing else is touched.**

```
--edit audio:threshold=-34dB --margin 0.06s,0.12s --smooth 0.10s,0.08s
```

Nothing had to be stepped over. The loudest thing before the speech body is **−48.4 dB**.
Fourth clean take in S03 — the region-splitting on E001/E002/E003 was always a workaround for
those takes, not a property of the pipeline.

So the **only** reason this read is cut into two regions is the meme insert below.

This take arrives as **mono**, unlike take 2's dual-mono stereo, so there is no fold-down to
justify this time.

**Verified, not asserted.** Gated octave-band spectrum of the master against the raw take
(gate 0.02 ≈ −34 dBFS, so only speech frames are averaged):

| Band | 125 | 250 | 500 | 1k | 2k | 4k | 8k |
|------|----:|----:|----:|---:|---:|---:|---:|
| master − raw (dB) | −0.03 | −0.00 | −0.01 | −0.00 | +0.02 | +0.03 | +0.09 |

Mean +0.02 dB, tilt 0.12 dB. Gated frames 1044 → **1043**.

### The meme insert

The ask was ~1s of empty room after "we're gatekeeping all the way" for a meme card.

auto-editor's whole job is removing that room, so the gap has to be put back deliberately:

- **Region A** `0.40 → 29.15`, **Region B** `29.15 → 64.513`, split at the midpoint of the
  1.41s pause. Each half is cut with the identical house settings.
- **1.00s of room tone** is spliced between them, taken from **28.60–29.60s of the raw take**
  — *inside the very pause it extends*. So the insert lengthens the silence with the room's
  own material and introduces nothing.

**It measures like the room.** The take's noise floor runs **−55.7 to −60.1 dB** across nine
long pauses. The meme pause in the master reads **−58.2 dB**, mid-range. No level step at
either join.

**In the master the pause is 19.00 → 20.20s (1.20s).** That's the number the edit needs.

### The source file has ten digital dropouts

**Take 3 contains 10 runs of true digital silence, 72–91 ms each**, at 0.00, 0.12, 7.60, 8.09,
11.70, 20.15, 20.74, 47.75, 52.49 and 62.32s. They look like packet-level silence insertion —
the signature of a lossy transfer path or a gating recorder, not of the room.

**Every one falls inside a pause; none is inside a word**, and all ten are removed by the cut.
The finished master contains **no run of near-zero samples longer than 1 ms**, verified. The
room-tone window for the meme insert was vetted against them (21 near-zero samples in 48000,
which is ordinary zero-crossing).

So this take is fine. But it is luck, not design: a dropout that lands mid-word cannot be cut
around, and neither takes 1 nor 2 had any. **Worth chasing how this file got here** — if it
came over a messaging app or a cloud sync, get the original off the recorder instead.

### Two artefacts that had to be trimmed, not tolerated

**auto-editor pads its output up to a whole video frame with digital silence.** Left in, that
is a hole at the A/B join — *inside the meme pause* — and another at the end of the master.
`vo-process.sh` measures the last non-zero sample of every auto-editor output and trims there
before concatenating.

This is a pipeline scar, not a take property: it applies to every master this repo has cut.
It was inaudible in the earlier ones (a few ms under a fading bed), which is why it went
unnoticed until a piece had to be joined mid-file.

**The recording's own encoder tail.** The take's real content stops at **64.513s**; the last
20 ms of the file are the AAC encoder's tail at −78 to −114 dB. Region B ends at 64.513 rather
than the 64.533 EOF so the master doesn't end on it.

**No tail pad this time.** The note on take 2 said to leave air rolling at the end, and this
take does — the read finishes **0.65s** before the recording stops, so auto-editor had the
source to leave its own margin. The master's tail is 0.155s of real room tone.

### Pacing

34 speech runs, 33 gaps: **median 0.225s, p90 0.245s, min 0.120s.**

**The meme pause is the only gap in the cut above 0.25s** — 1.20s against a 0.225s median.
It is unmissable by design, which cuts both ways: if the picture does nothing there it will
read as a mistake, not a beat. `meme-room` is a real beat in `manifest.yml` for that reason.

Median 0.225s, the same as takes 1 and 2 — that figure is the settings, not the delivery.
What changed is the read: take 3 is **2.4s shorter** than take 2 over the same content.

### Level

**−28.9 LUFS / −7.2 dBFS peak / 41.17s**, the take's own level; no normalisation. The three
takes measure −30.7 / −27.8 / **−28.9** LUFS mono-to-mono, so take 3 sits between the other
two. Delivery loudness is set at export QC (−14 LUFS target, `skills/08`), not here.

*Measure like with like.* Take 2 arrived as dual-mono stereo and read −24.8 LUFS that way,
because R128 sums channels; the same content as mono was −27.8. Take 3 is mono to begin with,
so the file's own figure is directly comparable.

### Music bed — where it starts, and why there is no fade

`riders-on-the-storm-instrumental.mp3` (372.30s, −17.1 LUFS whole-file), sat **8.5 dB under
the measured voice** — the level shared with E003, E003.5 and E002.5 — at **−20.40 dB**.

**The track does its own entrance, so nothing is faded in.** It opens with **3.94s of sparse,
near-silent ambience** (−31 to −48 dB peak) and then enters on a **hard downbeat at 3.940s**:
−36 dB to −7.8 dB peak inside one 20 ms block, a 27 dB step. It does **not** crescendo — what
sounded like one on v001 was a 0.5s `afade` I had put there. That fade is gone.

**`MUSIC_START` is derived, not chosen:**

```
MUSIC_START = BED_ENTRY − SENTENCE_2 = 3.940 − 2.420 = 1.520
```

where 2.420s is the first word of the master's second sentence. So the downbeat lands exactly
on "**While** I was out DM'ing track owners", and the hook plays over the ambience alone.
Both constants are measured; if the read is ever re-cut, re-measure `SENTENCE_2` and the
alignment follows.

Verified on the rendered bed stem, in stereo, at the mix's own channel count (the E003.5 scar
— a mono fold-down under-reads a stereo bed and looks exactly like a mis-set gain):

| | peak | rms |
|---|---:|---:|
| bed under the hook, 0.00–2.42s | −49.3 dBFS | −65.5 dBFS |
| bed after the entry, 2.42–6.00s | −25.0 dBFS | −38.8 dBFS |
| **step at 2.420s** | **+26.5 dB** | |

| | |
|---|---|
| VO | −28.9 LUFS |
| bed, as mixed | −37.6 LUFS |
| **bed under voice** | **8.7 dB** (target 8.5; the 0.2 is the fade-out, which is a larger share of a shorter master) |
| mix | −28.7 LUFS, peak **−10.5 dBFS** |

**Know what this buys.** The hook doesn't get a *quiet* bed, it gets effectively **none** —
−65 dBFS is inaudible. This track has no soft body to sit under a voice: it is near-silence
and then the band. If the hook wants something under it, that is a different track, not a
different start point.

There is **no click** at the hard start: at 1.520s into the file the first samples are zero.

**This is the first bed in `media/audio/` that is not a clipped master.** It peaks −3.2 dBFS,
against +0.9 (show-me), +0.4 (magnolia) and +2.4 dBFS (freek-a-leek).

**It is also by a wide margin the most level track in the library** — 5s RMS between −18.3 and
−19.7 dB from 5s to 340s, a 3.5 dB spread across nearly six minutes, no breakdowns. That is
what makes the derived start safe: anywhere in the body measures the same, so aligning to the
downbeat costs nothing in level.

**Licence: NOT CLEARED.** Commercial recording, placeholder for review only — the standing
problem across all of S03.

### Not carried over from E003

No ducking: there is no two-speaker exchange in this read. No SFX. No grafts — every second of
speech comes from one take, and the only non-speech material is the take's own room tone.

## VO audio — take 1 zh-CN (VO_ZH_007, v001)

**−31.3 LUFS / −10.4 dBFS peak / 44.51s.** Clean take again: −44.6 dB before the speech body,
−46.4 dB after it, so nothing above the threshold had to be stepped over. 33 speech runs,
gaps **median 0.225s, p90 0.265s, min 0.165s**.

Two structural edits, and they are the only two.

### The graft — the DM rider says his own line

The founder read the rider's request himself (raw 9.95–12.52s). That read is **replaced** by
the rider's own recording, VOX_001 — the same move as the barber's reply on S03E003. In en-US
the founder still plays the part; this is a real difference between the variants, not a
translation artefact, and the edit can treat the zh beat as a cutaway.

**Graft lands at 6.79 → 9.05s of the master (2.26s).** The joins measure **0.21s and 0.20s**
against a 0.225s median gap, so the splice is invisible in the pacing. Both were profiled at
5 ms: the word before decays −27 → −37 → −45 and settles into room tone, the graft's own word
decays the same way into the next join. **No level step, no click, at either end.**

**Match gain −1.76 dB**, applied *before* the cut so auto-editor sees the level it will be
heard at. This is the documented exception to the no-gain rule (`AGENTS.md`): joining takes.

*The reference is the whole take, not a neighbour.* The zh take drifts **1.9 dB across
itself** — −29.89 dB (before the graft) / −28.00 (after) / −28.23 (the closing third),
speech-gated. Matching to whichever region happens to sit next door would make the graft's
level depend on where a region boundary falls; the whole-take figure (−28.48) sits within
0.5 dB of the mean of the two neighbours and doesn't move if the boundaries do.

Worth recording: the line the graft replaces was the **quietest thing in the take** at
−30.53 dB, 2 dB under the take's own average.

### The meme insert — and why its tone is borrowed from elsewhere

Same 1.00s hold as en-US, after 对，先藏着。谁也不给看。 **In the master the pause is
22.55 → 23.77s (1.22s)**, against a 0.225s median. Apart from it the largest gap in the cut is
0.32s.

**The tone could not come from the pause it extends.** On en-US it did; here the zh take's own
meme pause (35.49–37.19s) has **three digital dropouts inside it** (36.210, 36.337, 36.670),
which leaves no clean second anywhere in it.

The replacement is **42.32–43.32s**, the closest dropout-free second in the file — rms
**−55.0 dB** against the pause's own −54.1, peak −44.1 against −44.5, and even across its
whole length at 20 ms resolution (−44 to −51, no transient). In the master the inserted second
reads **−55.1 dB**. Two other candidates were rejected: 61.95 has a −41 dB tick in it, and
6.08 sits 3 dB low.

### Sixteen dropouts in the source, same as en-US take 3

The zh take carries **16 runs of true digital silence, 5–100 ms**, and the VOX_001 clip two
more. Same signature as en-US take 3 — the whole batch has been through a lossy transfer, not
a room.

**Every one falls inside a pause; none is inside a word**, and all are removed by the cut. The
master contains **no run of near-zero samples longer than 1 ms**, verified. But two of them
landed in the one pause the edit actually needed, which is exactly the cost of this: the
dropouts are not free even when they are all in silence.

### Pure splice, and how it was measured around the graft

The whole-master-against-whole-take test is the wrong test here, because the graft is a
different person's voice. Run it anyway and it reads +0.11 dB mean with **0.73 dB tilt and
+0.63 at 8 kHz** — that is the rider's voice, not processing.

The right test is the take-derived material against its own source (master 9.25–44.50 against
raw 14.20–65.96):

| Band | 125 | 250 | 500 | 1k | 2k | 4k | 8k |
|------|----:|----:|----:|---:|---:|---:|---:|
| master − raw (dB) | +0.03 | +0.04 | +0.06 | +0.07 | +0.07 | +0.05 | −0.06 |

Mean +0.04 dB, tilt 0.13 dB. Dead air removed, nothing else touched.

### Bed

Same derivation, re-measured: sentence two starts at **2.480s**, so
`MUSIC_START = 3.940 − 2.480 = 1.460`. Verified **+26.5 dB step at exactly 2.480s** — the
downbeat lands on 起因. No fade in, first samples are zero, no click.

| | |
|---|---|
| VO | −31.3 LUFS |
| bed, as mixed | −39.9 LUFS |
| **bed under voice** | **8.6 dB** (target 8.5) |
| mix | −31.2 LUFS, peak **−13.8 dBFS** |

Bed under the hook: peak −51.8 dBFS, rms −67.8 dBFS — inaudible, same as en-US and for the
same reason.

### No ducking

The graft is a two-voice exchange, which is what triggered the duck on S03E003. **It is not
ducked here, because it was not asked for.** If it should be, the numbers are ready: the
window is 6.79–9.05s and E003 used −10 dB with a 0.15s ramp. Note the bed under this stretch
is already at −39.9 LUFS, well below the voice, so the duck would be a stylistic mark rather
than an intelligibility fix.

## Relationship to the rest of S03

The second interstitial in the E003–E004 gap. It shares nothing with E003.5 except its
position; that one is a portrait of the barber, this is a product demo. The 100-track counter
does not move — no track is visited.

**One collision to watch.** "Say less" is the barber's line in E003 and the founder's line
here — 懂了哥，无需多言 in zh. If the two publish close together the edit should make it
obvious these are two different people saying it, or one of them should go.

**And a second identifiable voice.** zh-CN puts the DM rider on the soundtrack. E003 raises
the same question for the barber; this is a separate person and a separate ask.

## DECIDE (human)

1. **The DM rider's release.** zh-CN carries a second identifiable person's voice (VOX_001).
   Nothing is on file. Separate from E003's barber question.
2. **The closing line — and a cross-check that helps.** en-US take 3's closer transcribed as
   "Do you think it's a good idea?", which I filed as unreadable because it didn't match the
   scripted "Please!!!". **The zh read closes on 这是不是还算比较有用？ — the same move.** So
   the en transcription is probably roughly right and the ending was deliberately changed from
   a plea to a question in both variants. Still needs an ear, but the direction is now clear.
3. **"track owners get their spot" is gone on purpose.** It was in en take 1 only; en takes 2
   and 3 drop it, **and the zh script you wrote doesn't have it either**. Three reads out of
   four agree, so this reads as a decision rather than a slip — flagging it once more only
   because it removes the one line aimed at track owners, the audience E003 spent an episode
   with, and half of what "one map, two kinds of pin" meant.
4. **Should the zh exchange be ducked?** The graft is a two-voice exchange like E003's barber
   reply, which you asked to duck there. Not done here because not asked. Window 6.79–9.05s if
   you want it.
5. **The simple-map line has different words in all three en takes** — "It's mad simple" →
   "It's a mad simple map" → "It's a super simple map". zh is settled (其实很简单). Pick one
   for en.
6. **Digital dropouts in both new source files** — 16 in the zh take, 10 in en take 3, 2 in
   the rider's clip. All in pauses, all cut out, no damage. But two of them landed in the one
   pause the zh edit needed, forcing the room tone to be borrowed from elsewhere in the file.
   Worth finding out how these files are reaching the machine.
7. **Does the shipped flow match the claims?** "默认只有自己可见" / "private by default" and
   the one-tap toggle in both directions are stated as facts about the product in both
   variants. Any confirm step, delay or different default makes this a promise the app breaks
   on first use.
8. **The meme card is load-bearing, in both locales.** 1.20s (en) / 1.22s (zh) of held room
   tone, the only long pause in either cut. Decide what goes there before the assembly.
9. Music licence, unchanged across all of S03 — though for once the source itself is clean.
