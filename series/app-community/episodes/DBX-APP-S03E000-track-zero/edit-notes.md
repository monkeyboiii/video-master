# Edit Notes — DBX-APP-S03E000

Track layout: V1 footage · V2 overlays · V3 spare · A1 voiceover · A2 music/SFX

Footage is not shot yet. This file currently carries the **VO audio** decisions only;
the assembly plan lands after the shoot.

## VO audio — take 1 (VO_EN_007 / VO_EN_008)

Reproduce with `./vo-process.sh` (needs `auto-editor` on PATH and `ffmpeg`). One run writes
both soundtracks, their MP3 review copies, and a review mix of each under the bed — all into
`media/**`, out of git.

### Policy: line-boundary cuts only

**Silence is trimmed only where the script starts a new line. Every pause inside a line is
kept exactly as delivered.** That is the opposite of S03E001/E002, which use `--edit audio`
to flatten in-sentence pauses as well — so this episode uses auto-editor's **manual ranges**
(`--edit 1 --cut A,B --cut C,D …`) instead. An automatic threshold cannot tell a line break
from a mid-sentence breath; only the script can.

This rule has teeth, and the hook proved it twice. As one script line it was delivered with
**0.67s and 1.98s pauses inside it**, and the rule preserved both — which made it drag. **Both
fixes were script changes, not special cases:** the hook is now **three lines** in
`script.en-US.md`, broken after "…dirt-bike track —" and after "…to the rest of the world,",
so each pause is a real boundary and trims to ~0.31s.

Keep doing it this way. If another pause needs to go, split the line; do not hand-add a range
that no line break justifies, or the cut list stops being derivable from the script.

### The one exception: `15.00,15.14`

There is exactly one cut that no line break justifies, and it is marked as such in the script.
"…at least somebody's gotta do something about it" was delivered with the final **"it" 15 dB
below the rest of the line** — a 0.06s burst at −46 dB against a −54 dB floor. Measured:

```
"...about"   ends 14.92
             0.28s silence
"it"         15.18-15.26   -46 dB  (speech elsewhere is ~-31 dB)
             0.88s silence  -> trimmed to 0.28s by the line boundary
"Why not"    16.16
```

So the line ends with ~0.6s of near-silence wrapped around a word most listeners will not
hear — and in the review mix the bed sits **above** it. This is a hesitation inside a word
group, not a rhetorical pause, and splitting "…about" / "it" into separate script lines would
be nonsense. It is cut as a documented exception instead: 0.14s removed before the "it",
leaving the word intact.

**Still open:** dropping that "it" entirely would close the whole thing to a clean 0.26s.
That deletes a word from the delivered line, so it is the author's call, not the editor's —
change `15.00sec,15.14sec` to `15.00sec,16.00sec` in both `EN_CUTS` and `BODY_CUTS` if wanted.

Beyond the cuts: no EQ, denoise, gate, compression, limiting, tempo or gain. Level stays the
take's own. The only level set anywhere is the music bed's. Same policy as the rest of S03.

### The two soundtracks

| | VO_EN_007 | VO_EN_008 |
|---|---|---|
| Opens with | English hook | Chinese hook |
| Body | identical English body | identical English body |
| Duration | **30.17s** | **29.67s** |
| Integrated | −29.4 LUFS | −29.4 LUFS |
| True peak | −8.7 dBFS | −8.7 dBFS |

The hook edits do not touch VO_EN_006 — the English hook is dropped from that cut entirely.
The **bodies are identical** (23.63s vs 23.62s measured); only the hook beat differs,
**6.67s English vs 6.18s Chinese**, so every body cue sits **0.49s earlier** on the Chinese
cut. (Earlier revisions of this file quoted 2.53s and 0.86s for that offset; both were wrong
— the figure is measured by comparing where the body starts in each master.)

The Chinese cut is built by re-splicing the same English take with the hook line dropped
(`BODY_CUTS`) and concatenating it after the spliced Chinese take. **No silence is inserted
at the join** — the hook already carries 0.30s of trail and the body 0.15s of lead, which
lands the language switch at 0.51s. Inserting a further 0.30s pushed it to 0.80s, which
dragged.

### Boundary table

Derived by aligning a whisper transcript (`auto-editor whisper <file> <model> --split-words`)
to the script's lines, then snapping each boundary to the real silence edges either side.
Whisper's own word boundaries snap to neighbouring words and are ~0.2s loose — good enough to
*identify* a line break, never to cut on. Every boundary is trimmed to **0.30s**.

| Boundary | raw gap | Boundary | raw gap |
|---|---|---|---|
| lead-in | 1.16s | L6→L7 | 1.47s |
| **hook break 1** | **0.67s** | L7→L8 | 0.31s (already at target) |
| **hook break 2** | **1.98s** | | |
| L1→L2 | 1.42s | | |
| L2→L3 | 0.92s | L8→L9 | 1.16s |
| *(hesitation 15.00–15.14, not a line break)* | 0.28s | | |
| L3→L4 | 0.65s | L9→L10 | 0.44s |
| L4→L5 | 0.42s | L10→L11 | 0.32s (already at target) |
| L5→L6 | 0.48s | L11→L12 | 1.47s |

Chinese take: lead-in 1.96s, one boundary at 1.27s, then 4.5s of trailing room tone with a
few sub-0.15s blips that the trail cut removes. 13.12s → 6.02s.

**These ranges are absolute offsets into the raw takes.** Re-derive them if a take is
re-recorded — there is no automatic fallback.

### Gotcha

The concat demuxer needs byte-identical stream parameters. auto-editor emits `pcm_s16le`
while a freshly generated silence file defaults elsewhere; mixing them produces a stream of
`Invalid PCM packet` decode errors and an unreliable join. Every piece is normalised to
48 kHz / mono / `pcm_s24le` before concatenation.

### Music bed

`MUS_001` (Praise The Lord instrumental), flat, **no ducking** — the one thing the script
sets. Placed **`MUSIC_BELOW_VO` dB under the measured voice loudness** (currently 7) rather
than at a fixed volume, so the balance holds across both soundtracks despite their different
lengths and levels. 0.5s fade in, 1.5s out; `amix=normalize=0` (the default would halve both
inputs).

The track is 193s against ~30s of voice, so the bed uses only its opening — check that the
section under the hook is the part you want, and offset the music start if not.

**Measuring a bed change:** integrated LUFS of the mix barely moves when the bed does — the
voice dominates it. Measure inside a true voice gap instead, and confirm the window really is
silent in the voice master first. Going 10 dB → 7 dB reads as +2.3 dB in-gap (nominal 3 dB,
compressed slightly by the take's own room tone sharing the window).

### DECIDE (human)

- **MUS_001 is not licensed.** Commercial instrumental, fine for judging the cut, not for
  publishing. Swap for a cleared track before any export leaves review. Same status as the
  beds on S03E001 and S03E002.
- Both takes were captured at ≈ −29.5 LUFS in a live room; under the no-processing policy
  that character ships as-is.
- Beat durations in `manifest.yml` follow VO_EN_007. If the Chinese cut gets its own
  timeline, only the `hook` beat changes: 6.18s instead of 6.67s.

## Subtitle notes

Not started, and this episode needs **two** subtitle passes — the bodies are identical but
every body cue sits 0.49s earlier on the Chinese cut. Time each against its own master
(VO_EN_007 / VO_EN_008).

## Retention checklist

Fill after assembly, before any review export.
