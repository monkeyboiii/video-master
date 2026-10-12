# Edit notes — S07E001

What this repo did, measured. `audio/render.sh` is the whole audio run; the JSONs in `audio/` are
that run's recorded decisions. Inputs and outputs are gitignored (media/S07E001/).

## Voice

- **Stand-in take.** Every line synthesised (`audio/tts_take.py`, lines in `audio/lines.tsv`):
  Kokoro `zm_yunxi` at 1.15 for zh, `am_michael` at 1.1 for the three English lines — a voice
  picked here, not by the operator. Four readings misaki gets wrong were fixed at the phoneme level:
  死拽 zhuài (not zhuāi), 得用 děi (not dé), 一两根 and 下一集 yì (sandhi). 刹 shā, 翘 qiào,
  颠簸 bǒ, 髋 kuān, 夹 jiā were checked and are right. 3个 is said as 三个.
- **Cut.** auto-editor `--edit audio:-35dB --margin 0.08s,0.09s` — the take is -24.9 LUFS, ~5 dB hotter
  than S05E003's -29.8 LUFS phone take cut at -40 dB, so the threshold moves with it. It removed the
  between-line silence and trimmed seven comma pauses by 60-100 ms each. Speech above -35 dB:
  30.63s before, 30.60s after. Pieces rebuilt with 8ms fades (`audio/lines_cut.py`).

## Placement on the bed

Highway To Hell (instrumental), measured by `audio/bgm-grid.py`: **115 BPM**, bar 2.087s. Intro riff
alone 0.45-8.79s (4 bars), drums from 8.79s, a build at bar 23 (48.45s), the chorus lift at bar 24
(**50.53s**, ~3 dB up), a cymbal drop at 69.31s. `audio/place.py` puts the lines on that grid:

- the hook **after** the first chord rings out — beat 3 of bar 0 (1.49s), where the guitar has
  decayed to -45 dB. The intro is call-and-response: chord 0.30-1.25s, silence to 2.4s, chord 2.40-3.40s,
  silence to 4.6s. v1 started the hook on the first chord and the operator heard them collide; the
  second chord still sits under the hook, the first plays alone;
- 第一步 on bar 3 (6.71s), 骑电驴的时候 on the drum entry (8.80s);
- 第二步 on a bar downbeat, 第三步 on a kick beat; the English lines on beats;
- 等下，这姿势真的对吗？ on the build bar's downbeat, then a 0.8s pause, and the call-to-action on the
  chorus downbeat — the follow ask rides the biggest lift in the song;
- 0.30s speech-to-speech inside a section. Voice ends 52.96s; the bed fades across bar 26 (to 56.79s).

## Bed

`audio/mix_flat.py`: **one static level, no ducking** — v1 ducked 11.5 dB under speech and swelled
in the long pauses, and the operator found it weird. The level is `audio/flat-level.py`'s answer to a
measured question: the single gain that still gives S05E003's approved consonant clarity (1-4 kHz
voice-over-music, 12.4 dB median, -6.9 dB 10th percentile, ≤20.1% of frames under 0) over all speech —
**-23.51 dB** on the file, the bed ~11 LU under the voice. The riff sits in the consonant band, which
is why it is that low: at the voice's own loudness the median was 1.3 dB.

What a flat bed costs, measured on the delivered mix: the opening chords alone play at **-30.6 LUFS**
against a -14.4 LUFS programme, and the call-to-action — on the chorus, ~3 dB hotter than the verse —
gets a 7.4 dB median instead of 12.8. A +4 dB bed (`-louderbed`, -19.51 dB) lifts the chords to
-26.5 LUFS and drops clarity to 8.8 dB overall, 3.4 dB at the call-to-action with 36% of its frames
under 0 — the masking the operator asked to have ducked on S05E003. DECIDE: which bed ships.

## Captions

zh word timing is **MFA** on the delivered voice stem (`captions/script.mfa.txt`, spoken forms —
三个 shows as 3个). The English lines are OOV placeholders there; their words come from Kokoro's own
token timestamps, mapped through the cut. MFA's sentence edges sit 7-69 ms ahead of the energy-measured
onsets; 髋 is OOV and its word got a plausible 260 ms. English words carry a no-break space, because
the zh layout has no word gap and an ordinary trailing space collapses. Text is pure white #FFFFFF.
All 17 lines appear on their computed frame in the render. v2 re-ran MFA on the new stem: the hook's
words moved +1.04-1.05s (placement moved it +1.038s), every other word 0-10 ms.

## When the take arrives

The same steps with the take in place of `tts_take.py`: cut it with auto-editor at a threshold matched
to ITS level, split it into the 17 lines, rerun `place.py` with the same anchors, then MFA on the new
stem and `captions/build_props.py`. The English lines then need MFA-independent timing again (or a
hand check), since Kokoro will no longer know them.

## QC

v2 (flat bed): mix -14.41 LUFS / -1.41 dBTP, 56.79s; 0.105% of samples limited. Consonant band in
the delivered mix: 12.8 dB median, 16.6% under 0. Splice clicks at a silent edge: 0 (the voice
pieces are v1's, only re-placed). whisper reads every zh line in order over the flat bed — in two
halves: whole-file, it dropped its first 30s window, which starts on solo guitar, while it read the
louder bed from the top. The louder bed's transcript drops 手肘抬高 and garbles more (撕载 for 死拽).
