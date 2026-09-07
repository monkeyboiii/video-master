"""Read a real episode as a narration job: beats, anchors and the spoken line per beat.

The demo script in `script.py` is a hardcoded table. This reads the same shape out of an actual
episode, so `/auto-narrate` works on the repo's content rather than only on its example.

WHERE EACH FIELD COMES FROM, and why:
  anchors    the cumulative sum of `beats[].target_duration_sec[locale]` in manifest.yml. Those
             numbers were measured off the recorded take, so the anchors are where the beats
             ACTUALLY fall in the cut, not a guess.
  text       `script.<locale>.md`, whose `## <beat-id>` sections map 1:1 to the manifest's beat
             ids by construction — the scripts say so in their own headers.
  zh words   jieba, via misaki, which is already installed and is the SAME segmenter that produced
             the phonemes the durations are attached to. That matters: captions.md rejects a
             segmenter as a second source of truth, and it is right whenever the script declares
             its own word boundaries. These scripts do not — Chinese is written without spaces —
             so the choice is jieba or per-character highlighting, and per-character is the thing
             the whole word-grouping design exists to avoid.
"""
import re
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
VO_MARKERS = ('**VO:**', '**口播:**', '**Read:**')


def find_episode(video_id):
    for m in sorted(REPO.glob('series/S*/E*/manifest.yml')):
        if re.search(rf'^video_id:\s*"{re.escape(video_id)}"', m.read_text(encoding='utf-8'), re.M):
            return m.parent
    raise SystemExit(f'{video_id}: no episode with that video_id')


def beats(ep_dir, locale):
    """[(beat_id, start_sec, target_sec)] — anchors are cumulative, so they land where the cut does."""
    import yaml
    m = yaml.safe_load((ep_dir / 'manifest.yml').read_text(encoding='utf-8'))
    out, clock = [], 0.0
    for b in m.get('beats') or []:
        d = (b.get('target_duration_sec') or {}).get(locale)
        if d is None:
            continue
        out.append((b['id'], clock, float(d)))
        clock += float(d)
    if not out:
        raise SystemExit(f'{ep_dir.name}: no beats carry target_duration_sec for {locale}')
    return out


def lines(ep_dir, locale):
    """{beat_id: spoken text}. A marker on its own line takes the following paragraph."""
    f = ep_dir / f'script.{locale}.md'
    if not f.exists():
        raise SystemExit(f'{f.relative_to(REPO)}: no script for this locale')
    out, beat = {}, None
    rows = f.read_text(encoding='utf-8').splitlines()
    for i, line in enumerate(rows):
        h = re.match(r'^##\s+([a-z0-9][a-z0-9-]*)', line)
        if h:
            beat = h.group(1)
            continue
        if beat is None or beat in out:
            continue
        for mk in VO_MARKERS:
            if not line.startswith(mk):
                continue
            # The line may be on the marker, or the marker may head a BULLET LIST whose items are
            # the beat's successive subtitle segments — "**口播:**" then "- 他的农场…" / "- 两面环山，".
            # Taking only the first bullet reads a third of the beat aloud, which is how this
            # surfaced: three beats narrated as a single clause ending in a comma.
            parts = [line[len(mk):].strip()]
            j = i + 1
            while j < len(rows):
                nxt = rows[j].strip()
                if not nxt or nxt.startswith(('#', '<!--')) or nxt.startswith('**'):
                    break
                parts.append(re.sub(r'^[-*]\s+', '', nxt))
                j += 1
            text = join(p for p in parts if p)
            if text:
                out[beat] = clean(text)
            break
    return out


def join(parts):
    """CJK runs together; Latin needs the space back."""
    parts = list(parts)
    joined = ''.join(parts)
    cjk = sum(1 for c in joined if '\u4e00' <= c <= '\u9fff')
    return ('' if cjk > len(joined) / 4 else ' ').join(parts)


def clean(s):
    """Strip the markdown a voice would otherwise read aloud."""
    s = re.sub(r'\*\*(.+?)\*\*', r'\1', s)
    s = re.sub(r'`([^`]*)`', r'\1', s)
    s = re.sub(r'\[(.+?)\]\([^)]*\)', r'\1', s)
    s = re.sub(r'<!--.*?-->', '', s, flags=re.S)
    return s.strip()


def words_zh(text):
    """Caption units for a line with no declared boundaries. See the module docstring."""
    import jieba
    punct = '，。！？、；：（）“”‘’"\'()!?,.:; \t'
    return [w for w in jieba.cut(text) if w.strip() and not all(c in punct for c in w)]


def load(video_id, locale):
    ep = find_episode(video_id)
    said = lines(ep, locale)
    plan = []
    for bid, start, target in beats(ep, locale):
        if bid in said:
            plan.append({'beat': bid, 'atMs': start * 1000, 'capSec': target, 'text': said[bid]})
    if not plan:
        raise SystemExit(f'{video_id}/{locale}: no beat in the manifest has a line in the script')
    return ep, plan
