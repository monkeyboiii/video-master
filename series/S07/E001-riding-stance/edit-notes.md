# Edit notes — S07E001

What this repo did, measured. `audio/render.sh` is the whole audio run; the JSONs in `audio/` are
that run's recorded decisions. Inputs and outputs are gitignored (media/S07E001/). This is v8.

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
- **The hook is three phrases** (`audio/hook_phrases.py`), synthesised separately so each can sit in its own
  gap of the intro riff: 跟我学会这三个技巧 at the take's 1.15; 直接从小电驴骑士 at 1.22 and 变成越野摩托车手
  at 1.30 — the slowest that fit between two chords (at 1.15 they need 1.21s and 1.26s; the gaps hold
  1.14s and 1.13s). The operator heard 1.30/1.35 (v6) as rushed. They are re-synthesised slower, not time-stretched: a
  slower Kokoro read sounds like a person talking slower, a stretched fast one sounds processed. Above 1.40
  跟 slurs into 我. Gain -1.67 dB, matched to the one-sentence hook (line00, -25.75 LUFS) when it was split.
- **Kokoro is not bit-reproducible.** Re-running `hook_phrases.py` gives a different waveform and can move a
  phrase's length by a frame; the placement re-derives from whatever lengths it gets. Given the delivered
  phrases, `voice_track.py` → `mix-bed.py` → the lift reproduces both delivered files sample for sample.

## Placement on the bed

Highway To Hell (instrumental), measured by `audio/bgm-grid.py`: **115 BPM**, bar 2.087s. The intro is
call-and-response — chord 1 at 0.28-1.25s, quiet (≥25 dB under the riff's peak) to 2.40s, chord 2 to ~3.40s
with a ringing tail to 3.54s, quiet to 4.55s, then a busier riff from 4.65s; drums from 8.79s, a build at bar
23 (48.45s), the chorus lift at bar 24 (**50.53s**, ~3 dB up). Times below are on the bed's clock unless
marked; the bed starts **1.51s** into the output (`audio/offset.json`).

- **跟我学会这三个技巧 plays alone, before the bed**: from 0.10s (output), and the bed starts so its first chord
  lands 0.25s after the phrase's last syllable — the chord answers it (`audio/voice_track.py`);
- the first two chords separate the from/to lines: 直接从小电驴骑士 and 变成越野摩托车手 each **end** just
  before the next guitar attack (2.40s, 4.55s) and start where their length puts them (1.26s, as chord 1 dies;
  3.42s, in chord 2's -19 dB tail). Earlier placements, each heard by the operator: over the full riff (v3,
  35% of the hook's frames masked), squeezed to 1.40-1.45 in the gaps (v4), the last phrase over the busy riff
  (v5: 69% masked, whisper heard 你成越眼眸过这首), the first word inside the chord's tail (v7b);
- 第一步 at 7.92s, just after the riff's long last hit (7.5-7.9s). At full riff volume its v1/v2 slot (6.71s)
  measured a -5.4 dB median with 66% of frames masked; 7.92s measures 28.5 dB, no frame masked;
- 骑电驴的时候 on the beat after the drum entry (9.315s); `audio/place.py` puts the rest on the grid —
  a header takes a bar, or a half-bar, or failing both any beat, whichever first leaves ≤1.3 / ≤0.9s of air;
  the English lines on beats; "Beautiful!", a 0.51s pause, 等下，这姿势真的对吗？ on a beat, and the
  call-to-action 0.28s later on the chorus downbeat (50.53s). 0.30s speech-to-speech inside a section.

## Bed

`audio/mix-bed.py`, the operator's design and S05E003's: **the intro riff keeps its volume, and when the
drums kick in the bed drops once to a flat level**; no ducking — v1 ducked under speech and swelled in
pauses, and the operator found that weird.

- Intro: the riff at the voice's own loudness, -12.32 dB on the file (v1's measurement: voice -24.83,
  music 0-56s -12.51 LUFS). `render.sh` passes it fixed: re-deriving it from each version's voice would move
  the level the operator approved with every edit to the hook.
- Drop: 8.40-8.75s, inside the riff's near-silent tail (-41 to -59 dB), so the drums arrive at the new
  level with nothing audible ramping.
- After the drums: **-24.48 dB**, `audio/levels.py`'s measured answer — the single gain keeping S05E003's
  approved consonant clarity (1-4 kHz voice-over-music: 12.4 dB median, -6.9 dB 10th percentile, ≤20.1%
  of frames under 0) over the speech after the drums.
- **Back to full when the voice is done** (the operator's ask): from 0.04s after the call-to-action's last
  syllable (52.96s) up to -12.32 dB, arriving on the beat at 53.66s; full to 55.75s, out over the last two
  beats to 56.79s (58.30s output).

## Sound effect

A pop where the on-screen callout appears, in the riff's 3.4s run between 变成越野摩托车手 and 第一步 —
the operator's "cork pop / message arrive". Freesound 202230 "Pop sound" by deraj, **CC0**
(https://freesound.org/s/202230/), its HQ preview, pinned by sha256 in `render.sh`. Picked from seven CC0
candidates as the cleanest short one: 84% of its energy in 1-3 kHz, ~200 ms to -40 dB, an -82 dB floor.
It lands at 5.53s (7.04s output, `audio/sfx.json`), in the riff's first rest after the phrase (5.52-5.71s,
-22 to -27 dB), at the hook voice's 95th-percentile 10 ms level; over the bed its 1-4 kHz leads by +35 dB at
the attack and stays ahead for ~180 ms.

## Captions

zh word timing is **MFA** on the delivered voice stem (`captions/script.mfa.txt`, spoken forms —
三个 shows as 3个), the hook as three sentences so each phrase is its own caption line. The English lines
are OOV placeholders there; their words come from Kokoro's own token timestamps, mapped through the cut.
MFA's sentence edges sit 7-69 ms ahead of the energy-measured onsets (45-65 ms on the hook's phrases); 髋 is OOV and its word got a
plausible 260 ms. English words carry a no-break space, because the zh layout has no word gap and an ordinary
trailing space collapses. Text is pure white #FFFFFF.

- **The callout 99%的人都不知道** is on screen, not spoken: the operator's "let viewers read the 99% not knowing
  this", worded here. One lit row from the pop (7.04s) to 第一步 (9.38s), so the band and text light together
  for its 2.3s. It is the line to change or drop if the edit carries its own text card.

## When the take arrives

The same steps with the take in place of `tts_take.py` and `hook_phrases.py`: cut it with auto-editor at a
threshold matched to ITS level, split it into the lines (the hook into its three phrases), rerun `place.py`
with the same anchors, then MFA on the new stem and `captions/build_props.py`. The English lines then need
MFA-independent timing again (or a hand check), since Kokoro will no longer know them. A human read of a
from/to phrase may not fit its gap; that is a re-take or a cut, not a stretch.

## QC

v8: mix -14.51 LUFS / -1.41 dBTP, 58.30s; 0.012% of samples at the limiter. Splice clicks at a silent edge: 0.
Consonant-band clarity: 直接从小电驴骑士 31.8 dB median, 变成越野摩托车手 27.1, 第一步 28.5, none masked;
after the drums 12.5 median, 15.3% of frames under 0. whisper reads v8's first 11s as 跟我学会这三个技巧
直接从小电力骑士变成越野摩托车手第一步注意我们的脚 (电力/电驴 is a homophone it flips between runs).
Captions: all 20 rows appear on their computed frame in the ProRes master (alpha-mask change per frame).
