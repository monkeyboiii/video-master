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
  silence to 4.6s, then a busier riff to the drums. v1 started the hook on the first chord and the
  operator heard them collide;
- 第一步 at 7.92s, just after the riff's last hit (7.5-7.9s). At full riff volume its v1/v2 slot (6.71s)
  measured a -5.4 dB median with 66% of frames masked; 7.50s still left the hit on the word 第一步
  itself (masked frames 7.71-7.90); 7.92s measures a 22.5 dB median, no frame masked;
- 骑电驴的时候 on the beat after the drum entry (9.315s; the kit comes in at 8.79s);
- 第二步 and 第三步 on beats — a header takes a bar, or a half-bar, or failing both any beat, whichever
  first leaves ≤1.3 / ≤0.9s of air; the English lines on beats;
- "Beautiful!", a 0.51s pause, 等下，这姿势真的对吗？ on a beat, and the call-to-action 0.28s later on the
  chorus downbeat (50.53s) — the follow ask rides the biggest lift in the song;
- 0.30s speech-to-speech inside a section. Voice ends 52.96s; the bed fades across bar 26 (to 56.79s).

## Bed

`audio/mix-bed.py`, the operator's design and S05E003's: **the intro riff keeps its volume, and when the
drums kick in the bed drops once to a flat level** and stays there. No ducking — v1 ducked under speech
and swelled in pauses, and the operator found that weird; v2 ran the whole song flat and left the
opening chords at -30.6 LUFS.

- Intro: the riff at the voice's own loudness, -12.32 dB on the file (v1's measurement: voice -24.83,
  music 0-56s -12.51 LUFS). The opening chord alone plays at -19.2 LUFS in the delivered mix.
- Drop: 8.40-8.75s, inside the riff's near-silent tail (-41 to -59 dB), so the drums arrive at the new
  level with nothing audible ramping.
- After the drums: **-24.48 dB**, `audio/levels.py`'s measured answer — the single gain keeping S05E003's
  approved consonant clarity (1-4 kHz voice-over-music: 12.4 dB median, -6.9 dB 10th percentile, ≤20.1%
  of frames under 0) over the speech after the drums.
- What it costs: the hook runs over the full-volume riff, and 35% of its frames have the guitar above the
  voice (median still 18.5 dB). whisper reads it all but hears 摩托车手 as 無脫車手 — that word lands on the
  busier riff from 4.65s. A higher intro would only add to that; a lower one is the knob if it bothers.

## Captions

zh word timing is **MFA** on the delivered voice stem (`captions/script.mfa.txt`, spoken forms —
三个 shows as 3个). The English lines are OOV placeholders there; their words come from Kokoro's own
token timestamps, mapped through the cut. MFA's sentence edges sit 7-69 ms ahead of the energy-measured
onsets; 髋 is OOV and its word got a plausible 260 ms. English words carry a no-break space, because
the zh layout has no word gap and an ordinary trailing space collapses. Text is pure white #FFFFFF.
All 17 lines appear on their computed frame in the render; MFA is re-run on each version's stem.

## When the take arrives

The same steps with the take in place of `tts_take.py`: cut it with auto-editor at a threshold matched
to ITS level, split it into the 17 lines, rerun `place.py` with the same anchors, then MFA on the new
stem and `captions/build_props.py`. The English lines then need MFA-independent timing again (or a
hand check), since Kokoro will no longer know them.

## QC

v3: mix -14.44 LUFS / -1.41 dBTP, 56.79s; 0.12% of samples limited. Splice clicks at a silent edge: 0.
whisper reads every line in order over the bed, English included — in two halves, since whole-file it
once dropped a first 30s window that opens on solo guitar. `render.sh` re-derives the intro level from
v3's own voice as -12.31 dB; the delivered mix used v1's -12.32 (levels.json) — 0.01 dB.
