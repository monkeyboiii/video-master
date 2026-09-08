#!/usr/bin/env python3
"""Write generated caption rows into the Root.tsx compositions they belong to.

    python tools/tts/rows-to-root.py --root ../repos/video-master/packages/.../Root.tsx

The rows come from build-narration.py, so what lands here is timed off the narration that will
actually play rather than off a rate someone chose. Rows come from `build-narration.py`, so what lands
here is timed off the narration that will actually play rather than off a rate someone chose.
"""
import argparse, json, os, re, sys
from pathlib import Path

MAIN = Path(__file__).resolve().parents[2] / 'packages/remotion-graphics/src/Root.tsx'
# `burst-intro-captions-en-plain` was renamed to `-en-band` in Root.tsx and this map was not
# updated. Because the Root.tsx write happens AFTER the loop, the sys.exit on the missing id threw
# away the zh and en rows too — so `narrate --write` had been failing outright, in DEMO mode as
# well as episode mode, and nothing said the map was the reason.
TARGETS = {'burst-intro-captions-zh': 'zh',
           'burst-intro-captions-en': 'en',
           'burst-intro-captions-en-band': 'en'}


def episode_props(video_id, locale, rows_dir):
    """Write an episode's rows as the props JSON its own composition already expects.

    The demo compositions bake their script into Root.tsx; an EPISODE must not, and Root.tsx says
    so itself beside `spoken-subtitle-track`: nothing about a specific episode is baked in there,
    the episode's own `remotion-props/spoken-captions.<locale>.json` is passed with `--props`.
    That file's shape IS SpokenSubtitleTrackProps, so this only has to write it.

    Without this, `narrate --episode X --write` could not reach any composition at all: the rows
    land in `rows-<video_id>_<zh|en>.txt` and the demo path below only ever looks for
    `rows-zh.txt`.
    """
    import sys as _sys
    _sys.path.insert(0, str(Path(__file__).resolve().parent))
    import episode as EPISODE
    ep = EPISODE.find_episode(video_id)
    tag = 'zh' if locale == 'zh-CN' else 'en'
    f = rows_dir / f'rows-{video_id}_{tag}.txt'
    if not f.exists():
        _sys.exit(f'{f}: not generated yet — run narrate --episode {video_id} first')
    script = f.read_text(encoding='utf-8').strip()
    last = max(int(l.split('|')[2]) for l in script.splitlines() if l.strip())
    out = ep / 'remotion-props' / f'spoken-captions.{locale}.json'
    out.parent.mkdir(parents=True, exist_ok=True)
    # durationSec drives durationInFrames through overlayMetadata, so the timeline is as long as
    # the rows are. Half a second of air after the last word so it does not cut on the frame.
    out.write_text(json.dumps({'locale': locale, 'durationSec': round(last / 1000 + 0.5, 2),
                               'script': script}, ensure_ascii=False, indent=2) + '\n',
                   encoding='utf-8')
    print(f'{out.relative_to(Path(__file__).resolve().parents[2])}: '
          f'{len([l for l in script.splitlines() if l.strip()])} rows, '
          f'{round(last / 1000 + 0.5, 2)}s')


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--episode', help='a video_id — write the episode props JSON instead of '
                                     'patching the demo compositions in Root.tsx')
    p.add_argument('--locale', default='zh-CN')
    p.add_argument('--root', type=Path, default=MAIN)
    p.add_argument('--rows-dir', type=Path,
                   default=Path(os.environ.get('DBX_TTS_DIR',
                                               Path.home() / '.cache/dbx-tts')) / 'out')
    a = p.parse_args()

    if a.episode:
        return episode_props(a.episode, a.locale, a.rows_dir)

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
