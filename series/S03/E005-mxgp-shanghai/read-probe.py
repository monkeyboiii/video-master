import json
import sys

path = sys.argv[1]
with open(path, 'rb') as f:
    raw = f.read()
d = json.loads(raw.decode('utf-8', errors='replace'))
for seg in d.get('transcription', []):
    for w in seg.get('tokens', []):
        t = w.get('text', '').strip()
        if t and not t.startswith('[_'):
            print(w.get('offsets', {}).get('from'), w.get('offsets', {}).get('to'), repr(t))
