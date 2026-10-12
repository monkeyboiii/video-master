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

- the hook on the first chord (0.45s), then the riff alone for ~2.2s;
- 第一步 on bar 3 (6.71s), 骑电驴的时候 on the drum entry (8.80s);
- 第二步 on a bar downbeat, 第三步 on a kick beat; the English lines on beats;
- 等下，这姿势真的对吗？ on the build bar's downbeat, then a 0.8s pause, and the call-to-action on the
  chorus downbeat — the follow ask rides the biggest lift in the song;
- 0.30s speech-to-speech inside a section. Voice ends 52.96s; the bed fades across bar 26 (to 56.79s).

## Bed

`audio/mix_s07.py`. The bed alone sits at the voice's loudness (-12.32 dB on the file: voice -24.83,
music 0-56s -12.51 LUFS) and is **ducked 11.5 dB** under speech. Measured, not picked: the riff sits
in the consonant band, and undocked the voice's 1-4 kHz lead was a 1.3 dB median with 45% of frames
under 0 dB; 11.07 dB is the smallest duck matching S05E003's approved pre-guitar figures (12.4 dB
median, -6.9 dB 10th percentile, 20.1% under 0). The music comes back only for pauses ≥1.5s — the
riff after the hook and the outro — so shorter gaps do not pump. Lift: static gain + `alimiter`.

## Captions

zh word timing is **MFA** on the delivered voice stem (`captions/script.mfa.txt`, spoken forms —
三个 shows as 3个). The English lines are OOV placeholders there; their words come from Kokoro's own
token timestamps, mapped through the cut. MFA's sentence edges sit 7-69 ms ahead of the energy-measured
onsets; 髋 is OOV and its word got a plausible 260 ms. English words carry a no-break space, because
the zh layout has no word gap and an ordinary trailing space collapses. Text is pure white #FFFFFF.
All 17 lines appear on their computed frame in the render.

## When the take arrives

The same steps with the take in place of `tts_take.py`: cut it with auto-editor at a threshold matched
to ITS level, split it into the 17 lines, rerun `place.py` with the same anchors, then MFA on the new
stem and `captions/build_props.py`. The English lines then need MFA-independent timing again (or a
hand check), since Kokoro will no longer know them.

## QC

Mix -14.47 LUFS / -1.41 dBTP, 56.79s; 0.14% of samples limited. Splice clicks at a silent edge: 0.
Consonant band in the mix: 13.1 dB median, 15.3% under 0. whisper reads every zh line in order over
the music, and the English lines in en mode.
