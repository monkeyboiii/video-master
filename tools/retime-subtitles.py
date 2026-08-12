#!/usr/bin/env python3
"""
Apply measured timing corrections to a hand-touched SRT, writing a new file. The
original is never modified -- it is the reference, and corrections must stay reviewable.

    tools/retime-subtitles.py <episode-dir>

Reads the `retime:` block of `<episode-dir>/subtitles.yml`:

    retime:
      source: media/<VID>/subtitles/<name>-touched.srt
      fix:
        10: {start: 18.18, end: 21.65, secondary: "...", why: started 1.61s late}
      split:
        24:
          - {start: 46.60, end: 47.45, primary: ..., secondary: ...}
          - {start: 47.50, end: 49.36, primary: ..., secondary: ...}

Output goes to `srt:` from the same file, and cues are renumbered after any split --
which matters, because `highlights:` is keyed by cue number.

HOW TO GET THE NUMBERS -- read this before adding entries. Snapping cues to pauses in
the audio is the obvious method and it is NOT reliable on its own: a pause is not a line
boundary, and on S03E002 it put a line a full second early because the pause it chose sat
inside the previous sentence. When a correctly-captioned cut of the same edit exists in
another language, read ITS burned-in captions frame by frame and offset them -- measure
the offset by cross-correlating the two audio envelopes rather than assuming it. Use pause
detection to find candidates, then confirm each one. Details: skills/07-subtitles-localization.md.
"""
import os, re, sys

import yaml

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def ts(x):
    h = int(x // 3600); m = int(x % 3600 // 60); s = x % 60
    return f'{h:02d}:{m:02d}:{int(s):02d},{round((s % 1) * 1000):03d}'


def main():
    ep = sys.argv[1]
    cfg = yaml.safe_load(open(os.path.join(ep, 'subtitles.yml'), encoding='utf-8'))
    rt = cfg.get('retime') or {}
    if not rt.get('source'):
        print('no retime.source in subtitles.yml — nothing to do'); return

    src = os.path.join(REPO, rt['source'])
    dst = os.path.join(REPO, cfg['srt'])
    fix = {int(k): v for k, v in (rt.get('fix') or {}).items()}
    split = {int(k): v for k, v in (rt.get('split') or {}).items()}

    out = []
    for block in re.split(r'\n\s*\n', open(src, encoding='utf-8').read().strip()):
        L = [l for l in block.strip().split('\n') if l.strip()]
        if len(L) < 2:
            continue
        n = int(L[0])
        if n in split:
            for part in split[n]:
                out.append([f"{ts(part['start'])} --> {ts(part['end'])}",
                            part['primary'], part['secondary']])
            continue
        body = L[1:]
        if n in fix:
            f = fix[n]
            body[0] = f"{ts(f['start'])} --> {ts(f['end'])}"
            if f.get('primary'):
                body[1] = f['primary']
            if f.get('secondary') and len(body) > 2:
                body[2] = f['secondary']
        out.append(body)

    with open(dst, 'w', encoding='utf-8') as fh:
        for i, body in enumerate(out, 1):
            fh.write(str(i) + '\n' + '\n'.join(body) + '\n\n')
    print(f'{len(out)} cues ({len(fix)} retimed, {len(split)} split) '
          f'-> {os.path.relpath(dst, REPO)}')


if __name__ == '__main__':
    main()
