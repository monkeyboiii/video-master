# Edit Notes — DBX-APP-S03E001

Track layout: V1 footage · V2 overlays · V3 spare · A1 voiceover · A2 music/SFX

Footage is not shot yet. This file currently carries the **VO audio** decisions only;
the assembly plan lands after the shoot.

## VO audio — take 4 (VO_EN_004 / VO_EN_005)

Reproduce with `./vo-process.sh` (needs `ffmpeg`; auto-editor is not used here — see below).
One run writes both soundtracks, MP3 review copies, and a review mix of each under the bed.
All live in `media/**`, out of git.

**Take 4 is a rewrite, not a re-read.** The track is a real one (Huzhou), the
bow/beg/tear-up escalation and the girlfriend punchline are gone, and the episode now ends
on the rider who grew up on the track. Takes 1–3 and their masters are superseded and
deleted; do not splice them in, the wording differs throughout.

### ⚠️ Recording gap

`vo-take4-enfull` **starts at `second-step`**. The `hook` and `first-step` lines are in
`script.en-US.md` but were never recorded, so:

- **VO_EN_004** (English) opens cold on "Second step,…" — no hook.
- **VO_EN_005** opens on the recorded Chinese hook, and is currently the only cut with a hook.

Either record the two missing lines as a pickup in take 4's wording, or commit to opening on
the Chinese hook and cut the English one from the script. Their beat durations in
`manifest.yml` are estimates; the other six are measured.

### Policy: line-boundary cuts only

**Every script line is kept whole with 0.15s either side**, so consecutive lines land 0.30s
apart and pauses *inside* a line survive as delivered. Same rule as S03E000, different
mechanism: offsets here are absolute positions in the raw take and each line is extracted as
its own piece, so editing one range never shifts another. auto-editor is not used on this
episode because the drumroll needs two pieces layered, which its cut model cannot express.

### The drumroll — mixed, not sequential

"Which apparently means *(drums rolling…)* Huzhou" was delivered as two separate things back
to back:

```
 5.54- 6.62   "Which apparently means..."
 8.37- 9.12   [the drumroll sound]      0.75s
10.43-11.18   "drum rolling"  (spoken)  0.75s
12.89-13.44   "Huzhou"
```

The two 0.75s pieces are **overlaid onto each other** (`mix` in `EN_LINES`), so the words land
*while* the drumroll plays instead of after it. They are exactly the same length, so they
align without stretching anything.

Verified rather than assumed: the output piece correlates with both sources (r = +0.68 against
the drumroll alone, +0.76 against the speech alone) and differs from their exact sum by
**−137.9 dB** — a sample-accurate overlay. Summing two speech pieces adds ~3 dB; the result
peaks at **−11.8 dBFS**, so there is no clipping and no limiter was needed.

If the balance wants adjusting, add a `volume` to either leg of the `amix` in `vo-process.sh`
rather than re-recording.

### Level

None applied. The master sits at the take's own **−26.2 LUFS / −6.3 dBFS** — take 4 was
recorded ~4 dB hotter than takes 1–3, which is an improvement. Loudness remains a video-mix
decision, not a VO-asset one.

### Music bed

`MUS_001` (Freek-A-Leek instrumental), flat, **no ducking** — the one thing the script sets.
Placed **`MUSIC_BELOW_VO` dB under the measured voice loudness** (currently 7, matching
S03E000) rather than at a fixed volume, so the balance holds across both soundtracks.
0.5s fade in, 1.5s out; `amix=normalize=0` (the default would halve both inputs).

To check a bed change, measure inside a verified voice gap — the mix's integrated LUFS
barely moves when the bed does, because the voice dominates it.

### DECIDE (human)

- **The recording gap above is the blocking one.** Everything else is finished.
- **MUS_001 is not licensed.** Commercial instrumental, fine for judging the cut, not for
  publishing. Same status as the beds on S03E000 and S03E002.
- The `(Kid standing behind grown up)` note in the script is a visual direction, not a line —
  it has no VO and no beat of its own; it plays under `the-guy`.
- Beat durations follow VO_EN_004 and are provisional; lock them at the subtitle pass.

## Subtitle notes

Not started. Two passes needed: the bodies are identical, but VO_EN_005 carries the Chinese
hook in front, so every English cue sits 4.89s later on that cut. Time each against its own
master.

## Retention checklist

Fill after assembly, before any review export.
