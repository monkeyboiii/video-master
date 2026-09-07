# Edit Notes — S03E004

Reproduce everything below with `./vo-process.sh`. Nothing here is a mix decision that
survives into an export — the master is voice only, and the bed exists in the review mp3.

Sources deleted from the project root after import, per the standing instruction. They live
at `media/S03E004/voiceover/` and `media/audio/`, both git-ignored.

**Two locales, and they do not share much.** The zh-CN master (VO_ZH_009, cut 2026-08-30,
gained 2026-08-31) is unchanged and byte-identical after the en-US pass; the en-US master
(VO_EN_027) was added 2026-09-01 with its own bed, its own bed placement and its own delivery
gain. Where the two sections below disagree, they disagree on purpose.

## VO audio — take 1 zh-CN (VO_ZH_009, v002)

| | |
|---|---|
| source | `DBX-APP-S03E004_zh-CN_vo-take1.m4a` — 72.94s, mono, 48 kHz AAC |
| master | `DBX-APP-S03E004_zh-CN_vo_v002.wav` — **52.07s**, -21.5 LUFS, -1.0 dBTP |
| settings | `--edit audio:threshold=-34dB --margin 0.06s,0.12s --smooth 0.10s,0.08s` |
| regions | one: `0.20 → 72.60` |
| delivery | one constant **+10.10 dB**, applied after the splice (see below) |

### The first S03 episode that is only a silence cut

E003 needed two grafts and a re-record. E003.5 needed a bed A/B. E003.8 needed a room-tone
insert in both locales and, in zh-CN, a graft. This one needed **nothing**: one region, one
`auto-editor` pass, one file out.

That is worth saying plainly because it is the read that made it possible, not the tooling.
Nothing above the threshold had to be stepped over anywhere in 72.94 seconds:

- loudest thing before the speech body: **-43.3 dB** (0 → 0.52s)
- loudest thing after it: **-40.4 dB** (71.70s → end)
- the only non-speech transient in the middle: a **10 ms tick at 63.94s, -39.8 dB peak**,
  which sits 5.8 dB below the -34 dB threshold and falls out without being asked to. It is
  150 ms ahead of the dropout pair at 64.090/64.097s, so it is probably the same transfer
  artefact, not a mouth noise.

The region bounds are the only judgment in the cut. `0.20` clears the 24.7 ms dropout sitting
at sample zero; `72.60` clears the two at 72.906/72.913s and still leaves 0.90s of room for
`auto-editor` to take its 0.12s tail margin out of. Neither bound touches speech — there is
0.32s of clear room after the head bound and 0.90s before the tail one.

### Nineteen digital dropouts in the source

Same signature as the E003.8 takes: runs of exact digital silence, 3–82 ms, dropped into a
continuous recording.

```
0.000  7.849  8.179  12.086  12.094  12.475  21.599  21.607  21.678  37.021
37.029  56.205  59.917  64.090  64.097  67.593  67.883  72.906  72.913
```

Every one falls inside a pause. None is inside a word. All nineteen are removed by the cut,
and the master's longest run of near-zero samples is **0.42 ms** — short enough that it is a
zero crossing, not a hole.

This is now three source files in a row with the same defect (E003.8 en take 3: ten;
E003.8 zh take 1: sixteen; this one: nineteen), and the count is going **up**. The cause is
almost certainly the transfer path rather than the recorder — packet-level silence insertion
is what a lossy hop does when it loses a frame. So far every one has landed in a pause and
cost nothing. That is luck, and on E003.8 the luck ran out enough to matter: three of them
landed in the one pause that edit needed to borrow room tone from. **Worth chasing before a
take lands one mid-word**, at which point the take is gone.

### Pacing

The raw read is unusually spacious. Its own gaps have a **0.970s median** and a 1.610s max —
E003.8's zh take ran 0.225s median in the master and this one is nearly a full second
between phrases in the source. The cut removes **20.87s**, more than a quarter of the
recording, which is the largest proportional cut in S03.

What comes out the other side is even:

| | master |
|---|---|
| speech runs | 30 |
| gap median | 0.225s |
| gap p90 | 0.255s |
| gap max | **0.320s** (14.78 → 15.10s) |
| gap min | 0.135s (4.96 → 5.09s) |

There is no outlier to explain. The 0.320s at 14.78s sits between 两面环山 and 一面抱水 and
reads as a list beat; the 0.135s at 4.96s is inside the Li Bai quote, between 须行即骑 and
访名山, and is the tightest join in the episode. Neither needed a region of its own.

### Level

| | LUFS | peak |
|---|---|---|
| raw take | -31.8 | -11.1 dBFS |
| cut, before delivery gain (v001) | -31.6 | -11.1 dBTP |
| **master v002** | **-21.5** | **-1.0 dBTP** |

The +0.2 LU from the cut is it removing quiet material and nothing else. Both measured as
mono, against mono — R128 sums channels, so a dual-mono stereo copy of the same audio reads
~3 LU louder. That mistake cost a wrong paragraph on E003.8; the rule is **measure like with
like**.

### Delivery level — the one gain in the chain

The cut on its own landed at -31.6 LUFS. **Every master in this repo lands there** — E003.8
zh -31.3, E003 zh -31.2, E002 en -30.0 — which is roughly **17 LU under the ~-14 LUFS the
short-form platforms normalise to**, so they all play noticeably quiet next to a normal reel.
That is what the delivery stage fixes, and it is a new documented exception to the no-gain
rule, alongside take-matching and the bed level.

It is one constant broadband gain applied to the finished cut, and the figure is derived, not
chosen: **+10.10 dB** is what puts the louder of the voice master and the review mix exactly
on a -1.0 dBTP ceiling. Both get the same number, so the voice sits at the same level in the
master as in the mix.

```
DELIVERY_TP = -1.0
GAIN        = DELIVERY_TP - max(truepeak(voice), truepeak(mix)) = -1.0 - (-11.10) = +10.10 dB
```

| | before | after |
|---|---|---|
| master (mono) | -31.6 LUFS / -11.1 dBTP | **-21.5 LUFS / -1.0 dBTP** |
| `_review.mp3` (voice) | -31.9 LUFS / -14.4 dBTP | **-18.8 LUFS / -1.3 dBTP** |
| `_review-mix.mp3` | -31.5 LUFS / -14.4 dBTP | **-18.6 LUFS / -1.3 dBTP** |

Nothing clips: the master's sample peak is -1.003 dBFS with **zero samples at full scale**.

**It is provably a constant, not a process.** `v002 − (v001 × +10.10 dB)` is -143.5 dBFS —
122.2 dB under the signal, and flat to within 1.9 dB across 125 Hz–8 kHz, which is 24-bit
quantization and nothing else. A limiter, a compressor or a level ride would all leave a
residual that tracks the signal; none of them survives this test. Setting `DELIVERY_TP` empty
in `vo-process.sh` reproduces the ungained v001 exactly.

The review renders gained 3 LU beyond the gain itself, because this pass also stopped using
`-ac 2` for mono → stereo. ffmpeg's downmix matrix applies a **-3 dB pan law per channel**,
and since R128 sums channels the file measured the same while throwing away 3 dB of headroom.
`pan=stereo|c0=c0|c1=c0` keeps unity, so the delivered stereo now reads 3 LU louder than the
mono master at the same peak. Every review mp3 this repo has written until now had the pan
law in it — E003.8's shows the same -3.3 dB / -0.3 LU signature.

### Why this stops at -18.6 and not -14

Gain alone cannot close the last **4.6 LU**, and no ceiling choice recovers it — going to
-0.5 dBTP buys 0.5 dB and starts risking codec overshoot.

The obstacle is that this read has a **peak-to-loudness ratio of 20.5 LU**, where broadcast
speech is usually 12–14. The peaks are not clicks that could be clipped away without anyone
noticing:

| percentile of speech (20 ms blocks) | level |
|---|---|
| 50% | -24.3 dBFS |
| 95% | -16.3 dBFS |
| 99% | -14.1 dBFS |
| max | -11.1 dBFS |

and the loudest moment is a **sustained 100 ms** at 9.08–9.16s (inside 虽然野史中李白骑的白鹿牌
越野摩托早已停产), not a transient. Only 3.2 ms of the whole file sits above -13 dBFS, but that
material is real speech.

So the remaining 4.6 LU costs one of two things, both currently forbidden by the house rules
and both the operator's call:

1. **True-peak limiting**, ~4 dB of gain reduction on the loudest syllables. Standard practice
   for social delivery, inaudible at this depth, and it would end the "no limiting" claim that
   every manifest in this repo makes.
2. **A level ride** — slow per-phrase gain to even out a read whose own passages differ by
   13 dB. Not compression, and it is what an editor would do by hand, but it is a
   *performance* edit, which is exactly what E003 refused when its take drifted 1.5 LU.

Doing neither and shipping at -18.6 LUFS is also defensible: the platforms normalise upward as
well as down, and 4.6 LU is a much smaller gap than the 17 LU it started at.

### Pure splice — verified by residual this time, not by spectrum

No EQ, denoise, gate, compression, limiting, tempo or gain was applied. The proof used here
is stronger than the gated octave-band comparison used through E003.8, and it should replace
it going forward.

Each of the master's 30 speech runs was located in the raw take by FFT cross-correlation.
**Every one aligned to an exact integer-sample offset**, and the sample-by-sample difference
between master and source is a **flat -95.1 dBFS on all thirty of them** — the same number
whether the run is at -27.6 dBFS or -36.3 dBFS. Aggregate: signal 65.3 dB above the residual.

A constant residual that does not track the signal is quantization noise and nothing else.
Any filter would put the residual in a band; any gain would make it proportional; any tempo
change would break the integer alignment outright. This test can distinguish all three; a
spectral average cannot.

**The -95.1 dBFS floor is `auto-editor`'s own output stage: it writes `pcm_s16le`.** The
master's low byte is zero for all 2,499,199 samples — it is 16-bit content in a 24-bit
container. That has been true of every master this pipeline has cut (E003's two read zero
low-byte as well); the only 24-bit material in the repo is the room-tone inserts on E003.8,
which were cut straight with `cut_wav` and never went through `auto-editor` — exactly 47,806
non-zero low bytes in a 1.00s insert. This is not a defect at these levels, but the
`pcm_s24le` in `vo-process.sh` describes the container, not the resolution, and it should not
be read as a claim about the audio.

For the record, the old test on this cut reads **+0.12 dB mean / 0.48 dB tilt** across
125 Hz–8 kHz, with +0.52 dB at 8 kHz. That looks worse than E003.8's 0.13 dB and it is not:
the gated frame counts are 1249 (master) against 1266 (raw region), so seventeen low-level
frames near the gate fall on different sides of it and change what gets averaged. The
residual test has no such failure mode.

### Music bed — where it starts, and why it is delayed rather than seeked

`gunna-who-you-foolin.mp3`, sitting **8.5 dB under the measured voice** (the figure set on
E003), which works out to **-26.00 dB** of attenuation here.

The instruction was that the bed starts at the second script sentence — the Li Bai quote. In
the master that is **2.420s**, measured off the cut, not guessed.

This track needs the opposite mechanism from E003.8's. `riders-on-the-storm` entered 3.940s
into itself, so the bed had to be **seeked into** and started before the master did.
`who-you-foolin` enters at **0.326s** — 0.27s of quiet lead-in (-25 to -31 dB peak from
0.060s) and then a downbeat that jumps from -25 dB to -9.7 dB peak inside one 1 ms block. A
quarter of a second is less than the target, so the bed is **delayed** instead:

```
OFFSET = SENT2 - BED_ENTRY = 2.420 - 0.326 = +2.094s   -> adelay 2094ms, -ss 0
```

`vo-process.sh` computes both a seek and a delay from the same subtraction and only one of
them is ever non-zero, so the same three lines cover either kind of track.

Verified by rendering the bed alone and measuring it:

- **+22.3 dB step across 2.400 → 2.440s**, i.e. the downbeat lands on the first word of the
  quote to within the 20 ms measurement window
- the hook (0 → 2.420s) gets the bed at **-71.8 dBFS RMS, -50.9 dBFS peak** — inaudible, not
  merely quiet. The hook is dry, which is what was asked for on E003.8 and holds here
- review mix: **-31.5 LUFS, -14.4 dBFS true peak**

**No fade in.** There is nothing to fade — the bed enters on its own downbeat. The fade out
(1.5s, ending at the master's end) is not shaping either; the track does not end here and has
to be got off.

### What this bed does that riders-on-the-storm did not

Two things the picture edit should know about, neither of them fixable without editing the
bed, which was not asked for:

1. **It is less level.** 5s RMS runs -11.3 to -17.8 dB across the track's first 140s — a
   6.5 dB spread against riders' 3.5 dB. The dips at 20–25s and 30–35s of the track land at
   **22–27s and 32–37s of the master**, which is `what-i-learned` through
   `what-the-owner-said`. The bed backing off under the episode's thesis is arguably lucky,
   but it is the track doing it, not a duck.
2. **It is a clipped master** — true peak +0.8 dBFS, like show-me, magnolia and freek-a-leek,
   unlike riders (-3.2). 26 dB of attenuation means nothing clips in the review mix, but do
   not use this file at unity anywhere.

And one open question: **the filename carries no `-instrumental` marker**, which six of the
nine beds in `media/audio/` do. Four 25s windows spanning the whole track transcribe as
`[Music]` with no lyrics recovered, so it reads as an instrumental — but that is evidence,
not confirmation. It needs one listen. Same open question as `california-love.mp3` and
`playboi-carti-magnolia.mp3`, which have been waiting since E003.5.

### Not carried over from E003 / E003.8

- **No ducking.** E003 ducked the bed 10 dB under the barber exchange because there were two
  voices in it. There is one voice here and no exchange, so there is nothing to duck for.
- **No meme room.** E003.8 held a 1.00–1.22s hole open for a card in both locales. Nothing in
  this script asks for one, and the pacing has no room for a hole it does not need: the
  largest gap in the cut is 0.320s.
- **No graft.** The owner is talked *about* (结果老板告诉我), never quoted. If a field
  recording of him exists, grafting it into `what-the-owner-said` is the same move as the
  barber on E003 and would be worth doing — but it would need his release, and it is not in
  this cut.

## VO audio — take 1 en-US (VO_EN_027, v001)

| | |
|---|---|
| source | `DBX-APP-S03E004_en-US_vo-take1.m4a` — 83.86s, mono, 48 kHz AAC, -29.8 LUFS / -5.4 dBTP |
| master | `DBX-APP-S03E004_en-US_vo_v001.wav` — **51.93s**, -25.3 LUFS, -1.1 dBTP |
| settings | `--edit audio:threshold=-34dB --margin 0.06s,0.12s --smooth 0.10s,0.08s` |
| regions | one: `0.30 → 83.40` |
| bed | `chingy-right-thurr-instrumental.mp3`, **no lag** — downbeat on the master's first sample |
| delivery | one constant **+4.30 dB** |

### The sibling that isn't a translation

This is the episode that makes `agents.d/modules/localization.md` earn its keep. The zh-CN read is built
on a Li Bai couplet and a discontinued 白鹿 motorcycle; the en-US read is built on a childhood
empty field that somebody actually turned into a track. **Fifteen beats, same order, 0.13s
apart in total length, and not one shared line.** DECIDE 9 below asked whether E004 would ship
zh-CN only or get an en-US sibling written on a different spine; this is the second answer,
and the beat map came out 1:1 without forcing.

The beat ids still name the zh-CN devices, because ids are stable and they were fixed first.
Three of them read oddly against the en-US script and the manifest spells out what fills each
slot: `li-bai-quote` is the framing device, `white-deer-discontinued` is the payoff on that
frame, `li-bai-callback` is the closing callback. `owner-restocked-the-herd` is the one that
converges by itself — 又放了一群 and "No crops, no herds" are the same idea.

### Also a plain silence cut, and 38.1% dead air

One region, `0.30 → 83.40`, no grafts, no inserts, no pickups — same as zh-CN. Both bounds are
set by junk rather than taste: the head has the usual AAC lead-in (a 21 ms hole at sample
zero, a 43 ms hole at 0.149s, all under -44 dB, ending at 0.192s), and the tail has a -37 dB
blip at 83.82s followed by the encoder tail decaying to -138 dB.

83.86s → 51.93s. **The en-US read is the more spacious of the two** — 38.1% dead air against
zh-CN's 28.6% — and still finishes 0.13s shorter, because the read itself is quicker once the
pauses come out.

34 audible speech blocks, pauses median 0.226s, min 0.135s, max 0.490s.

### The thirty-third region: a mouth click that held the gate open

The master has **33 spliced regions, and only 32 of them are speech.** The odd one is a 0.23s
island of room tone from take 32.73–32.97s, kept because a 10 ms mouth click at take 32.81s
peaks at -32.1 dB and clears the -34 dB gate by 1.9 dB. In the master it lands at 21.91s at
-27.8 dB.

Whether that matters depends on where you listen:

* it is **27 dB under the loudest speech**, and it never opens a 15 ms gate, so the block
  detector does not even see it as speech;
* in the review mix the bed at that moment is at -23.0 dB peak, so it is **masked**;
* in the voice-only master it is faintly audible as a tick in a pause.

**It is left in, and the reason is not audio.** Removing it would also remove the 0.23s of
pause it sits in, taking the gap from **0.49s to 0.26s** — and that gap is the episode's turn,
between "…live the dream of my life peacefully" and "Turns out I also learned something…". It
is the longest pause in the cut by 0.12s and it is at the one place where a held pause is
doing work. Shortening the turn to lose a masked tick is an editorial trade, so it goes to the
operator rather than getting made here. See DECIDE 10.

The alternative fix — raising `THRESHOLD` above -32.1 dB — is not available: it is a house
constant unchanged since S03E002 v004, and moving it changes every episode's character to fix
one click.

### Fourteen dropouts, and the count is coming down

Same lossy-transfer signature as every take since E003.8: 14 zero-runs of 5–43 ms at 0.000,
0.149, 10.063, 10.101, 18.447, 18.453, 28.809, 28.826, 33.217, 33.376, 33.387, 33.530, 33.686
and 71.962s. All 14 sit in room tone at -44 to -89 dB, **none inside a word, none inside a
kept region** — the closest clears by 0.25s — and all 14 are removed by the cut. The master
contains no run of zero samples at all.

Running count across the batch: 10 → 16 → 19 (zh-CN, this episode) → 7 / 18 (E004.5) → 14.
Still not deterministic, still worth chasing (DECIDE 7).

### Pure splice, verified twice

The residual test: all 32 speech regions align to **integer sample offsets** in the take with a
residual of exactly **-95.1 dB** — auto-editor's 16-bit output floor and nothing else —
62.7 to 68.2 dB under signal, flat against a 5.5 dB signal range.

The scalar-fit test (adopted on E004.5, and it is the better instrument): fit the
least-squares gain that maps each region of the take onto the master.

```
32 regions:  min 4.3000   max 4.3001   spread 0.0001 dB
```

A single constant to a ten-thousandth of a decibel. That measures the delivery gain and rules
out anything frequency- or level-dependent in the same pass, because no such process could
leave a flat scalar behind.

**One methodology note worth keeping.** The recovery walker uses an ABSOLUTE residual
threshold (-85 dB), not one relative to signal. A correct alignment cancels to the dither floor
regardless of how quiet the passage is, so a relative test goes blind in room tone — and that
is exactly how a first pass at -60 dB missed the mouth-click island entirely and reported 32
regions instead of 33.

### The bed: right-thurr, and no lag

**The operator asked for the bed not to lag on this track, so it doesn't.** Everywhere else in
S03 the bed's downbeat is placed on the first word of the second script sentence and the hook
plays completely dry. Here `BED_AT = 0.000`: the downbeat lands on the master's **first
sample**, ahead of the first word, and the bed is seeked 0.383s into the file rather than
delayed into place. Nothing musical is skipped to get there — everything before 0.377s in
right-thurr is digital silence and dither. Verified by rendering the bed alone: first non-zero
sample at 0.0000s, at working level (-26.6 dB) by 0.002s.

The zh-CN sibling in the same episode still enters on the Li Bai quote at 2.420s. That is not
an oversight; it is now a per-locale setting (`BED_AT_en_US` / `BED_AT_zh_CN`), and this is the
first episode in S03 where the two locales use different beds *and* different placement.

**right-thurr is the best-behaved bed in the library.** -15.5 LUFS, true peak 0.0 dBTP with a
sample peak of -0.08 dBFS and **zero samples at digital full scale** — the only bed besides
riders-on-the-storm that is not a clipped master, and 6.9 LU quieter than disco-inferno. Its
5s RMS runs -15.5 to -17.1 dB across the whole 225s before the fade (a 1.6 dB spread; 0.9 dB
across the 52s used), with no breakdown anywhere. who-you-foolin under the zh-CN cut has
audible dips at 22–27s and 32–37s of the master; this one never backs off.

### Level, and 3.8 LU between the siblings

```
                     en-US                        zh-CN
master (mono)   -25.3 LUFS / -1.1 dBTP       -21.5 LUFS / -1.0 dBTP
_review.mp3     -22.6 LUFS / -1.3 dBTP       -18.8 LUFS / -1.3 dBTP
_review-mix.mp3 -22.4 LUFS / -1.3 dBTP       -18.6 LUFS / -1.3 dBTP
```

The delivery gain is derived the same way in both — `DELIVERY_TP(-1.0) − max(truepeak(voice),
truepeak(mix))` — and it comes out **+4.30 dB for en-US against +10.10 for zh-CN**.

**Almost the whole difference is one moment.** The en-US take's absolute peak is a 0.2 ms
transient at 77.986s — eight samples, inside "So track number four" — and it is the only thing
in the entire 83.86s recording above -6 dBFS. Blank half a second around it and the next peak
is 2.2 dB lower, which would put the master at -23.1 LUFS instead of -25.3. The remaining
1.6 LU is a genuinely wider read: peak-to-loudness 24.2 LU against zh-CN's 20.5.

So the en-US mix lands **3.8 LU under its sibling**, and there are exactly three ways to close
it, none of them free:

1. **Limit.** Ruled out by the no-processing rule, and it was ruled out again on 2026-08-31
   for the zh-CN master (DECIDE 1).
2. **Ride "So track number four" down by ~5 dB.** That is a level ride, also ruled out — and
   it would be riding down the counter line, which is the one phrase in the episode that is
   supposed to land hard.
3. **Re-read that line.** The only option that stays inside the rules, and it costs a pickup
   on an otherwise clean take.

Doing nothing is defensible: the platforms normalise each upload independently, so a viewer
watching one video never hears the gap. It only shows if the two ever sit in one timeline, or
if someone A/Bs them. Flagged as DECIDE 11.

## Relationship to the rest of S03

This is **track 4** and the counter moves: 所以这次第四条赛道找到了 / "So track number four:
secured." It follows E003's barber track directly; the two interstitials in between (E003.5,
E003.8) do not touch the count, and E004.5 publishes behind it without touching it either.

It is also **the first episode in S03 to ship both locales as genuinely separate authorship**.
E003 and E003.8 ran two locales, but those were the same story told twice; here the framing
device is different in each and neither could be produced from the other. If that works, it is
the model for the rest of the season — and it costs a second write, not a translation pass.

It is also the **longest master in S03 by 7.5s** — 52.07s against E003.8 zh-CN's 44.51s and
E003's 40.98s. That is the writing, not the edit. The cut has already taken 20.87s out and
every surviving gap is between 0.135s and 0.320s; there is no slack left to find. If it has
to come down it comes down in the script, and the obvious candidate is the technique section
(`the-jump-i-thought-i-knew` → `land-in-gear-and-go`), which is **16.9s — a third of the
episode** — for one instruction.

Against that: the technique *is* the episode. E001–E003 were about going somewhere; this is
the first one that comes back with something a viewer can use. Cutting it to hit a length
target would be cutting the reason to watch.

## DECIDE (human)

1. ~~**The last 4.6 LU.**~~ **DECIDED 2026-08-31: ship at -18.6 LUFS.** No limiting and no
   level ride — the no-limiting rule stands, and the platforms normalise upward as well as
   down. Also decided: the delivery stage is **E004 only for now**; E002.5 / E003 / E003.5 /
   E003.8 stay at their ~-31 LUFS masters and are not re-rendered. Revisit if a real export
   lands audibly quiet next to reference reels.
2. **The music licence.** `gunna-who-you-foolin.mp3` is a commercial recording with no
   licence on file, same as every bed in S03. Placeholder only.
3. **Is it actually an instrumental?** One listen settles it. Four files now need this:
   this one, `50-cent-disco-inferno.mp3`, `california-love.mp3`, `playboi-carti-magnolia.mp3`.
   `chingy-right-thurr-instrumental.mp3` is named as one by the operator and is not on the
   list.
4. **52 seconds.** Ship it long, or cut the technique section. See above — the recommendation
   is ship it long.
5. **The two uncertain line breaks** in `script.zh-CN.md` (the Li Bai quote read as three
   segments, 车友们来了就一起下场 read as two). Transcription is unreliable on Chinese; these
   need an ear before the subtitle pass, because they decide where the cards split.
6. **The owner's voice.** He is quoted in the third person throughout. If there is a field
   recording of him saying it, this episode wants it — with his release.
7. **The dropouts.** Nineteen in the zh-CN take, fourteen in the en-US one, against sixteen
   and ten before that and 7 / 18 on E004.5. Not deterministic. Find the transfer path.
8. **Niushou Mountain / 牛首山 on screen** — confirm the farm is happy to be named and
   locatable before it goes up. E003's track was named; this is the same question.
9. **The Li Bai frame does not cross.** There is no en-US variant and this script cannot
   become one by translation. Decide whether E004 ships zh-CN only, or whether an en-US
   sibling gets written with a different spine.
9. ~~**The Li Bai frame does not cross.**~~ **ANSWERED 2026-09-01: E004 gets an en-US sibling
   written on a different spine.** The take is in, cut, and mixed (VO_EN_027). No translation
   was involved and the fifteen beats mapped 1:1.
10. **The mouth click at 21.91s in the en-US master, and the 0.49s pause it lives in.** Leave
   both (current state), or split the region to drop the click and shorten the turn to 0.26s.
   This is an editorial call about the pause, not an audio call about the tick — the tick is
   masked in the mix either way.
11. **3.8 LU between the siblings.** Ship as-is (recommended — platforms normalise per upload),
   or re-read "So track number four" to recover ~2 dB of it. Limiting and level-riding are
   both out under the standing rules.
12. **The en-US bed placement.** No-lag was asked for on this track specifically. Decide
   whether it becomes the house rule or stays a per-track choice — right now `BED_AT` is
   per-locale and the two variants of this one episode disagree.
