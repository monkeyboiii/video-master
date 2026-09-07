# Edit Notes — S04E001

Track layout: V1 footage · V2 overlays · V3 spare · A1 voiceover · A2 music/SFX

Footage is not shot yet. This file currently carries the **VO audio** decisions only;
the assembly plan lands after the shoot.

## VO audio — take 1 en-US + take 1 zh-CN (VO_EN_020 / VO_ZH_001)

Reproduce with `./vo-process.sh` (needs `auto-editor` on PATH and `ffmpeg`). One run writes
both masters, their MP3 review copies, and a review mix of each under the bed — all into
`media/**`, out of git.

### Two soundtracks, not one with a swapped hook

E000 and E002 shipped a single English soundtrack with a Chinese hook spliced over the
front. This episode is the first in S03 with a **complete, separately authored zh-CN read**.
The two are processed identically but are never mixed with each other, and each bed gain is
computed from its own voice level — the zh take is 2.6 LU quieter than the en.

They are also **not the same content**; see "The clause that isn't in the zh read" below.

### Policy: pure splice

Same rule as S03E001/E002/E003: **dead air is cut and nothing else is touched.**

```
--edit audio:threshold=-34dB --margin 0.06s,0.12s --smooth 0.10s,0.08s
```

Unchanged since E002 v004. No EQ, denoise, gate, compression, limiting, tempo or gain —
one take per locale, so there is nothing to match.

**Verified, not asserted.** Gated octave-band spectrum of each master against its raw take
(gate 0.02 ≈ −34 dBFS, so only speech frames are averaged):

| Band | 125 | 250 | 500 | 1k | 2k | 4k | 8k | mean | tilt |
|------|----:|----:|----:|---:|---:|---:|---:|-----:|-----:|
| en-US | +0.00 | +0.04 | −0.01 | +0.02 | +0.01 | +0.05 | +0.06 | **+0.02** | 0.07 |
| zh-CN | −0.05 | −0.04 | −0.05 | −0.04 | −0.03 | −0.04 | −0.06 | **−0.04** | 0.03 |

### Regions

| Locale | Source | In | Out | Why not the whole file |
|--------|--------|---:|----:|------------------------|
| en-US | take 1 | 0.60 | 35.20 | drops a −33.3 dB handling noise at 35.45s, after the last word |
| zh-CN | take 1 | 0.60 | 30.81 | nothing to step over — full read |

The en-US take ends with an 0.08s burst 0.54s after the final word: the recording being
stopped, not speech. Cutting the region short of it is enough; no split was needed. The
zh-CN take scanned clean — no isolated sub-150 ms bursts sitting alone in long pauses.

Third consecutive episode where the take needed a boundary check before a range was
written. **Do it every time**: profile at 5 ms and look for short loud runs alone inside
long pauses, and check the head and tail specifically.

### Pacing

| | speech runs | gaps | median | p90 | max |
|-|------------:|-----:|-------:|----:|----:|
| en-US | 12 | 11 | 0.200s | 0.210s | 0.210s |
| zh-CN | 9 | 8 | 0.195s | 0.210s | 0.210s |

Both are as uniform as the house settings get — max equals p90 in each. Nothing was
flattened that carried meaning; the delivered pauses in both reads were all sentence-sized.

### Length against the brief

The scripts are written to **19s** in five blocks. Delivered and cut:

| | target | actual | over |
|-|-------:|-------:|-----:|
| en-US | 19.00s | **20.53s** | +1.53s |
| zh-CN | 19.00s | **21.37s** | +2.37s |

Both are comfortably inside every platform limit, so nothing is at risk — but the beat
targets in `manifest.yml` are the shooting plan, and they are the measured numbers, not the
written ones. The zh `your-turn` beat is the widest divergence: **5.59s against the en's
3.49s** for the same CTA, because the delivered Chinese lines are longer than the written
ones. Cut the picture to the locale, not to a shared timeline.

### The clause that isn't in the zh read

The en-US `on-the-map` beat credits the rider — "with him as the uploader". **The zh-CN take
has no equivalent clause.** It goes straight from 现在他的路线直接挂在地图上 to the
100-track line. This is not an ASR gap: the delivered zh script itself has a dangling
"，——" at exactly that position, and the transcription confirms the audio matches.

Since crediting the rider is the point of the episode, the two variants currently make
different promises. **DECIDE (human)** — re-record the line, carry it in the zh subtitle or
an overlay, or accept the difference deliberately.

### Level

| | integrated | peak | duration |
|-|-----------:|-----:|---------:|
| en-US | −29.9 LUFS | −7.2 dBFS | 20.53s |
| zh-CN | −32.5 LUFS | −11.7 dBFS | 21.37s |

Each is its own take's level; no normalisation was applied and the 2.6 LU difference is the
recording. Delivery loudness is set at export QC (−14 LUFS target, `skills/08`), not here.

### Music bed — review mix only

`california-love.mp3` (291.92s, −10.8 LUFS, uniform ~−13.5 dB RMS from the top — no intro
build to place, so `MUSIC_START` stays at 0), sat **8.5 dB under the measured voice** — the
level now shared with E003 — computed per locale: **−27.60 dB** on the en mix, **−30.20 dB**
on the zh. 0.5s fade in, 1.5s fade out at the tail. `MUSIC_BELOW_VO` is the one knob.

Verified by isolating each bed stem (mix minus the dry VO) and measuring it: **−39.3 LUFS
against the en voice's −29.9** and **−41.9 against the zh's −32.5** — 9.4 dB under in both
cases. The 0.9 dB over nominal is the fades: 2s of ramp against a ~21s piece is a tenth of
the runtime, so it pulls the integrated bed down more here than on the 44s E003 cut. Speech
lifts +0.5 to +0.6 dB; mixes peak −7.5 dBFS (en) and −12.6 dBFS (zh), no clipping.

**Unverified: is this file the instrumental?** Every other bed in `media/audio/` carries an
`-instrumental` marker in its name; this one doesn't. Two sampled windows (20–65s and
45–95s) transcribe as `[Music]` with no lyrics recovered, which points to an instrumental
but is not proof — a transcriber failing on a 120 kbps rap mix looks the same. **Confirm by
ear before this leaves review.** A vocal bed under a voiceover is unusable at any level.

**Licence: NOT CLEARED.** Commercial recording, placeholder for review only — the same
standing problem as E001's freek-a-leek, E002's 50 Cent and E003's Usher instrumentals.

### Not carried over

No SFX: none was supplied and neither read asks for one.

## DECIDE (human)

1. **The uploader credit missing from the zh-CN read** — the one substantive item above.
2. Is `california-love.mp3` the instrumental? Confirm by ear.
3. Music licence, unchanged across all of S03.

## Episode ID

Filed as **S04E001**. The ID format had no fractional form, so one was added:
`RE.videoId` in `tools/lib.mjs` now accepts `E###.#`, video IDs are regex-escaped before
being interpolated into the derived filename patterns (the dot would otherwise match any
character), and `agents.d/modules/naming-conventions.md` documents the interstitial rule. E003 keeps
its number — `new-episode.mjs` skips decimal IDs when picking the next one, so an
interstitial never shifts the sequence.
