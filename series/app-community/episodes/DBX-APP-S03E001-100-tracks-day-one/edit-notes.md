# Edit Notes — DBX-APP-S03E001

Track layout: V1 footage · V2 overlays · V3 spare · A1 voiceover · A2 music/SFX

Footage is not shot yet. This file currently carries the **VO audio** decisions only;
the assembly plan lands after the shoot.

## VO audio — takes 1 + 4 + snippet (VO_EN_010 / VO_EN_011)

Reproduce with `./vo-process.sh` (needs `ffmpeg`; auto-editor is not used here — see below).
One run writes both soundtracks, MP3 review copies, and a review mix of each under the bed.
All live in `media/**`, out of git.

**Take 4 is a rewrite, not a re-read.** The track is a real one (Huzhou), the
bow/beg/tear-up escalation and the girlfriend punchline are gone, and the episode now ends
on the rider who grew up on the track.

**The hook and first-step come from take 1.** Take 4 starts at `second-step`, but take 1
already delivers those two lines in take 4's wording ("…Thanks to my nerdy side"), so they
are concatenated in front rather than re-recorded. An earlier note in this file claimed the
wordings differed — that was wrong; only a leading "So" differs.

### Joining two takes

Take 1 was recorded ~5 dB quieter than take 4, so its pieces get a **linear gain of +5.00 dB**,
computed in the script from the two takes' integrated loudness rather than typed in. Verified
across the seam: the take-1 region measures **−26.2 LUFS** against the take-4 region's
**−26.1 LUFS**. (Individual phrases either side of the seam differ by ~3 dB, but that is
ordinary phrase-to-phrase variation, not a level step.)

This gain is the one exception to the no-processing rule on this episode, and it is
unavoidable: two takes at different levels cannot be concatenated without it. It is a plain
linear gain — no dynamics, no tone change.

### Policy: line-boundary cuts, plus phrase tightening

Each script line is one entry in `vo-process.sh` and may list several **sub-phrases**.
Sub-phrases join at **0.12s**, lines at **0.30s**. Offsets are absolute positions in the raw
takes, so editing one range never shifts another.

This differs from S03E000, where every pause inside a line survived untouched. Take 4 is a
slower read and that rule left audible dead air mid-line — at "(literally)", inside "every
jump, every line, he knows it by heart", before "That's what I'm talking about!", and after
"one day…". Splitting those lines into sub-phrases fixes all four at once.

The other half of the fix: **blips are excluded from the ranges.** Breaths and mouth clicks
sit 20+ dB under speech, and when a coarse detector folded them into a line's extent they
dragged an extra ~0.2s of near-silence onto the end of that line. Every range now ends on
real speech.

Measurement note: a threshold detector will report some line gaps as 0.4–0.5s. That is the
natural decay of the last syllable falling under the threshold, not inserted silence — the
inserted gaps are exactly 0.12s and 0.30s. Checked at "Turns out, this" (speech to 23.83 of a
23.89 range) and "…he knows it by heart" (30.93 of 30.96).

auto-editor is not used on this episode: its cut model cannot express per-phrase joins across
two source files.

### The snippet line

"Um hum. That's what I'm talking about!" comes from `vo-take4-snippet`, replacing take 4's
own read of that line, which was too loud for the moment.

Its range starts at **0.76**, not at the first energy in the file. The snippet opens with
~0.56s of breath sitting ~18 dB under the word, and including it put a 0.87s gap between
"…he knows it by heart" and the "um hum". Trimmed to the real onset, that gap is 0.31s.
Same failure mode as the blips elsewhere: a threshold detector calls faint breath "speech".

**It is used at its own level — deliberately not matched up.** The snippet sits ~3 dB under
the surrounding take-4 delivery (measured −26.7/−29.0 dB against −25.3 dB either side), and
that softness is the point. Take 1 gets a match gain because a level *step* mid-sentence is a
defect; this is a performance choice, so it stays.

### The track-dog beat

"…pay a visit to the track mascot —" and "the track dog!" are **separate line entries**, so a
0.30s beat lands before the reveal instead of the 0.12s a single line would give. Measured
0.34s in the master. Splitting the line is how any beat like this gets added — do not
special-case a gap in the builder.

### The drumroll — spoken line only

"Which apparently means *(drums rolling…)* Huzhou" was delivered as two things back to back:
the vocalised roll (8.37–9.12) and the words "drum rolling" (10.43–11.18), both 0.75s.

**Only the spoken line is used.** The vocalised roll is dropped — an earlier cut layered the
two on top of each other, which worked technically but is not what the episode wants. If a
real drumroll SFX is added later it goes on A2 under this line, not into the VO master.

### Level

No dynamics anywhere. The master sits at take 4's own **−26.2 LUFS / −6.3 dBFS**; take 1 is
brought up to meet it. Loudness remains a video-mix decision, not a VO-asset one.

### Music bed

`MUS_001` (Freek-A-Leek instrumental), flat, **no ducking** — the one thing the script sets.
Placed **`MUSIC_BELOW_VO` dB under the measured voice loudness** (currently 7, matching
S03E000) rather than at a fixed volume, so the balance holds across both soundtracks.
0.5s fade in, 1.5s out; `amix=normalize=0` (the default would halve both inputs).

To check a bed change, measure inside a verified voice gap — the mix's integrated LUFS
barely moves when the bed does, because the voice dominates it.

### DECIDE (human)

- **MUS_001 is not licensed.** Commercial instrumental, fine for judging the cut, not for
  publishing. Same status as the beds on S03E000 and S03E002.
- The `(Kid standing behind grown up)` note in the script is a visual direction, not a line —
  it has no VO and no beat of its own; it plays under `the-guy`.
- Beat durations follow VO_EN_010, are all measured, and are provisional until the
  subtitle pass.
- If a real drumroll SFX is wanted under "(drums rolling…)", it belongs on A2.

## Subtitle notes

Not started. Two passes needed: the bodies are identical, but the two cuts open differently,
so cues diverge by ~1.0s after the hook. Time each against its own master
(VO_EN_010 / VO_EN_011).

## Retention checklist

Fill after assembly, before any review export.
