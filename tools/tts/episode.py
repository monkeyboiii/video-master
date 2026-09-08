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
# A beat whose audio is LIFTED, not synthesised — a person saying the line on camera. It still
# needs a caption, so it stays in the plan; the synthesiser is what skips it. A beat with NO
# marker at all is different and is still dropped entirely: that is a picture beat, which wants
# no caption either. Both keep their target_duration_sec, so neither shifts the beats after it.
SOURCE_MARKERS = ('**原声:**', '**Source:**')
ALL_MARKERS = VO_MARKERS + SOURCE_MARKERS


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
    """{beat_id: (text, spans, is_spoken, offset_sec)}. A marker takes the following paragraph."""
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
        for mk in ALL_MARKERS:
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
            # `**原声:** (+0.14) 中国人能飞。` — a sourced line does not necessarily start on the
            # beat. Here the bed is cut in on a clap at 42.99s in the source and the voice comes
            # 0.14s behind it (measured by centre-channel energy: the clap is a broadband HF
            # transient, the vocal is sustained mid). Without this the caption lands on the clap
            # and reads early against the voice. It sits beside the line rather than in the
            # manifest because it is a fact about THIS line in THIS take.
            off = 0.0
            mo = re.match(r'^\(\+([0-9.]+)\)\s*', text)
            if mo:
                off = float(mo.group(1))
                text = text[mo.end():]
            if text:
                cleaned, spans = emphasis(clean(text))
                out[beat] = (cleaned, spans, mk in VO_MARKERS, off)
            break
    return out


def join(parts):
    """CJK runs together; Latin needs the space back."""
    parts = list(parts)
    joined = ''.join(parts)
    cjk = sum(1 for c in joined if '\u4e00' <= c <= '\u9fff')
    return ('' if cjk > len(joined) / 4 else ' ').join(parts)


BOLD = re.compile(r'\*\*(.+?)\*\*')


def emphasis(s):
    """(text with the ** removed, [(start, end)] of what was bold) — character ranges.

    THE SCRIPTS ALREADY DECLARE THEIR OWN EMPHASIS. `我**不允许**你们不晓得` says which words the
    sentence is about, in the sentence, where the writer put it — and `clean()` deleted it. So an
    episode's captions came out with no important word at all (build-narration.py's zh path found
    no `*` on a jieba word, and its en path set `imp` to an empty set outright), while the demo
    script in script.py declared its list by hand in a second table.

    Reading the bold here is the whole of "auto highlight": one statement of emphasis rather than
    two that drift. Offsets rather than string matching, because a word can repeat in a line —
    `我不允许你们不晓得` has two 不 and only the first is bold.
    """
    out, spans, pos = [], [], 0
    for m in BOLD.finditer(s):
        out.append(s[pos:m.start()])
        start = sum(len(x) for x in out)
        out.append(m.group(1))
        spans.append((start, start + len(m.group(1))))
        pos = m.end()
    out.append(s[pos:])
    return ''.join(out), spans


def clean(s):
    """Strip the markdown a voice would otherwise read aloud. Bold is emphasis()'s, not ours."""
    s = re.sub(r'`([^`]*)`', r'\1', s)
    s = re.sub(r'\[(.+?)\]\([^)]*\)', r'\1', s)
    s = re.sub(r'<!--.*?-->', '', s, flags=re.S)
    return s.strip()


def words_zh(text, spans=()):
    """Caption units for a line with no declared boundaries. See the module docstring.

    A word overlapping a bold span comes back with the trailing `*` that build-narration.py
    already reads as "this one lights its text too" — so the highlight rides the existing row
    format and nothing downstream changes. `tokenize` is the same segmentation `cut` gives,
    with the offsets the span test needs.
    """
    import jieba
    punct = '，。！？、；：（）“”‘’"\'()!?,.:;…—～·《》【】 \t'
    # CUT AT EVERY EMPHASIS BOUNDARY FIRST. The bold is a boundary the writer declared, and jieba
    # crosses it: 中国人**能飞** segments as 中国|人能|飞 — it invents 人能, which is not a word, and
    # splits the emphasis across two units so the highlight lands on half of each. Segmenting
    # 中国人 and 能飞 separately gives 中国|人|能飞: the emphasis is one unit and nothing is
    # invented. captions.md is explicit that a segmenter must not be a second source of truth
    # wherever the script declares its own boundaries — the bold is the one place it does.
    edges = sorted({0, len(text)} | {x for lo, hi in spans for x in (lo, hi)})
    out = []
    for a, b in zip(edges, edges[1:]):
        hot = any(a >= lo and b <= hi for lo, hi in spans)
        for w in jieba.cut(text[a:b]):
            if not w.strip() or all(c in punct for c in w):
                continue
            out.append(w + '*' if hot else w)
    return out


def important_en(text, spans):
    """The bold words, lowercased — what build-narration.py matches its own tokens against."""
    return {w.lower().strip('.,!?') for lo, hi in spans for w in text[lo:hi].split() if w.strip()}


def load(video_id, locale):
    ep = find_episode(video_id)
    said = lines(ep, locale)
    plan = []
    for bid, start, target in beats(ep, locale):
        if bid not in said:
            continue                      # a picture beat: no marker, no caption, clock unmoved
        text, spans, spoken, off = said[bid]
        plan.append({'beat': bid, 'atMs': start * 1000, 'capSec': target, 'text': text,
                     'speak': spoken, 'spans': spans, 'offset': off})
    if not plan:
        raise SystemExit(f'{video_id}/{locale}: no beat in the manifest has a line in the script')
    return ep, plan
