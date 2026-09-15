# Fixture: a dropped code-switched word, and its known answer

From S03E005's whisper.cpp pass (`--lang=zh`, forced, large-v3, DTW). The take has an English
interjection ("What") inside an otherwise all-Chinese sentence. The forced-zh decoder has no good
token for it, so it drops the word — and the drop is silent: whisper's word timestamps tile the
audio, so the missing duration doesn't leave a gap, it gets absorbed into whichever neighbour word
the decoder happened to extend.

## The files

- `whisper-raw-excerpt.json` — `whisper-raw.json`'s entries for 28000-32000ms (16 of the full
  169), i.e. `Caption[]` as `tools/transcribe.mjs` writes it, unmodified.
- `silencedetect-excerpt.log` — `ffmpeg -af silencedetect=noise=-30dB:d=0.05` over the same
  window of the source export (`media/exports/S03E005-cn.MP4`, not committed — media stays off
  this repo per `.gitignore`; this log is what a fresh run of the same command over the same
  clip should reproduce).

## What the excerpt shows

whisper's tokens: `...时(30400-30760) 那(30760-31030)...` — 时 (小时's last character) and 那
(那我们's first) meet at exactly 30760ms, no token between them. That is the dropped word.

The silencedetect log shows the real shape underneath that single point:

```
speech (小时) ends:      30629
silence:                 30629 - 30748   (119ms)
speech ("What"):         30748 - 30866   (118ms)
silence:                 30866 - 31030   (164ms)
speech (那我们) starts:  31030
```

That's 401ms of real content (119 + 118 + 164 = 401) collapsed into whisper's single 30760
boundary — 30760 sits 30760-30629 = 131ms into what 时 absorbed, and 31030-30760 = 270ms before
那 actually starts (131 + 270 = 401, exactly). The single point isn't arbitrary either: it falls
30760-30748 = 12ms into "What" itself, so 时 absorbed the pause before the word plus its first
12ms, and 那 absorbed the rest of the word plus the pause after it.

## The known answer, for whatever implements O69 or O71's fix #1

A correct fix, given `whisper-raw-excerpt.json` and `silencedetect-excerpt.log` as input, should
recover something close to:

- 小时 ends ~30629 (not 30760)
- a gap 30629-30748
- an unlabelled/foreign span 30748-30866 (whisper's own text is untrustworthy here regardless —
  see `agents.d/modules/captions.md` § "The script is known, so ASR output is a draft" — but the
  TIMING should be recoverable)
- a gap 30866-31030
- 那我们 starts ~31030 (not 30760)

Found and verified during S03E005's caption work, 2026-09-15 — see that episode's
`build-captions.mjs` git history for the full saga this fixture is distilled from, and
`ops/findings.toml` O69/O71 for what still needs building.
