# Edit notes — S05E003

What this repo did to the material, measured. Inputs are gitignored (`audio/render.sh` names them);
everything that decides an output is here.

## Voice

- **Take.** The operator's phone take (-29.77 LUFS, 50.18s). It already contains 26年…还有谁, so only
  the first sentence is TTS: Kokoro `zm_yunxi` at 1.15, 这就是四九年入国军吗？. huiyi's line is
  `zf_xiaoxiao` at 1.15, 你想干嘛？, gain-matched to the take (-5.01 dB).
- **Cut.** auto-editor `--edit audio:-40dB --margin 0.08s,0.09s`, the threshold matched to the take's
  level as /auto-editor's S05E002 lesson says. Its decision is `audio/cut-segments.json`; the pieces
  are rebuilt with 8ms fades, never butted raw. The 0.08/0.09 margins are the operator's "relax the
  gaps a few frames".
- **EQ** (`audio/eq-chain.txt`), for "my audio is a bit unclear": 4 kHz -6.3 → -2.5 dB and 10 kHz
  -17.8 → -11.9 dB against the TTS voice, noise floor down ~4 dB. ASR CER is unchanged at 8.5%, so the
  gain is tonal; the operator kept the EQ'd voice. 场地越野摩托 reads as 场地远摩托 to whisper in the
  RAW take too — it is the articulation, not the mix.
- **Placement** (`audio/build-voice.py`), against TNT's measured landmarks — the guitar riff enters
  out of the intro's break at 7.89s (spectral-flux peak 7.90, break 7.62-7.86):
  - the TTS line starts at 0.534s, clear of the opening bang's attack (~0.2s);
  - 还有谁 → 我入手了一台 is 1.00s (operator's pick from the v5 gap variants, 0.25-1.39s);
  - 场地越野摩托 ends at 7.644s, so the guitar plays alone — on the beat it masked the words. Fitting
    that needed the whole voice 0.25s earlier against the music than v5;
  - 居然 starts at 8.50s, in the dip after the guitar's first gesture (7.89-8.47);
  - 你想干嘛 sits 1.00s after voilà (gap 1.17s), room for the video cut before it.
  A 1s gap after 不过还得是这个声音啊 for engine sound was tried (v8) and reverted by the operator.

## Bed

`audio/mix-bed.py`: TNT at -14 dB, full through the guitar's first gesture, then **ducked 7.5 dB**
from 8.47s to the end of 你想干嘛, back up over 0.3s for the cutaway and a 1.5s fade. Why ducking at
all: after the guitar enters, the riff carries +7.7 dB more energy in 1-4 kHz than the intro did,
and the voice's consonant-band lead fell from a 12.4 dB median to 5.1. The smallest broadband duck
restoring the pre-guitar figures (median, 10th percentile, share of frames under 0 dB) is 7.27 dB.
Measured on L+R: the riff is panned left, so the left channel alone reads ~6 dB worse — the right
measure for a phone speaker, and the reason a headphone listener may still hear the left as busy.
Lift: static gain to -14 LUFS + `alimiter` (0.1% of samples touched), never dynamic loudnorm.

## Captions

- **Timing** is MFA on the v7 voice stem (`captions/script.mfa.txt` → `captions/words.v7time.json`),
  then mapped onto the operator's cut: its audio runs **1.001937×** the v7 stem (53 windows,
  residual rms 1.8 ms) — `captions/warp.json`. MFA got the spoken readings (四九年, 二六年, 两百斤,
  两米一) and the captions show digits; `voila` is OOV and was checked by hand (-10/-30 ms against
  the energy edges). Every line lands on its computed frame in the render (21/21).
- **Text follows the take**, not the script, where they differ: 回来之后, 在家里放一台了, 你想干嘛.
- **Hold.** Gaps here are 0-200 ms or 750-1170 ms; HOLD_GAP_MS (600) splits them cleanly.
- **HDR.** The cut is HLG/BT.2020 with Dolby Vision 8.4. `captions/composite-hlg.sh` maps the captions
  to HLG (BT.2408: SDR white → 75%, measured 682/721 on the text) and encodes x265 Main 10 with the
  base's tags — the skill's libx264 recipe would have flattened it (finding O117). The DV RPU is not
  carried; the output is plain HLG.
- **Colour.** The operator read #CEE7F3 as beige; the file carried it faithfully (decoded #CBE5F7), so
  the palette changed: off-white #F5F5F5, then pure white #FFFFFF.

## QC

Mix -14.3 LUFS / -1.39 dBTP, 33.43s. Splice clicks at a silent edge: 0. Captioned cut: SSIM 0.996 /
PSNR 48.6 dB outside the captions against the source; audio packets md5-identical to the source.
