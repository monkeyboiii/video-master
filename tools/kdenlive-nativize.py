#!/usr/bin/env python3
"""Make a cli-anything-kdenlive MLT export open cleanly in Kdenlive.

The CLI emits lightweight MLT that Kdenlive flags as invalid/corrupt because:
  - the root <mlt producer="kdenlive-cli"> points at a producer that doesn't exist
    (the real top-level timeline is <tractor id="maintractor">);
  - bin producers are id="clipN" with no numeric kdenlive:id (Kdenlive keys clips
    on kdenlive:id);
  - (vertical projects) the profile defaults to a 16:9 / non-square sample aspect.

This rewrites those in place. Opening + re-saving in Kdenlive still finalizes the
full native form (main_bin folders, doc properties), but after this the project
loads and renders without the "fix clips" prompt.

Usage: python3 tools/kdenlive-nativize.py <file.kdenlive> [--vertical]
"""
import re
import sys


def nativize(path: str, vertical: bool) -> None:
    s = open(path, encoding="utf-8").read()

    # 1) producer ids clipN -> producerN (ids and every reference to them)
    s = re.sub(r'\bclip(\d+)"', r'producer\1"', s)

    # 2) root producer -> the existing main timeline tractor
    s = s.replace('producer="kdenlive-cli"', 'producer="maintractor"')

    # 3) unique numeric kdenlive:id on each producer that lacks one
    def add_kid(m: "re.Match[str]") -> str:
        block = m.group(0)
        if "kdenlive:id" in block:
            return block
        n = int(re.search(r"\d+", m.group(1)).group())
        prop = f'\n    <property name="kdenlive:id">{n + 2}</property>'
        return re.sub(r"(<producer id=\"" + re.escape(m.group(1)) + r"\"[^>]*>)",
                      r"\1" + prop, block, count=1)

    s = re.sub(r'<producer id="(producer\d+)"[^>]*>.*?</producer>',
               add_kid, s, flags=re.S)

    # 4) vertical profile: square pixels, 9:16 display (CLI defaults to 16:9)
    if vertical:
        s = re.sub(r'sample_aspect_num="\d+"', 'sample_aspect_num="1"', s)
        s = re.sub(r'sample_aspect_den="\d+"', 'sample_aspect_den="1"', s)
        s = re.sub(r'display_aspect_num="\d+"', 'display_aspect_num="9"', s)
        s = re.sub(r'display_aspect_den="\d+"', 'display_aspect_den="16"', s)

    open(path, "w", encoding="utf-8").write(s)

    # 5) validate: every producer="X" reference resolves to a defined id
    ids = set(re.findall(r'<(?:producer|tractor|playlist) id="([^"]+)"', s))
    refs = set(re.findall(r'producer="([^"]+)"', s))
    missing = refs - ids
    print(f"producers={len(re.findall(r'<producer ', s))} "
          f"kdenlive:id={s.count('kdenlive:id')} "
          f"root={re.search(r'<mlt[^>]*producer=\"([^\"]+)\"', s).group(1)}")
    print("unresolved producer refs:", ", ".join(sorted(missing)) if missing else "none")
    if missing:
        sys.exit(1)


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if not args:
        sys.exit("usage: kdenlive-nativize.py <file.kdenlive> [--vertical]")
    nativize(args[0], "--vertical" in sys.argv)
