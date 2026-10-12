#!/usr/bin/env bash
# Composite the caption master onto the operator's HLG/BT.2020 cut without flattening it (O117).
#   composite-hlg.sh BASE.mp4 CAPTIONS.mov OUT.mp4
# The captions are sRGB; a BT.2408 LUT maps them into HLG (SDR white -> 75% signal), the overlay
# happens in yuv444p10 on the BT.2020 matrix, and the encode carries the base's HLG tags.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LUT="$(mktemp --suffix=.cube)"; trap 'rm -f "$LUT"' EXIT
"${DBX_TTS_DIR:-$HOME/.cache/dbx-tts}/venv/bin/python" "$HERE/sdr2hlg_lut.py" "$LUT" >/dev/null
ffmpeg -y -v error -i "$1" -i "$2" -filter_complex \
  "[1:v]scale=in_color_matrix=bt709:in_range=tv,format=gbrap16le,lut3d=file=$LUT:interp=tetrahedral,scale=out_color_matrix=bt2020:out_range=tv,format=yuva444p10le[cap];[0:v]format=yuv444p10le[base];[base][cap]overlay=format=yuv444p10:eof_action=pass,format=yuv420p10le[v]" \
  -map "[v]" -map 0:a -c:a copy -c:v libx265 -preset medium -crf 18 -pix_fmt yuv420p10le -tag:v hvc1 \
  -color_primaries bt2020 -color_trc arib-std-b67 -colorspace bt2020nc -color_range tv \
  -x265-params "colorprim=bt2020:transfer=arib-std-b67:colormatrix=bt2020nc:range=limited:log-level=error" \
  -movflags +faststart "$3"
