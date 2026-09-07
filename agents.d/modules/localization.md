---
kind: note
status: current
summary: en-US and zh-CN as sibling variants, not translations of one another.
---

# Localization Model — en-US / zh-CN as sibling variants

Never this:

```text
English video → translate → Chinese video        ✗
```

Always this:

```text
Shared topic + shared beat IDs
  → English script          (written for English-platform viewers)
  → Chinese localized script (written for Chinese-platform viewers)
  → separate voiceovers
  → separate subtitles
  → shared visual system (Remotion themes/components)
  → variant-specific timing
```

## What variants share (identical by design)

```text
video_id            same episode, same manifest
series              same positioning
beat IDs            same narrative skeleton (hook, problem, conclusion, point-N,
                    experience, checklist, cta)
core message        the one-sentence conclusion is the same claim
visual identity     same Remotion components, theme, sound-effect language
CTA intent          same designed reaction (save / comment / follow)
```

## What variants may differ in (differences are intentional, not drift)

```text
hook wording        each locale gets its own strongest opening
sentence order      argue the way that locale argues
examples            bikes, tracks, prices, regulations local to the audience
idioms & tone       zh-CN uses native internet/riding vocabulary, not translated English
subtitle density    zh-CN reads faster per glyph — fewer, denser lines
duration            per-beat target seconds are set per locale in the manifest
platform caption    written per platform per locale
cover text          re-designed per locale, not re-typeset
```

## Workflow order

1. Beats are defined once in `manifest.yml` (IDs, purpose, visual intent) — locale-neutral.
2. Each locale's script is written **against the beats**, natively, by following
   the script written in that language.
3. Per-beat `target_duration_sec` is set per locale (zh-CN typically runs 10–20% shorter).
4. Voiceover, subtitles, Remotion props, captions, and covers are produced per locale.

## Review bar

A variant fails review if:

- It reads like a translation (calques, English sentence rhythm in zh-CN, or vice versa).
- Its examples are foreign to the audience (US prices in the zh-CN cut, etc.).
- Beat IDs, core message, or CTA intent silently diverged from the sibling.
- Locale files are missing while the manifest claims the variant exists.

## Platform mapping (default)

| Variant | Primary platforms |
|---------|------------------|
| en-US | TikTok, YouTube Shorts, Instagram Reels |
| zh-CN | RedNote 小红书, Douyin, Bilibili (+ WeChat Channels 视频号, opt-in) |

Per-episode overrides go in `manifest.yml` under `variants.<locale>.platforms`.
WeChat Channels is deliberately **not** in the zh-CN defaults: its 6:7 feed crop needs a
dedicated 3:4-composed master (see `agents.d/modules/platforms.md`), so add `wechat` to a variant's
platform list only when that extra deliverable is planned.

## Captions stream differently per locale

The two locales do not share a caption behaviour, and this is the clearest case of variants being
siblings rather than translations:

| | zh-CN | en-US |
|---|---|---|
| line visible | the whole line, from its first frame | only the words already spoken |
| highlight | streams word by word across it | the word just revealed |
| why | Chinese is read by whole-character recognition, faster than it is spoken; showing the line lets a reader read ahead while the highlight holds them to the voice | Latin script is read at roughly speaking pace; a revealed line makes the eye run ahead and wait |
| unit | a WORD — `核心` lights as one, never per character | a word |
| text colour | one colour throughout; only the band lights | text lights with the band |
| timing needed | per character from whisper, grouped to words by `tools/group-words.mjs` against the script | per word |
| measured rate | 4.58 chars/sec (median 180 ms) | ~335 ms per word |

Implemented in `packages/remotion-graphics/src/components/SpokenSubtitle.tsx`, keyed on `locale`
with no override; the reasoning and the band's visual spec are in
[captions.md](captions.md) § The spoken-caption band, and why the two locales stream differently.

**Not done:** the same subtitle burned twice with only the text swapped. That is the translation
model this repo does not use, and it would make one of the two locales read badly.
