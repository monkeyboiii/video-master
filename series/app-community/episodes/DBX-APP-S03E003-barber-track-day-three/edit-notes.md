# Edit Notes — DBX-APP-S03E003

Track layout: V1 footage · V2 overlays · V3 spare · A1 voiceover · A2 music/SFX

Footage is not shot yet. This file currently carries the **VO audio** decisions only;
the assembly plan lands after the shoot.

## VO audio — take 2 en-US + take 2 zh-CN + two grafts (VO_EN_022 / VO_ZH_005)

Reproduce with `./vo-process.sh` (needs `auto-editor` on PATH and `ffmpeg`). One run writes
both masters, their MP3 review copies, and a review mix of each under the bed — all into
`media/**`, out of git.

The two reads are **sibling variants**, separately authored, processed identically and never
mixed with each other; each bed gain is computed from its own voice level. Everything below
applies to both unless a section names a locale.

### Policy: pure splice

Same rule as S03E001/E002: **dead air is cut and nothing else is touched.**

```
--edit audio:threshold=-34dB --margin 0.06s,0.12s --smooth 0.10s,0.08s
```

Unchanged since E002 v004. Room tone peaks −46 to −48 dB on the en take and −45 to −39 dB
on the zh, so −34 dB clears both. No EQ, denoise, gate, compression, limiting or tempo.
The founder's own material carries **no gain at all** — each locale is a single take, so
there is nothing to match. The one gain anywhere in the VO is the barber's, below, which is
the same documented exception E002 used when joining two takes.

**Verified, not asserted.** Gated octave-band spectrum of each master against its raw take
(gate 0.02 ≈ −34 dBFS, so only speech frames are averaged), **with the barber's line masked
out** — he is a different voice in a different room, so including him would measure the
casting change rather than the processing:

| | 125 | 250 | 500 | 1k | 2k | 4k | 8k | mean | tilt |
|-|----:|----:|----:|---:|---:|---:|---:|-----:|-----:|
| en-US | +0.09 | +0.24 | +0.20 | −0.09 | −0.02 | +0.05 | −0.26 | **+0.03** | 0.50 |
| zh-CN | +0.03 | −0.04 | −0.20 | +0.15 | +0.08 | +0.33 | +0.18 | **+0.08** | 0.53 |

Both means sit inside 0.07 dB. The tilt is wider than the ±0.04 dB these takes measured
before any grafting, and that is expected — three or four spoken lines have been removed
from each master, so the two sides of the comparison no longer average the same content.
It is content drift, not EQ; nothing in the chain can tilt a band.

### Two grafts, one rule

Two spans in each master come from somewhere other than the take: the barber's reply, and a
re-recorded mission line. Both go through the same `graft` step — match gain onto **this
take's** speech-gated RMS, house dead-air cut, then margins pinned to 0.06 / 0.12 — so a
listener cannot tell a second source from an ordinary sentence gap.

| | source | into en-US | into zh-CN |
|-|--------|-----------:|-----------:|
| barber's reply | VOX_001 | −15.94 dB | −17.68 dB |
| mission line | VOX_002 (en) / VOX_003 (zh) | −2.90 dB | +2.77 dB |

The pickups were recorded near the takes' own level, which is why their gains are small; the
barber's clip was recorded hot and clipped, hence the large ones. The mission line started as
one clip with a segment per locale (VOX_002); the zh half was then re-recorded on its own
(VOX_003), so the two locales no longer share a source file.

### The rafting line is cut, and the sentence after it re-recorded

"I used to come rafting here as a kid" / 小时候我来这边漂流过 opened a memory the episode
never came back to. It is gone from both masters — and so is the sentence that leaned on its
setup ("But this time…" / 但今天不一样，我要走遍…), replaced by a line that stands on its own:

| | new line | replaces | beat |
|-|----------|----------|-----:|
| en-US | "…and I'm still hunting down 100 dirt bike tracks." | rafting + "But this time…" | 5.90 → **3.68s** |
| zh-CN | 继续挑战走遍100个越野摩托车场 | 漂流 + 但今天不一样，我要走遍… | 6.11 → **3.93s** |

The zh line is on its second pickup. The first (这次继续走遍我的100个越野摩托车场) opened with
这次 and was followed immediately by 这次是第三个; the replacement drops that repetition.

**Which segment is which locale** was settled by transcribing each of the clip's two segments
in *both* languages: for segment a the English reading is a coherent sentence and the Chinese
is noise; for segment b it is the other way round. Cheaper and more certain than the spectral
test the barber's clip needed, because the two languages are far enough apart that only one
reading can survive.

### "Motomuet" is cut (en-US only)

The 0.79s utterance between "Perfect, that'll do." and "Another track down." — the one no
transcription could place — is dropped, so the episode ends on the count. `that-ll-do` goes
from 3.70s to **2.67s**. The zh tail was already 哎哟，蛮来赛 / 第三个场地拿下 and is unchanged.

### The barber answers in his own voice

Both masters originally had the founder reading the barber's reply himself. That read is
**gone from both**, replaced with the barber's own recording (`VOX_001`, a 4.29s field clip
holding both lines).

**Finding the lines without being able to hear them.** The clip is quiet off-mic chatter to
~1.4s, then two loud phrases. Which is which was settled by spectral fingerprint, not by
guessing: "say less" carries **15.1%** of its energy above 4 kHz (two sibilants) against
**0.1%** for 没问题, and the same measurement on the finished masters confirms the right one
landed in each — HF/LF −7.0 dB in the en master, −29.5 dB in the zh, matching their sources
exactly.

| | source window | in the master | length |
|-|--------------:|--------------:|-------:|
| en-US "say less" | 2.89–3.96 | **18.54–19.43s** | 0.89s |
| zh-CN 没问题 | 1.68–2.54 | **21.70–22.41s** | 0.71s |

**Level.** Matched on speech-gated RMS, because R128 is unreliable on a one-second fragment.
The result sits 0.15 dB from the founder's preceding line in the en master; in the zh it sits
1.6 dB under the ask, which is a loud line — against the master's own average it is 1.1 dB
*above*. The clip peaks at 0 dBFS in the source and is clipped there; the attenuation means
nothing clips in either master.

**auto-editor's margins had to be pinned.** It snaps margins to its frame grid, which left
up to 0.157s of head on the barber's piece — and that head is *his* noise floor, ~12 dB
below the take's room tone, so the join read as a hole and measured **0.27s** against a
0.19s house median. `pin_margins` trims both edges to the house 0.06 / 0.12 after the cut.
Both exchanges now measure exactly **0.190s** between the ask and the reply.

**The subtitle stage has to know about this.** Two speakers now share a beat in both
locales. Without a name tag, a colour change or a position change, the audience hears one
man answering himself — which is exactly the impression the swap exists to remove.

### The bed ducks under the exchange

The review mix drops the bed **10 dB** across the whole exchange — the founder's ask *and*
the barber's reply — with 0.15s ramps in and out, so it plays as a conversation rather than
as narration over music.

Both lines have been inside the window since the duck existed; 6 dB simply did not read as a
duck. Measured per line — **exactly 10.0 dB on all four**:

| | window | ask | reply |
|-|-------:|----:|------:|
| en-US | 15.37–17.33s | 10.0 dB | 10.0 dB |
| zh-CN | 17.49–20.19s | 10.0 dB | 10.0 dB |

It is built as a trapezoid on the bed's `volume` (`eval=frame`, `clip()` either side) rather
than a sidechain compressor, because sidechaining would duck under *every* line — the point
here is that this one moment is a conversation and the rest is not.

**Measure a duck by rendering the bed twice — duck on, duck off — and differencing the same
windows.** Two earlier methods both lied. A mix-minus-VO stem cancels imperfectly through MP3
and returned figures 3–4 dB out plus some impossible ones (−64 dB inside a continuous bed).
Rendering the bed alone and comparing ducked windows against un-ducked *neighbours* is better
but still wrong, because the instrumental's own level moves between them — that method read
this same 10 dB duck as anything from 6.5 to 13.3 dB depending on which bar it landed on.
Only the on/off difference over identical windows isolates the filter.

**The duck is a mix decision and is not in the VO master.** A1 stays clean.

### The zh-CN read is not level with itself

Its two regions measure **−30.6 and −32.1 LUFS** — the second half of the take is delivered
1.5 LU quieter than the first. Left alone: this is one continuous read, and evening it out
would be a performance edit rather than a dead-air cut, which the policy above forbids. It
is on the record here because if it turns out to be audible the fix is a re-record or an
explicit, documented exception — not something to slip in quietly.

### The stray breath at 44.51s (en-US)

A soft decaying event, **0.08s above threshold** (peaks −32 dB, tail runs to 44.70), alone
in a 2.3s pause and a further **0.47s clear** of the next line. It is a breath, not a click:
no single-frame spike, just a smooth decay.

Kept, auto-editor gives it a full margin on both sides, so the master would play
*line — 0.19s — [breath] — 0.19s — line*. Detached from any phrase by two ordinary sentence
gaps, that reads as a noise in a hole rather than as someone breathing. So it sits in a
discarded gap between regions — the last of four, the first three carrying the barber swap:

| Region | Source | In | Out | Content |
|--------|--------|---:|----:|---------|
| 1 | take 2 | 0.60 | 8.80 | "Come on out here…" → "…an hour's drive away." |
| — | VOX_002 | 0.10 | 2.90 | **"…and I'm still hunting down 100 dirt bike tracks."** |
| 2 | take 2 | 15.00 | 25.00 | "Track number three." → "…a local dirt bike track on weekends." |
| 3 | take 2 | 25.00 | 27.20 | "Hook a brother up." *(its own piece, so the duck can start exactly here)* |
| — | VOX_001 | 2.89 | 3.96 | **(barber) "say less"** |
| 4 | take 2 | 29.60 | 44.30 | "He's been riding…" → "…every weekend." *(skips the replaced read)* |
| 5 | take 2 | 44.85 | 66.75 | "Come on, let's see what we got." → "Perfect, that'll do." |
| 6 | take 2 | 68.10 | 69.94 | "Another track down." |

Three spans are discarded outright: **8.80–15.00** (the rafting line and the "But this time…"
it set up), **27.20–29.60** (the founder's read of the barber's reply), and **66.75–68.10**
("Motomuet").

Boundaries all fall inside silence — around the breath the words either side end at 42.67
and start at 45.06 — so nothing is clipped. That pause is rebuilt from the two auto-editor
margins (0.12s tail + 0.06s head) and lands at **0.19s** in the master, the median gap. Scanned the master for
isolated sub-150 ms bursts between long pauses: **none**. The same scan finds the breath in
the raw take.

### The click at 33.44s (zh-CN)

A **~10 ms transient peaking −29.0 dB**, alone in what would otherwise be a 2.55s pause
(the words either side end at 32.39 and start at 34.99). Five dB above the threshold, so
auto-editor keeps it as speech — a genuine click, like en take 1's, not a breath.

Same fix, same shape:

In v001 it needed a region of its own. In v002 it costs nothing: the span skipped to drop
the founder's read of 来赛 already swallows it.

| Region | Source | In | Out | Content |
|--------|--------|---:|----:|---------|
| 1 | zh take 2 | 0.60 | 6.30 | 这个周末… → 今天我们去浙江桐庐。 |
| — | VOX_003 | 0.55 | 3.60 | **继续挑战走遍100个越野摩托车场** |
| 2 | zh take 2 | 12.40 | 28.00 | 这次是第三个。 → …两边都去一下不过分吧。 |
| 3 | zh take 2 | 28.00 | 31.00 | 兄弟，给我整一个最 dirt bike 的… |
| — | VOX_001 | 1.68 | 2.54 | **(barber) 没问题** |
| 4 | zh take 2 | 33.65 | 63.86 | 他骑车已经十多年了… → 第三个场地拿下！ |

6.30–12.40 is discarded (漂流 + 但今天不一样，我要走遍…), and 31.00–33.65 is discarded, which
is the read reply **and** the click. Master scanned for
isolated sub-150 ms bursts between long pauses: **none**; the same scan finds the click in
the raw take.

**Four takes into S03, every single one has needed this.** en take 1 a −21.8 dB click,
en take 2 a −32 dB breath, zh take 2 a −29 dB click, and E002.5's en take a −33 dB handling
noise at the tail. Treat the 5 ms profile as a required step before writing any region
range, not a check you run when something sounds wrong.

### Pacing

| | speech runs | gaps | median | p90 | max |
|-|------------:|-----:|-------:|----:|----:|
| en-US | 24 | 23 | 0.190s | 0.200s | 0.220s |
| zh-CN | 20 | 19 | 0.190s | 0.210s | 0.210s |

The en master is byte-identical across the zh pickup swap — checksummed before and after, so
`vo-process.sh` is reproducing it deterministically.

Both tighter and more uniform than E002 (0.15 / 0.20 / 0.23), and both have max equal to
p90 — as even as the house settings get. In each case the region join measures the median,
so it cannot be picked out from an ordinary sentence gap.

Several delivered pauses were long and are flattened to house margin on purpose — en: 2.13s
before "Hook a brother up.", 2.39s before "He's been riding for 10 years.", 2.42s before
"Yeah, this one's definitely going on a map."; zh: 2.11s before the Tony 老师 line, 2.55s at
the click split. If the edit wants a breath at any of those, it should come from the
picture, not from re-cutting the VO.

### Length

| | duration | vs the other locale |
|-|---------:|--------------------:|
| en-US | 40.99s | — |
| zh-CN | 40.98s | 0.01s shorter |

Both lost ~2.2s to the rafting cut and its re-recorded follow-on; en lost a further 1.03s to
"Motomuet" and 0.38s earlier to the barber swap. The two locales now land 0.01s apart, which
is pure coincidence — they are still cut per locale, not to a shared timeline, and their
beats do not line up inside that total (see the table in `manifest.yml`).

Close overall, but the beats do not line up inside that: `the-barber` runs **6.42s in zh
against 2.96s in en**, because the zh keeps 来都来了，两边都去一下不过分吧 inside that beat
while the en lands the premise in one line. `ten-years` goes the other way (6.99 zh / 8.43
en). Per-locale figures are in `manifest.yml`; cut the picture to each read rather than to a
shared timeline.

### Level

| | integrated | peak | duration |
|-|-----------:|-----:|---------:|
| en-US | −30.6 LUFS | −7.8 dBFS | 40.99s |
| zh-CN | −31.2 LUFS | −9.1 dBFS | 40.98s |

Each is its own take's level; no normalisation was applied. Delivery loudness is set at
export QC (−14 LUFS target, `skills/08`), not here.

### Music bed — review mix only

`usher-yeah-instrumental.mp3` (248.19s, −10.0 LUFS), sat **8.5 dB under the measured voice**
→ **−29.20 dB** on the en mix, **−29.80 dB** on the zh. 0.5s fade in, 1.5s fade out at the
tail, and a 10 dB duck under the barber exchange (above).

**8.5 dB is the third setting.** v001 ran at 10 dB and read quiet; 7 dB read loud; 8.5 splits
them. Verified by isolating the en bed stem (mix minus the dry VO) and measuring it:
**−39.4 LUFS against the voice's −30.7, so 8.7 dB under** — the extra 0.2 dB over nominal is
the fade in and out pulling the integrated figure down. Speech lifts +1.3 dB, mix peaks
−8.2 dBFS, no clipping. `MUSIC_BELOW_VO` in `vo-process.sh` is the one knob, shared by both
locales.

The zh mix measures the same way: bed **−39.9 LUFS against its voice's −31.3, 8.6 dB under**.

Measure a bed by **subtracting the dry review from the mix**, not by sampling RMS inside a
few gaps: on a beat-driven track a 0.2s window lands on a snare or between two, and the
same bed reads 5 dB apart depending on which gaps you pick.

Invert with `volume=-1` on the input, not with a negative `amix` weight — `weights=1 -1` is
silently not honoured, so you get the **sum** instead, which reads several dB *louder* than
the voice and looks like a broken mix:

```
-filter_complex "[1:a]volume=-1[i];[0:a][i]amix=inputs=2:duration=first:normalize=0[o]"
```

The instrumental runs at one level from 0:00 — no intro build to place, unlike v001's
track — so `MUSIC_START` stays at 0.

**Licence: NOT CLEARED.** Commercial recording, placeholder for review only — same standing
problem as E001's freek-a-leek and E002's 50 Cent instrumental. This one additionally
**peaks +1.0 dBFS in the source**: a clipped master. It is attenuated 27.7 dB here so it
cannot clip the mix, but it must never be used at or near unity.

### Superseded

**Every earlier master is deleted.** The lineage, newest first: **en v004 / zh v004** (this
one — zh mission line on its second pickup); zh v003 (rafting cut, mission line re-recorded,
"Motomuet" cut from en); en v003 / zh v002 (barber's own reply grafted in); en v002 / zh v001
(founder voicing the barber). Same two takes throughout — nothing in that chain was a re-cut
of a different read, only grafts onto and cuts out of the same material.

**v001 (take 1, VO_EN_018) is retired** — the read itself, not just the cut. Take 2 is
15.4s shorter raw and 8.5s shorter cut for the same story, lands `the-barber` in one line
instead of two, and replaces the ending. Take 1's girlfriend callback does not exist in
take 2. Its masters and mixes are deleted; the raw take is kept in `media/**` as the only
copy.

What take 1 taught, kept on the record: its own threshold trap was a **15 ms click at
−21.8 dB** at 65.53s — a genuine click, where take 2's is a breath. Both needed the same
region-split fix.

### Not carried over from E002

No record scratch or any other SFX: none was supplied and neither read asks for one.
E002 shipped one English soundtrack with a Chinese hook spliced over the front; this
episode has a **complete, separately authored zh-CN read** instead — the second in S03
after E002.5, and per `docs/localization.md` neither locale is translated off the other.

### Transcription confidence differs sharply by locale

The en take transcribes well enough to argue with. **The zh take does not**: whisper base
gets the Hangzhou-dialect words wrong or drops them (来赛 → "来是", 木佬佬 gone), hallucinates
a line near 59s that duplicates later content, and emits nothing at all for the final run.
`script.zh-CN.md` therefore carries the operator's written script as its text, with only the
divergences the transcription makes unambiguous listed separately. **Do not build zh
subtitles from ASR here** — it needs an ear pass line by line.

## DECIDE (human)

1. **The barber's release.** His voice is now in both masters. Not a licensing question —
   a consent one: confirm he agreed to be recorded and published before this ships.
2. **Subtitles must mark him as a second speaker** in both locales, or the exchange reads as
   the founder answering himself and the swap is wasted.
3. Two lines in `script.en-US.md` are not merely uncertain wording — I cannot tell what is
   being said: **"Unless it started a series"** (37.53–38.93s) and **"Motomuet"**
   (42.31–43.11s). Three more are marked (?). All need an ear pass before subtitles.
4. **The zh script's two placeholders were never filled.** `[赛道独特信息]` and
   `[一个有意思的信息]` are absent from the delivered take — it goes straight from
   走，看看这里有啥 to 地方不大. The en read has no track-specific detail either. As it stands
   **neither cut contains a single line that is only true of this track**; either re-record
   or let the picture carry it, but make it a decision.
5. The zh read's 1.5 LU internal level drift (see above) — leave, or re-record.
6. Bed level — 8.5 dB under the voice on both locales, ducking 10 dB under the exchange;
   `MUSIC_BELOW_VO` and `DUCK_DB` move each independently.
7. Music licence, unchanged across all of S03, plus the clipped-source note above.
