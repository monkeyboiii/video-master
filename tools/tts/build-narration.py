#!/usr/bin/env python3
"""Build the narration AND the caption rows from one script, so they cannot disagree.

    tools/tts/narrate --locale zh-CN --speed 1.15 --write

Run it through `tools/tts/narrate`, not directly: that ensures the environment exists first
(`ensure.sh`), which is what keeps the ~1.7 GB of torch and checkpoint out of this repo and out
of any checkout that never asks for narration.

WHY BOTH COME OUT OF ONE STEP. The captions used to be hand-timed at a rate chosen for a silent
cut, and the moment a voice was laid over them they were 2.1x too fast in zh. Timing the captions
from anything other than the audio that will actually play is guessing, and the guess is what
produced that. Here the voice is synthesised first and the rows are read off it.

The two locales get their word timings from different places, because Kokoro offers different
things:

  en-US  the voice's OWN tokens. misaki returns per-word start/end for Latin script, so the
         alignment is exact and free — nothing to transcribe, nothing to align.
  zh-CN  no tokens are returned, so the timings come from the model's OWN `pred_dur` — one
         duration per phoneme, in units of exactly 600 samples (25 ms at 24 kHz), verified
         against the rendered audio length. misaki's phoneme string is space-separated by word,
         so summing durations per group gives per-word spans with nothing to align.

         The whisper route was tried first and abandoned. It is the documented loop and it is
         right for a HUMAN take, but whisper drops ~35% of zh tokens as byte-split U+FFFD, and
         `group-words.mjs` needs enough matching characters to stay in step: 100 of 107
         characters failed to match and the rows came out desynced — words with start > end,
         a sentence ending at 0.00s, blocks drifting a second past their beat. For synthetic
         speech there is no reason to ask a recogniser what the synthesiser already knows.

Sentences are placed at their beat anchors, so both the voice and the captions land on the cut.
"""
import argparse, os, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import script as SC

HERE = Path(__file__).resolve().parents[2]
VOICES = {'en-US': ('a', 'am_michael'), 'zh-CN': ('z', 'zm_yunxi')}
SR, FPS = 24000, 30


# 1 pred_dur unit = 600 samples = 25 ms at 24 kHz. Verified against rendered audio length:
# sum(pred_dur) * 600 == len(audio), exactly.
DUR_UNIT_SEC = 600 / SR


def zh_spans(g2p, phonemes, pred_dur, words, t0):
    """(start, end) seconds per declared word, from the model's own phoneme durations.

    pred_dur carries one entry per phoneme-string character plus a pad at each end, so
    pred_dur[1:-1] lines up 1:1 with `phonemes` and every character has a real duration.

    DO NOT SPLIT ON misaki's WORD BOUNDARIES. They are not ours and they cross ours: in
    多数时候，它安静地待在线的下面 misaki segments 安静|地待|在线 — 在线 is a word to it ("online")
    and two words to us. Consuming whole groups per declared word therefore overshoots, and the
    last words of the sentence are left with zero-length spans. That is what produced a caption
    whose final two words started and ended on the same millisecond.

    So walk CHARACTERS instead. Each declared word claims as many phoneme characters as its own
    phonemisation is long, scaled so the parts add up to the whole; spaces and punctuation fall to
    the word they follow, which is right because the pause at a comma belongs to the word before
    it. Matching on length rather than on identity is what survives tone sandhi, which changes
    which phonemes appear but not roughly how many.
    """
    per = [float(x) for x in pred_dur[1:1 + len(phonemes)]]
    lead = float(pred_dur[0]) * DUR_UNIT_SEC

    want = [len(g2p(w)[0].replace(' ', '')) for w in words]
    real = len([c for c in phonemes if c != ' '])
    scale = real / sum(want) if sum(want) else 1.0

    spans, i, clock = [], 0, t0 + lead
    for k, need in enumerate(want):
        take = real - sum(round(w * scale) for w in want[:k]) if k == len(want) - 1 \
            else max(1, round(need * scale))
        got, dur = 0, 0.0
        while i < len(per) and (got < take or (i < len(per) and phonemes[i] == ' ')):
            if phonemes[i] != ' ':
                got += 1
            dur += per[i]
            i += 1
        if k == len(want) - 1:            # the tail, including the trailing pad, is the last word's
            while i < len(per):
                dur += per[i]
                i += 1
        spans.append((clock, clock + dur * DUR_UNIT_SEC))
        clock += dur * DUR_UNIT_SEC
    return spans


def flat_spans(n, t0, dur):
    """Even spans across a beat's slot — the fallback for a beat with no voice to read.

    PROVISIONAL BY CONSTRUCTION. captions.md § Timing comes from measurement, not from feel is
    explicit that this is the weaker kind of number, and it is right: a person does not speak in
    equal-length words. It is used only for a `**原声:**` beat, whose real timing has to come off
    the source clip with tools/transcribe.mjs + tools/group-words.mjs once that clip is reachable
    — the documented loop for a HUMAN take. Until then the row exists so the caption is visible
    in a preview, and the run says so out loud rather than letting it pass for a measurement.
    """
    if n <= 0:
        return []
    step = dur / n
    return [(t0 + i * step, t0 + (i + 1) * step) for i in range(n)]


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--locale', required=True, choices=sorted(VOICES))
    p.add_argument('--episode', help='a video_id, e.g. S03E004 — read beats and lines from the repo '
                                     'instead of the demo script in script.py')
    p.add_argument('--speed', type=float, default=1.15)
    p.add_argument('--voice')
    p.add_argument('--repo', default='hexgrad/Kokoro-82M')
    p.add_argument('--outdir', type=Path,
                   default=Path(os.environ.get('DBX_TTS_DIR',
                                               Path.home() / '.cache/dbx-tts')) / 'out')
    a = p.parse_args()

    import numpy as np, soundfile as sf

    from kokoro import KPipeline

    lang, default_voice = VOICES[a.locale]
    voice = a.voice or default_voice
    tag = (a.episode + '_' if a.episode else '') + ('zh' if a.locale == 'zh-CN' else 'en')
    a.outdir.mkdir(parents=True, exist_ok=True)

    # An episode supplies its own beats, anchors and lines; script.py is the demo fallback.
    plan = None
    if a.episode:
        import episode as EPISODE
        ep_dir, plan = EPISODE.load(a.episode, a.locale)
        print(f'{ep_dir.relative_to(Path(__file__).resolve().parents[2])}  {len(plan)} beat(s)')

    pipe = KPipeline(lang_code=lang, repo_id=a.repo)
    g2p = None
    if lang == 'z':
        from misaki import zh as _zh
        g2p = _zh.ZHG2P()
    # Size the timeline from the JOB, not from the demo's 1155 frames — an episode is as long as
    # its beats say it is, and this one is 52s against the demo's 38.5s.
    beats, over = [], []

    jobs = plan if plan else [
        {'beat': b, 'text': SC.SPOKEN[a.locale][b], 'atMs': SC.ANCHOR[b] / FPS * 1000,
         'capSec': ((SC.ANCHOR[SC.ORDER[i + 1]] if i + 1 < len(SC.ORDER) else SC.END) - SC.ANCHOR[b]) / FPS}
        for i, b in enumerate(SC.ORDER)]

    end_sec = (max(j['atMs'] / 1000 + j['capSec'] for j in jobs) + 8) if plan else (SC.END / FPS + 2)
    track = np.zeros(int(end_sec * SR), dtype=np.float32)

    for job in jobs:
        beat, text, at_ms, cap = job['beat'], job['text'], job['atMs'], job['capSec']

        # A beat marked `**原声:**` is spoken by a person in the footage, not by the model. It
        # still needs its caption, so it stays in the plan and only the synthesiser skips it —
        # and skipping it here is also what keeps np.concatenate() below off an empty list.
        if not job.get('speak', True):
            beats.append({'beat': beat, 'atMs': at_ms, 'durSec': 0.0, 'capSec': cap,
                          'text': text, 'tokens': [], 'zh_spans': [], 'sourced': True,
                          'spans': job.get('spans', [])})
            print(f'  {beat:8} {at_ms/1000:6.2f}s  cap {cap:4.2f}s  SOURCE          {text[:46]}')
            continue

        chunks, toks, zspans = [], [], []
        for r in pipe(text, voice=voice, speed=a.speed):
            base = sum(len(c) for c in chunks) / SR
            chunks.append(r.audio.numpy())
            if lang == 'z' and getattr(r, 'pred_dur', None) is not None:
                mine = ([w.rstrip('*') for w in SC.WORDS_ZH[beat]] if plan is None
                        else __import__('episode').words_zh(text))
                # one Result per sentence here; if Kokoro ever splits, spans just continue
                zspans += zh_spans(g2p, r.phonemes, r.pred_dur, mine[len(zspans):], base)
            if getattr(r, 'tokens', None):
                base = sum(len(c) for c in chunks[:-1]) / SR
                for t in r.tokens:
                    txt = t.text.strip()
                    # a comma is a pause the voice takes, not a word the reader sees; without
                    # this the caption grows a lone "," that lights like any other unit
                    if t.start_ts is None or not any(ch.isalnum() for ch in txt):
                        continue
                    toks.append((txt, base + t.start_ts, base + t.end_ts))
        clip = np.concatenate(chunks).astype(np.float32)
        dur = len(clip) / SR
        if dur > cap:
            over.append((beat, dur, cap))
        s = int(at_ms / 1000 * SR)
        track[s:s + len(clip)] += clip
        beats.append({'beat': beat, 'atMs': at_ms, 'durSec': dur, 'capSec': cap, 'text': text,
                      'tokens': toks, 'zh_spans': zspans, 'sourced': False,
                      'spans': job.get('spans', [])})
        print(f'  {beat:8} {at_ms/1000:6.2f}s  cap {cap:4.2f}s  spoke {dur:4.2f}s'
              f'  {"OVER" if dur > cap else "ok":4}  {text[:46]}')

    peak = float(np.max(np.abs(track))) or 1.0
    if peak > 1:
        track /= peak
    wav = a.outdir / f'narration-{tag}.wav'
    sf.write(wav, track, SR)
    print(f'\n{wav}  {len(track)/SR:.2f}s  voice={voice} speed={a.speed}')

    if over:
        print(f'{len(over)} beat(s) run past their slot — shorten those lines:')
        for b, d, c in over:
            print(f'  {b}: {d:.2f}s into {c:.2f}s (+{d-c:.2f}s)')

    # ---- caption rows -------------------------------------------------------------------
    if a.locale == 'en-US':
        rows = []
        for b in beats:
            # the demo script marks its own important words; an episode has no such marking yet
            imp = ({w.lower() for w in SC.IMPORTANT_EN.get(b['beat'], [])} if plan is None
                   else __import__('episode').important_en(b['text'], b.get('spans', ())))
            block = []
            toks = b['tokens']
            if b.get('sourced'):
                ws = [w for w in b['text'].split() if w.strip()]
                toks = [(w, s, e) for w, (s, e) in zip(ws, flat_spans(len(ws), 0.0, b['capSec']))]
            for text, s, e in toks:
                mark = '|*' if text.lower().strip('.,') in imp else ''
                block.append(f"{text}|{round(b['atMs']+s*1000)}|{round(b['atMs']+e*1000)}{mark}")
            if block:
                rows.append('\n'.join(block))
        out = a.outdir / f'rows-{tag}.txt'
        out.write_text('\n\n'.join(rows), encoding='utf-8')
        n = sum(len(r.splitlines()) for r in rows)
        print(f"{out}: {n} words from the voice's own tokens")
        return

    # zh — spans from the model's own phoneme durations, computed during synthesis above
    rows, provisional = [], []
    for b in beats:
        src = (SC.WORDS_ZH[b['beat']] if plan is None
               else __import__('episode').words_zh(b['text'], b.get('spans', ())))
        marks = [w.endswith('*') for w in src]
        words = [w.rstrip('*') for w in src]
        spans = b['zh_spans']
        if b.get('sourced'):
            spans = flat_spans(len(words), 0.0, b['capSec'])
            provisional.append(b['beat'])
        if len(spans) != len(words):
            print(f"  {b['beat']}: {len(spans)} spans for {len(words)} words — check WORDS_ZH",
                  file=sys.stderr)
        block = [f"{w}|{round(b['atMs'] + s*1000)}|{round(b['atMs'] + e*1000)}"
                 f"{'|*' if m else ''}" for w, (s, e), m in zip(words, spans, marks)]
        rows.append('\n'.join(block))
    out = a.outdir / f'rows-{tag}.txt'
    out.write_text('\n\n'.join(rows), encoding='utf-8')
    print(f"{out}: {sum(len(r.splitlines()) for r in rows)} words from pred_dur")
    if provisional:
        print(f"  PROVISIONAL timing on {len(provisional)} sourced beat(s): {', '.join(provisional)}"
              f" — evenly spaced across the slot, not measured. Re-time off the source clip with"
              f" tools/transcribe.mjs + tools/group-words.mjs before this is cut.")



if __name__ == '__main__':
    main()
