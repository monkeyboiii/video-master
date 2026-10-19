# Edit notes — S07E001

What this repo did, measured. `audio/render.sh` is the whole audio run; the JSONs in `audio/` are
that run's recorded decisions. Inputs and outputs are gitignored (media/S07E001/). This is v13: v11's audio —
the operator's take of lines 1-17 in place of the stand-in, v8's TTS hook kept, the bed edited — and its
captions re-aligned, without the callout, two lines lifted.

## Voice

- **The take.** The operator's phone read of lines 1-17 (`audio/render.sh` pins it by sha256): 84.76s, AAC
  48 kHz mono, -29.0 LUFS, the English asides in their own voice. It departs from the stand-in's script and
  the captions follow what was said (`audio/lines.tsv`): 得使用, 稳住车身, 握紧, 颠簸的时候, 稍稍, and a new
  ending — 等下教练这对吗？ / 没问题！姿势都学会了。 / 关注我，下一集咱们学翘头！ 膝盖夹紧车身 is
  UNVERIFIED: whisper hears 夹顶, with low confidence; the operator has not said.
- **Line bounds** (`audio/take-lines.json` → `audio/take_meta.py`) are the take's -40 dB energy regions, not
  MFA's: on the raw take MFA lost its place after the Nice! placeholder and put lines 9-11 in the wrong
  regions. The English words carry their own measured times there.
- **Cut.** auto-editor `--edit audio:-40dB --margin 0.08s,0.10s`, the threshold S05E003's phone take at a
  like level (-29.8 LUFS) was cut at: 35 pieces. Speech above -40 dB: 37.77s before, 37.78s after. Pieces
  rebuilt with 8ms fades (`audio/lines_cut.py`); the stem's largest sample step is the raw take's times the
  gain, so no splice clicks.
- **Gain +4.09 dB** (`audio/voice_track.py`): the take's lines (-28.94 LUFS) up to the stand-in's they
  replace (-24.85), the level the hook's gain and the intro riff's were set against. The read is ~1.7x the
  stand-in's length: 58.30s became 68.22s.
- **The hook is three phrases** (`audio/hook_phrases.py`), synthesised separately so each can sit in its own
  gap of the intro riff: 跟我学会这三个技巧 at the take's 1.15; 直接从小电驴骑士 at 1.22 and 变成越野摩托车手
  at 1.30 — the slowest that fit between two chords (at 1.15 they need 1.21s and 1.26s; the gaps hold
  1.14s and 1.13s). The operator heard 1.30/1.35 (v6) as rushed. They are re-synthesised slower, not time-stretched: a
  slower Kokoro read sounds like a person talking slower, a stretched fast one sounds processed. Above 1.40
  跟 slurs into 我. Gain -1.67 dB, matched to the one-sentence hook (line00, -25.75 LUFS) when it was split.
- **Kokoro is not bit-reproducible.** Re-running `hook_phrases.py` gives a different waveform and can move a
  phrase's length by a frame; the placement re-derives from whatever lengths it gets. v11 was rendered with
  v8's delivered phrases in place of a re-synthesis, so the hook is the one the operator approved.

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
- 骑电驴的时候 0.30s after it: the take's 第一步，注意我们的脚 runs past the beat after the drum entry (9.315s),
  the stand-in's anchor. `audio/place.py` puts the rest on the grid — a header takes a bar, or a half-bar, or
  failing both any beat, whichever first leaves ≤1.3 / ≤0.9s of air; the English lines on beats;
  "Beautiful!", a 1.0s pause, 等下教练这对吗？ on a beat, and 没问题 anchored on the chorus downbeat (edited bar
  28, 58.88s), the call-to-action 0.30s after it. 0.30s speech-to-speech inside a section.

## Bed

`audio/mix-bed.py`, the operator's design and S05E003's: **the intro riff keeps its volume, and when the
drums kick in the bed drops once to a flat level**; no ducking — v1 ducked under speech and swelled in
pauses, and the operator found that weird.

- Intro: the riff at the voice's own loudness, -12.32 dB on the file (v1's measurement: voice -24.83,
  music 0-56s -12.51 LUFS). `render.sh` passes it fixed: re-deriving it from each version's voice would move
  the level the operator approved with every edit to the hook.
- Drop: 8.40-8.75s, inside the riff's near-silent tail (-41 to -59 dB), so the drums arrive at the new
  level with nothing audible ramping.
- **Edited** (`audio/bed_edit.py`): at 33.84s verse 1's bar 16 runs into verse 2's bar 38, the same riff, so
  the chorus lifts under 没问题 as in v8 instead of halfway through 下巴… (unedited, it lifts at 50.53s). Verse
  2's downbeat is 293 ms off the grid fitted on the first 100s; found by onset correlation (0.82). Beats across
  the splice measure 0.515-0.534s against 0.522: no hiccup.
- After the drums: **-24.18 dB**, `audio/levels.py`'s measured answer — the single gain keeping S05E003's
  approved consonant clarity (1-4 kHz voice-over-music: 12.4 dB median, -6.9 dB 10th percentile, ≤20.1%
  of frames under 0) over the speech after the drums.
- **Back to full when the voice is done** (the operator's ask): from 0.04s after the call-to-action's last
  syllable (62.71s) up to -12.32 dB, arriving on the beat at 63.58s; full to 65.66s, out over the last two
  beats to 66.71s (68.22s output).

## Sound effect

A pop where the on-screen callout appeared (v8-v10), in the riff's 3.4s run between 变成越野摩托车手 and 第一步 —
the operator's "cork pop / message arrive". Freesound 202230 "Pop sound" by deraj, **CC0**
(https://freesound.org/s/202230/), its HQ preview, pinned by sha256 in `render.sh`. Picked from seven CC0
candidates as the cleanest short one: 84% of its energy in 1-3 kHz, ~200 ms to -40 dB, an -82 dB floor.
It lands at 5.53s (7.04s output, `audio/sfx.json`), in the riff's first rest after the phrase (5.52-5.71s,
-22 to -27 dB), at the hook voice's 95th-percentile 10 ms level; over the bed its 1-4 kHz leads by +35 dB at
the attack and stays ahead for ~180 ms.

## Captions

zh word timing is **MFA** on the delivered voice stem (`captions/script.mfa.txt`, spoken forms —
三个 shows as 3个), the hook as three sentences so each phrase is its own caption line. The English lines
are OOV placeholders there; their words are the take's measured times (`audio/take-lines.json`), mapped
through the cut. On the v11 stem MFA lost its place after the Nice! placeholder again and put 第三步 to 前方
1.2-2.4s early; those three sentences were aligned again alone, on the stem's 44.44-53.44s, and spliced in.
Every other sentence starts 20-110 ms ahead of `audio/plan.json`'s energy onset. Text is pure white #FFFFFF.

- **Cut at the script's commas** (`captions/build_props.py`), never by the track. Its width split cuts where the
  halves balance, and v8 showed …踩住脚踏让 | 脚踝… and more like it. Each too-wide sentence is now blocks of whole
  clauses, packed onto a line while they fit 12 glyphs (790px at `burst-captions-zh`'s 72 × 0.88). One clause
  is wider than a line by itself and is cut by hand after 手指 (用一两根手指 | 随时准备操作前刹和离合).
- **English asides in zh, the English under them** — the operator's ask for v11. Each English sentence is a
  translation block, its zh words lit while the English words they render are said (很好 | 看起来 棒极了,
  不错 | 上道了, 漂亮), the English sentence beneath as the secondary line (`>` rows; captions.md says why).
  上道了 is the operator's; the others are this repo's. v10 showed the English itself, one word per block.
- **♪ in the riff's run before 第一步** — the operator's: music playing, nothing said. From 200 ms after
  变成越野摩托车手 ends (6.33s) to 第一步 (9.40s). The band lights under it as under any word.
- **No callout.** v8-v10 put 99%的人都不知道 mid-frame with the pop; the operator dropped it for v11. The pop
  stays in the mix.
- **Two lines lifted to the frame's vertical centre** (`captions/lift.py`, 494px), the operator's ad-hoc call:
  得使用前脚掌踩住脚踏 and 让脚踝能够上下活动 sat on the ankle they describe. v12 lifted them 900px, above the
  ankle's whole travel (y 650-1175 in the first boot shot, the foot coming onto the peg; 1050-1300 in the side
  shot); the operator asked for the centre instead, which clears the side shot's ankle and still crosses the
  first shot's. Everything else stays on the track's line — this is not the uniform lift captions.md asks for.
- **Onto the operator's cut** (v11, `S07E001.MP4`: HEVC Main 10, HLG/BT.2020, Dolby Vision 8.4, 2046 frames).
  Its audio is the v11 mix at 0 ms lag (correlation 0.999, -0.02 dB), so the track goes on at frame 0.
  Composited with S05E003's `captions/composite-hlg.sh` (BT.2408 LUT, x265 Main 10, HLG tags; finding O117);
  the DV RPU is not carried.

## QC

v8: mix -14.51 LUFS / -1.41 dBTP, 58.30s; 0.012% of samples at the limiter. Splice clicks at a silent edge: 0.
Consonant-band clarity: 直接从小电驴骑士 31.8 dB median, 变成越野摩托车手 27.1, 第一步 28.5, none masked;
after the drums 12.5 median, 15.3% of frames under 0. whisper reads v8's first 11s as 跟我学会这三个技巧
直接从小电力骑士变成越野摩托车手第一步注意我们的脚 (电力/电驴 is a homophone it flips between runs).
v11: mix -14.37 LUFS / -1.40 dBTP, 68.22s; 0.004% of samples at the limiter. After the drums 11.3 dB median,
20.6% of frames under 0. Three lines are soft in the voice's own 1-4 kHz, not under louder music (the music's
band measures the same under every line): 屁股稍稍往后… 3.2 dB median, "Beautiful!" -1.4, the call-to-action
3.1. whisper still reads every line off the mix.
Captions (v13): 36 blocks; the lift moves frames 455-557 by exactly 494px and no other frame's rows. Captioned cut against the operator's: audio packets md5-identical; outside the
caption band SSIM 0.996 / PSNR 49.5 dB (above it), SSIM 0.996 (below it).
