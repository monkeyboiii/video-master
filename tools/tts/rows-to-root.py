#!/usr/bin/env python3
"""Write generated caption rows into the Root.tsx compositions they belong to.

    python tools/tts/rows-to-root.py --root ../repos/video-master/packages/.../Root.tsx

The rows come from build-narration.py, so what lands here is timed off the narration that will
actually play rather than off a rate someone chose. Rows come from `build-narration.py`, so what lands
here is timed off the narration that will actually play rather than off a rate someone chose.
"""
import argparse, os, re, sys
from pathlib import Path

MAIN = Path(__file__).resolve().parents[2] / 'packages/remotion-graphics/src/Root.tsx'
TARGETS = {'burst-intro-captions-zh': 'zh',
           'burst-intro-captions-en': 'en',
           'burst-intro-captions-en-plain': 'en'}


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--root', type=Path, default=MAIN)
    p.add_argument('--rows-dir', type=Path,
                   default=Path(os.environ.get('DBX_TTS_DIR',
                                               Path.home() / '.cache/dbx-tts')) / 'out')
    a = p.parse_args()

    src = a.root.read_text(encoding='utf-8')
    for comp, tag in TARGETS.items():
        f = a.rows_dir / f'rows-{tag}.txt'
        if not f.exists():
            sys.exit(f'{f}: not generated yet')
        # blocks are blank-line separated; the TSX literal wants them escaped
        script = f.read_text(encoding='utf-8').strip().replace('\n', '\\n')
        m = re.search(r'(id="' + re.escape(comp) + r'".*?script: \')([^\']*)(\',)', src, re.S)
        if not m:
            sys.exit(f'{comp}: not found in {a.root}')
        src = src[:m.start(2)] + script + src[m.end(2):]
        n = len(f.read_text(encoding='utf-8').strip().splitlines())
        print(f'{comp}: {n - script.count(chr(92)+"n"+chr(92)+"n")} rows')
    a.root.write_text(src, encoding='utf-8')
    print(f'{a.root} updated')


if __name__ == '__main__':
    main()
