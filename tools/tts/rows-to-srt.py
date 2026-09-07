#!/usr/bin/env python3
"""Caption rows -> SRT, one cue per sentence.

    python tools/tts/rows-to-srt.py --comp burst-intro-captions-zh -o subs/zh.srt

Reads the `script:` of a composition in packages/remotion-graphics/src/Root.tsx, which is the
authority for what is said and when. Sentences are blank-line separated; a cue spans its first
word's start to its last word's end, and the `|*` important marker is dropped — it is a caption
concern and means nothing to a voice.
"""
import argparse, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2] / 'packages/remotion-graphics/src/Root.tsx'


def stamp(ms):
    h, ms = divmod(int(ms), 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f'{h:02d}:{m:02d}:{s:02d},{ms:03d}'


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--comp', required=True)
    p.add_argument('--root', type=Path, default=ROOT)
    p.add_argument('-o', '--out', type=Path, required=True)
    a = p.parse_args()

    src = a.root.read_text(encoding='utf-8')
    m = re.search(r'id="' + re.escape(a.comp) + r'".*?script: \'([^\']*)\'', src, re.S)
    if not m:
        sys.exit(f'{a.comp}: no such composition in {a.root}')
    # only the \n separators are escaped in the TSX literal; the text itself is literal UTF-8,
    # so unicode_escape (which round-trips through latin-1) would mangle every Chinese character
    script = m.group(1).replace('\\n', '\n')

    out = []
    for i, block in enumerate(re.split(r'\n\s*\n', script.strip()), 1):
        rows = [r.split('|') for r in block.strip().split('\n') if r.strip()]
        rows = [r for r in rows if len(r) >= 3]
        if not rows:
            continue
        words = [r[0] for r in rows]
        # zh has no spaces between words; Latin does
        joiner = '' if any('一' <= c <= '鿿' for w in words for c in w) else ' '
        out.append(f'{i}\n{stamp(min(int(r[1]) for r in rows))} --> '
                   f'{stamp(max(int(r[2]) for r in rows))}\n{joiner.join(words)}\n')
    a.out.parent.mkdir(parents=True, exist_ok=True)
    a.out.write_text('\n'.join(out), encoding='utf-8')
    print(f'{a.out}: {len(out)} cues from {a.comp}')


if __name__ == '__main__':
    main()
