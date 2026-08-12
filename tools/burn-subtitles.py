#!/usr/bin/env python3
"""
Burn bilingual captions into a cut. This is the project standard for subtitles --
the Remotion `subtitle-track` / `kinetic-captions` overlays are deprecated.

    tools/burn-subtitles.py <episode-dir>            # write the .ass only
    tools/burn-subtitles.py <episode-dir> --render   # ...and encode the export

Needs `python3-yaml`, `ffmpeg` with libass, and a static ExtraBold cut of the latin face
in `media/_fonts/` (gitignored; fetch command below).

    curl -sL -o media/_fonts/Bricolage-ExtraBold.ttf "$(curl -s -A 'Mozilla/4.0' \
      'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@96,800' \
      | grep -o 'https://[^)]*\\.ttf')"

Reads `<episode-dir>/subtitles.yml`. Every path in it is relative to the repo root.
Style defaults below are the house standard, measured off the graded en-US cut of
S03E002; an episode overrides only what its own footage forces (usually `block_mid`,
to clear burned-in graphics). See skills/07-subtitles-localization.md.

Layout per cue: primary language on top, secondary beneath it at a smaller size, the
whole line landing at once. Emphasis is semantic -- the words carrying the point go
yellow, named per cue in `highlights`. Chinese packs more meaning per character than
English, so streaming a line in word by word holds the reader behind the information
instead of leading them through it; do not reintroduce it.
"""
import os, re, subprocess, sys

import yaml

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# House standard. Measured, not chosen -- see the skill file for how each was derived.
DEFAULTS = {
    'play_w': 1440, 'play_h': 2560,
    'font_primary': 'Noto Sans CJK SC',        # zh display face
    'font_secondary': 'Bricolage Grotesque 96pt',  # latin; STATIC ExtraBold instance
    'fs_primary': 96, 'fs_secondary': 72,
    'outline': 4,
    'block_mid': 1926,        # centre of the caption block; lift it to clear graphics
    'margin_lr': 130,         # leaves a ~1180 px text column
    'highlight': '#F3E774',   # sampled off the reference cut
}


def rgb_to_ass(hexstr):
    """#RRGGBB -> ASS &HBBGGRR&."""
    h = hexstr.lstrip('#')
    return f'&H{h[4:6]}{h[2:4]}{h[0:2]}&'


def parse_srt(path):
    cues = []
    for block in re.split(r'\n\s*\n', open(path, encoding='utf-8').read().strip()):
        L = [l for l in block.strip().split('\n') if l.strip()]
        if len(L) < 3:
            continue
        m = re.search(r'(\d+):(\d+):(\d+)[,.](\d+)\s*-->\s*(\d+):(\d+):(\d+)[,.](\d+)', L[1])
        if not m:
            continue
        g = [int(x) for x in m.groups()]
        cues.append({
            'n': int(L[0]),
            's': g[0]*3600 + g[1]*60 + g[2] + g[3]/1000,
            'e': g[4]*3600 + g[5]*60 + g[6] + g[7]/1000,
            'primary': L[2],
            'secondary': L[3] if len(L) > 3 else '',
        })
    return cues


def esc(t):
    return t.replace('\\', '').replace('{', '(').replace('}', ')')


def paint(text, spans, white, yellow, where):
    """The line in white, with `spans` turned yellow. Non-overlapping, first match wins.
    A span that matches nothing is a typo -- say so rather than dropping the emphasis."""
    if not text:
        return ''
    marks = [False] * len(text)
    for sp in spans or []:
        i, hit = 0, False
        while True:
            j = text.find(sp, i)
            if j < 0:
                break
            if not any(marks[j:j+len(sp)]):
                for k in range(j, j + len(sp)):
                    marks[k] = True
                hit = True
                break
            i = j + 1
        if not hit:
            print(f'  WARNING {where}: highlight {sp!r} not in {text!r}', file=sys.stderr)
    out, cur = [], None
    for ch, hot in zip(text, marks):
        want = yellow if hot else white
        if want != cur:
            out.append(want)
            cur = want
        out.append(esc(ch))
    return ''.join(out)


def ts(x):
    x = max(x, 0)
    return f'{int(x//3600)}:{int(x%3600//60):02d}:{x%60:05.2f}'


def build_ass(cues, st, highlights):
    white = r'{\1c&HFFFFFF&}'
    yellow = r'{\1c%s}' % rgb_to_ass(st['highlight'])
    head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {st['play_w']}
PlayResY: {st['play_h']}
ScaledBorderAndShadow: yes
WrapStyle: 0
YCbCr Matrix: PC.709

[V4+ Styles]
Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding
Style: Cap,{st['font_primary']},{st['fs_primary']},&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,1,0,0,0,100,100,0,0,1,{st['outline']},0,5,{st['margin_lr']},{st['margin_lr']},0,1

[Events]
Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text
"""
    lines = [head]
    for c in cues:
        hl = (highlights or {}).get(c['n'], {}) or {}
        # The primary line keeps the style font; only the secondary run switches face, so
        # CJK never falls through to whatever fontconfig happens to pick.
        body = r'{\fs%d}' % st['fs_primary'] + paint(
            c['primary'], hl.get('primary'), white, yellow, f"cue {c['n']} primary")
        if c['secondary']:
            body += (r'\N{\fn%s\fs%d}' % (st['font_secondary'], st['fs_secondary'])
                     + paint(c['secondary'], hl.get('secondary'), white, yellow,
                             f"cue {c['n']} secondary"))
        lines.append(
            f"Dialogue: 0,{ts(c['s'])},{ts(c['e'])},Cap,,{st['margin_lr']},{st['margin_lr']},0,,"
            f"{{\\pos({st['play_w']//2},{st['block_mid']})}}{body}\n")
    return ''.join(lines)


def render(cfg, ass_path):
    """Encode the export. Two things here are not optional:

    - The full-range chain. These grades are `yuvj420p` / `color_range=pc`. Declaring
      `-color_range pc` while letting the scaler convert is WORSE than passing nothing:
      it squeezes 0-255 into 16-235 and still claims full range, so the whole video
      loses contrast silently. `scale=in_range=full:out_range=full` carries it through.
    - The CPU cap, so a render never starves whatever else this box is running.
    """
    src = os.path.join(REPO, cfg['source'])
    out = os.path.join(REPO, cfg['export'])
    fonts = os.path.join(REPO, cfg.get('fonts', 'media/_fonts'))
    os.makedirs(os.path.dirname(out), exist_ok=True)
    quota = str(cfg.get('cpu_quota', 180))
    vf = (f"subtitles={ass_path}:fontsdir={fonts},"
          f"scale=in_range=full:out_range=full")
    cmd = ['systemd-run', '--user', '--scope', '-q', '-p', f'CPUQuota={quota}%',
           'ffmpeg', '-y', '-v', 'error', '-stats', '-i', src, '-vf', vf,
           '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-threads', '2',
           '-pix_fmt', 'yuv420p', '-color_range', 'pc', '-colorspace', 'bt709',
           '-c:a', 'copy', '-movflags', '+faststart', out]
    print(f'>>> rendering {os.path.relpath(out, REPO)} (CPUQuota {quota}%)')
    subprocess.run(cmd, check=True)
    return out


def main():
    ep = sys.argv[1]
    do_render = '--render' in sys.argv[2:]
    cfg = yaml.safe_load(open(os.path.join(ep, 'subtitles.yml'), encoding='utf-8'))
    st = {**DEFAULTS, **(cfg.get('style') or {})}

    srt = os.path.join(REPO, cfg['srt'])
    ass = os.path.join(REPO, cfg['ass'])
    cues = parse_srt(srt)
    os.makedirs(os.path.dirname(ass), exist_ok=True)
    open(ass, 'w', encoding='utf-8').write(build_ass(cues, st, cfg.get('highlights')))
    print(f"{len(cues)} cues -> {os.path.relpath(ass, REPO)}")

    if do_render:
        render(cfg, ass)


if __name__ == '__main__':
    main()
