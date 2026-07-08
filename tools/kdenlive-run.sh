#!/bin/bash
# Run a .repl command script through cli-anything-kdenlive and verify it exported.
#
# Why this exists: cli-anything-kdenlive is stateful ONLY inside its REPL, and the REPL
# refuses a pipe — given non-TTY stdin it prints "Warning: Input is not a terminal", runs
# NOTHING, and exits 0. A `foo.repl | cli-anything-kdenlive` therefore looks like it worked
# and silently leaves the previous .kdenlive in place. Its subcommands aren't an escape
# hatch either: each invocation loads the project file and discards its mutations, so
# `bin import` followed by `timeline add-clip` fails with "Track not found: 0".
#
# The only working non-interactive path is to hand the REPL a pty. script(1) makes one.
#
# Usage:  tools/kdenlive-run.sh <path/to/build.repl>     # run from inside the media bundle
#         CLI=/path/to/cli-anything-kdenlive tools/kdenlive-run.sh ...
#
# Remember: cli-anything-kdenlive emits RELATIVE media paths, so run it from inside the
# media bundle; and its raw MLT is not Kdenlive-native — pipe the result through
# tools/kdenlive-nativize.py <file> --vertical before opening it.
set -euo pipefail

repl=${1:?usage: kdenlive-run.sh <build.repl>}
[ -f "$repl" ] || { echo "kdenlive-run: no such repl: $repl" >&2; exit 1; }
CLI=${CLI:-cli-anything-kdenlive}
command -v "$CLI" >/dev/null || { echo "kdenlive-run: $CLI not on PATH (uv tool install cli-anything-kdenlive)" >&2; exit 1; }

# what is this script supposed to write?
out=$(sed -n 's/^[[:space:]]*export xml .*-o[[:space:]]\+\([^[:space:]]\+\).*/\1/p' "$repl" | tail -1)
[ -n "$out" ] || { echo "kdenlive-run: $repl has no 'export xml -o <file>' line" >&2; exit 1; }
before=""; [ -f "$out" ] && before=$(md5sum "$out" | cut -d' ' -f1)

tmp=$(mktemp)
trap 'rm -f "$tmp"' EXIT
{ cat "$repl"; echo quit; } > "$tmp"
script -qec "$CLI" /dev/null < "$tmp" > /dev/null

[ -f "$out" ] || { echo "kdenlive-run: $CLI did not write $out" >&2; exit 1; }
after=$(md5sum "$out" | cut -d' ' -f1)
if [ -n "$before" ] && [ "$before" = "$after" ]; then
  echo "kdenlive-run: WARNING — $out is byte-identical to before the run." >&2
  echo "  Either the repl is unchanged, or the REPL silently no-op'd. Verify." >&2
fi
echo "kdenlive-run: wrote $out"
