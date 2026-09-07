#!/usr/bin/env python3
"""Turn an SRT into a narration track with Kokoro-82M, en-US and zh-CN.

    python tools/tts/srt-to-narration.py subs.srt --locale zh-CN -o narration.wav

The model is Kokoro-82M v1.0, which carries BOTH locales in one checkpoint — 'a' voices are
en-US, 'z' voices are zh-CN — so one download serves both and the two tracks come out of the same
voice family rather than two unrelated engines. `NobodyWho/Kokoro-82M` is a mirror of the same
weights with the voices stored as .safetensors; `hexgrad/Kokoro-82M` is what the `kokoro` package
loads natively, so that is the default here. --repo takes either.

WHY A TIMELINE AND NOT A CONCATENATION. Each cue is synthesised on its own and written at its own
SRT start time, so the narration stays locked to the subtitles that produced it. Concatenating
would drift by however much every cue's synthesis differs from its slot, and the drift accumulates.

TTS DURATION IS NOT CUE DURATION, and the gap here is large: these captions are timed for a
silent cut, so zh needs about 1.8x and en about 1.2x to fit the voice into its slots.

  place (default)  write at the cue start, let it run its natural length. Overruns are REPORTED,
                   not hidden.
  fit              make each cue fit its slot, in TWO stages, because one stage cannot do it well:

                   1. --tts-speed, spent first, up to --max-tts-speed (default 1.60). Kokoro
                      re-synthesises at the faster rate, so the delivery is genuinely quicker —
                      different prosody, no artefacts, because nothing is being stretched.
                   2. whatever ratio is left goes to ffmpeg, pitch held constant.

                   Stage 1 first is the whole point. A voice re-synthesised at 1.3x sounds like a
                   person talking faster; the same 1.3x applied by stretching sounds like a
                   recording being rushed, and the two are not interchangeable however small the
                   number is. Stretching is the remainder, not the method.

                   The 1.60 default is measured, not guessed. At the first-tried 1.30, zh still
                   needed 1.31-1.50x of STRETCH on every cue on top of it; at 1.60 the residue
                   falls to 1.03-1.16x, which is where a pitch-preserving stretch stops being
                   something you can hear. Raising it further to 2.00 buys almost nothing
                   (residue 1.04-1.10x) and spends it on a delivery already at 1.6-1.85x.

  --fit-method     rubberband (default) or atempo. Both hold pitch; atempo is a phase vocoder and
                   smears speech consonants as the ratio climbs, rubberband is designed for it and
                   keeps formants where they are (`formant=preserved`), which is what stops a
                   sped-up voice from sounding thin. atempo is kept only because it is the one
                   that exists in every ffmpeg build.

Remotion can do the same thing in the composition — `<Audio playbackRate={r} toneFrequency={1/r}>`
(see .agents/skills/remotion-markup/audio.md) — and that is the right tool when ONE rate applies to
a whole track. It is the wrong one here: each cue needs its own ratio to land on its own start
time, and per-cue rates are not something a single Audio tag expresses.
"""
import argparse, math, re, subprocess, sys, tempfile
from pathlib import Path

VOICES = {'en-US': ('a', 'af_heart'), 'zh-CN': ('z', 'zf_xiaoxiao')}
SR = 24000
CUE = re.compile(r'(\d+):(\d\d):(\d\d)[,.](\d\d\d)\s*-->\s*(\d+):(\d\d):(\d\d)[,.](\d\d\d)')


def parse_srt(text):
    """(startMs, endMs, text) per cue. Blank-line separated blocks, index line optional."""
    cues = []
    for block in re.split(r'\n\s*\n', text.strip()):
        lines = [l for l in block.strip().split('\n') if l.strip()]
        if not lines:
            continue
        m = next((CUE.search(l) for l in lines if CUE.search(l)), None)
        if not m:
            continue
        g = [int(x) for x in m.groups()]
        a = ((g[0] * 60 + g[1]) * 60 + g[2]) * 1000 + g[3]
        b = ((g[4] * 60 + g[5]) * 60 + g[6]) * 1000 + g[7]
        body = ' '.join(l for l in lines if not CUE.search(l) and not l.strip().isdigit())
        body = re.sub(r'<[^>]+>', '', body).strip()
        if body:
            cues.append((a, b, body))
    return sorted(cues)


def stretch_filter(rate, method):
    """Tempo change at constant pitch. `rate` > 1 makes it shorter."""
    if method == 'rubberband':
        # formant=preserved is what keeps a sped-up voice from going thin; the vocal tract did
        # not get smaller just because the tempo went up
        return (f'rubberband=tempo={rate:.6f}:pitch=1:formant=preserved'
                f':transients=crisp:detector=percussive:pitchq=quality')
    # atempo is capped at [0.5, 2.0] per instance, so chain it past that
    parts, r = [], rate
    while r > 2.0:
        parts.append('atempo=2.0'); r /= 2.0
    while r < 0.5:
        parts.append('atempo=0.5'); r /= 0.5
    parts.append(f'atempo={r:.6f}')
    return ','.join(parts)


def main():
    p = argparse.ArgumentParser()
    p.add_argument('srt', type=Path)
    p.add_argument('--locale', required=True, choices=sorted(VOICES))
    p.add_argument('-o', '--out', type=Path, required=True)
    p.add_argument('--voice')
    p.add_argument('--speed', type=float, default=1.0, help='Kokoro speed; >1 is faster')
    p.add_argument('--max-tts-speed', type=float, default=1.60,
                   help='with --fit: how much of the ratio Kokoro may absorb before stretching')
    p.add_argument('--fit-method', default='rubberband', choices=['rubberband', 'atempo'])
    p.add_argument('--repo', default='hexgrad/Kokoro-82M')
    p.add_argument('--fit', action='store_true', help='stretch each cue to its slot')
    a = p.parse_args()

    import numpy as np, soundfile as sf
    from kokoro import KPipeline

    lang, default_voice = VOICES[a.locale]
    voice = a.voice or default_voice
    cues = parse_srt(a.srt.read_text(encoding='utf-8'))
    if not cues:
        sys.exit(f'{a.srt}: no cues parsed')

    pipe = KPipeline(lang_code=lang, repo_id=a.repo)
    total = math.ceil((max(c[1] for c in cues) / 1000 + 5) * SR)
    track = np.zeros(total, dtype=np.float32)

    def say(text, speed):
        chunks = [g.audio.numpy() for g in pipe(text, voice=voice, speed=speed)]
        return np.concatenate(chunks).astype(np.float32) if chunks else None

    overruns = []
    for i, (s_ms, e_ms, body) in enumerate(cues, 1):
        clip = say(body, a.speed)
        if clip is None:
            print(f'  cue {i}: produced no audio for {body!r}', file=sys.stderr)
            continue
        slot = (e_ms - s_ms) / 1000
        got = len(clip) / SR
        note = ''

        if a.fit and slot > 0.05:
            need = got / slot
            if need > 1.02:
                # stage 1 — spend the budget on a genuinely faster delivery
                tts = min(need, a.max_tts_speed) * a.speed
                if tts > a.speed + 0.01:
                    faster = say(body, tts)
                    if faster is not None:
                        clip, got = faster, len(faster) / SR
                    note += f' tts={tts:.2f}x'
                # stage 2 — stretch whatever is left
                rate = got / slot
            else:
                rate = need
            if abs(rate - 1) > 0.02:
                with tempfile.TemporaryDirectory() as d:
                    src, dst = Path(d) / 'i.wav', Path(d) / 'o.wav'
                    sf.write(src, clip, SR)
                    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(src), '-filter:a',
                                    stretch_filter(rate, a.fit_method), str(dst)], check=True)
                    clip, _ = sf.read(dst, dtype='float32')
                note += f' {a.fit_method}={rate:.2f}x'
                if rate > 1.25:
                    print(f'  cue {i}: still {rate:.2f}x to stretch after tts — shorten the line',
                          file=sys.stderr)
                got = len(clip) / SR

        at = int(s_ms / 1000 * SR)
        if at + len(clip) > len(track):
            track = np.pad(track, (0, at + len(clip) - len(track)))
        # add, so a cue that runs into the next one is audible rather than silently truncated
        track[at:at + len(clip)] += clip
        if got > slot + 0.05:
            overruns.append((i, got, slot, body))
        print(f'  cue {i:3d}  {s_ms/1000:6.2f}s  slot {slot:5.2f}s  spoke {got:5.2f}s'
              f'{note:<26}  {body[:40]}')

    peak = float(np.max(np.abs(track))) or 1.0
    if peak > 1.0:
        track /= peak
    a.out.parent.mkdir(parents=True, exist_ok=True)
    sf.write(a.out, track, SR)
    print(f'\n{a.out}  {len(track)/SR:.2f}s  {len(cues)} cues  voice={voice} speed={a.speed}')
    if overruns:
        print(f'{len(overruns)} cue(s) ran past their slot — the captions are timed faster than '
              f'this voice speaks them:')
        for i, got, slot, body in overruns:
            print(f'  cue {i}: {got:.2f}s into {slot:.2f}s (+{got-slot:.2f}s)  {body[:44]}')


if __name__ == '__main__':
    main()
