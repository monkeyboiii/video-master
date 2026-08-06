# Edit Notes — DBX-APP-S03E000

Track layout: V1 footage · V2 overlays · V3 spare · A1 voiceover · A2 music/SFX

Footage is not shot yet. This file currently carries the **VO audio** decisions only;
the assembly plan lands after the shoot.

## VO audio — take 1 (VO_EN_001 / VO_EN_002)

Reproduce with `./vo-process.sh` (needs `auto-editor` on PATH and `ffmpeg`). One run writes
both soundtracks, their MP3 review copies, and a review mix of each under the bed — all into
`media/**`, out of git.

### Policy: line-boundary cuts only

**Silence is trimmed only where the script starts a new line. Every pause inside a line is
kept exactly as delivered.** That is the opposite of S03E001/E002, which use `--edit audio`
to flatten in-sentence pauses as well — so this episode uses auto-editor's **manual ranges**
(`--edit 1 --cut A,B --cut C,D …`) instead. An automatic threshold cannot tell a line break
from a mid-sentence breath; only the script can.

Consequence worth seeing before judging the cut: the hook line is one sentence in the script,
and it was delivered with **0.67s and 1.98s pauses inside it**. Both survive, by design. If
the hook feels slow, that is the rule working as specified — the fix is a script change
(break the line) or a re-read, not a threshold.

Beyond the cuts: no EQ, denoise, gate, compression, limiting, tempo or gain. Level stays the
take's own. The only level set anywhere is the music bed's. Same policy as the rest of S03.

### The two soundtracks

| | VO_EN_001 | VO_EN_002 |
|---|---|---|
| Opens with | English hook | Chinese hook |
| Body | identical English body | identical English body |
| Duration | **32.33s** | **29.80s** |
| Integrated | −29.5 LUFS | −29.4 LUFS |
| True peak | −8.7 dBFS | −8.7 dBFS |

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
| L1→L2 | 1.42s | L7→L8 | 0.31s (already at target) |
| L2→L3 | 0.92s | L8→L9 | 1.16s |
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
sets. Placed **`MUSIC_BELOW_VO` dB under the measured voice loudness** (currently 10) rather
than at a fixed volume, so the balance holds across both soundtracks despite their different
lengths and levels. 0.5s fade in, 1.5s out; `amix=normalize=0` (the default would halve both
inputs).

The track is 193s against ~32s of voice, so the bed uses only its opening — check that the
section under the hook is the part you want, and offset the music start if not.

### DECIDE (human)

- **MUS_001 is not licensed.** Commercial instrumental, fine for judging the cut, not for
  publishing. Swap for a cleared track before any export leaves review. Same status as the
  beds on S03E001 and S03E002.
- **The 1.98s pause inside the hook line.** Kept per the line-boundary rule. If it should go,
  split the hook into two lines in `script.en-US.md` and re-derive that boundary — don't
  special-case it in the cut list.
- Both takes were captured at ≈ −29.5 LUFS in a live room; under the no-processing policy
  that character ships as-is.
- Beat durations in `manifest.yml` follow VO_EN_001. The `hook` beat is 6.19s shorter on the
  Chinese cut — if that variant gets its own timeline, its hook beat is 2.53s, not 8.72s.

## Subtitle notes

Not started, and this episode needs **two** subtitle passes — the bodies are identical but
every cue after the hook is offset by 2.53s between the two soundtracks. Time each against
its own master.

## Retention checklist

Fill after assembly, before any review export.
