---
kind: why
status: current
summary: How episodes, locales, overlays and covers are named. Every tool joins on these.
---

# Naming Conventions

Boring, systematic names. Creativity belongs in the video, not the file system.
`tools/vm check` enforces the patterns below; `tools/validate.mjs` is the in-episode subset.

## Video ID

```text
S{season}E{episode}          S03E003
```

Directory:

```text
series/S{season}/E{episode}-{kebab-slug}/      series/S03/E003-barber-track-day-three/
```

**The season number is the category.** S03 *is* the 100-track challenge; S05 *is* the remedy
series. That is the whole reason the id needs nothing else in it, and why each season carries a
`README.md` saying what it is — the number is only meaningful because that file exists.

| Season | What it is |
|---|---|
| S01 | DirtBikeX app & community |
| S02 | music-synced identity cuts |
| S03 | the 100-track challenge — counted field missions |
| S04 | product & feature introductions |
| S05 | remedy — a re-cut of an episode that underperformed |

- Season and episode are zero-padded: `S03`, `E003`. Episode numbers are per-season and start at
  `E001` (S03 starts at `E000`, which is deliberate — see that season's README).
- Slug is lowercase kebab-case ASCII, ≤ 40 chars, derived from the English title.
- The slug may be refined once before the `scripting` status; after that it is frozen (issues and
  external storage reference it).
- `tools/vm check` enforces that the directory name, the `video_id` and the season agree. They are
  three statements of one fact, and a disagreement means one of them was hand-edited.

**Retired: `DBX-{SERIES}-S..E..`.** Ids used to carry a 3–4 letter series code — `DBX-APP-S03E003`
— against a table of six registered codes. Exactly one was ever used, so the prefix was eight
characters that narrowed nothing on every path in the repo. The season replaced it as the category.
Recorded here rather than deleted so the next reader does not reintroduce it as an improvement:
the prefix is only worth having if two series ever run *concurrently under one season numbering*,
which is not how this repo has ever worked.

**Retired: the one-decimal interstitial (`E002.5`).** A fractional number said an episode published
between two others and took no number of its own. It encoded *when* something shipped and could
never say *what it was*, so the pieces that used it were uncountable as a set — you cannot ask "how
did the companion pieces do" of a scheme that files them as decimals of their parents. They now get
real numbers in a season of their own, and `lineage:` carries what the fraction was standing in for.

## Lineage

An episode may record its relationship to another. Two different facts, deliberately two fields:

```yaml
lineage:
  follows: S03E003        # where it published in the original run
  parent: S03E003         # the episode it ANSWERS — only when it answers one
  relation: remedy        # remedy | inspired-by | followup; needs a parent
  reason: >-
    same topic as S03E003, re-cut after that episode underperformed
```

`follows` is what the fractional number used to encode and is the reason renumbering did not lose
information. `parent` is a claim about *why the episode exists*, which a number never said. Most
episodes have neither; a feature piece may have `follows` and no `parent`. Setting `relation`
without `parent` is an error, not a warning — a relation is to something.

`tools/vm check` verifies both targets exist, that neither points at its own episode, and that the
parent chain does not cycle. `tools/vm link` writes the block so the shape is not hand-typed.

## Locales

Always full BCP-47 tags: `en-US`, `zh-CN`. Never `en`, `cn`, `chinese`.

## Media filenames are RECORDED, not DERIVED

This is the rule that made the season migration cheap, and it is worth stating as a rule rather
than as a migration note.

`manifest.yml` carries every asset's `filename:` explicitly. The id and the filename were therefore
never actually coupled — the old patterns merely made them look coupled by starting every example
with `{VIDEO_ID}_`. Enforcing that coupling would have meant renaming every VO, export, overlay and
cover on the MacBook and in external storage to match a new id, for no gain: nothing derives a
media path from `video_id`, everything reads the manifest.

So the patterns below pin the parts that carry meaning — locale, aspect, platform, version, stage —
and accept any prefix, or none. Files already on disk keep their `DBX-APP-S03E003_…` names and are
still valid. New ones may be short, because they live under their episode already.

## Shot files (raw footage)

```text
[{anything}_]SH{shot}_TK{take}_{camera-or-content}.{ext}
```

```text
DBX-APP-S01E003_SH010_TK01_gopro-front.MP4     # already on disk — still valid
SH010_TK01_gopro-front.MP4                     # equally valid for a new file
SH020_TK02_facecam.MP4
```

Shot numbers step by 10 (`SH010`, `SH020`) so pickups can slot between (`SH015`).

## Voiceover files

```text
[{anything}_]{locale}_vo_v{version}.wav
zh-CN_vo_v001.wav
```

## Generated overlays (Remotion output)

```text
[{anything}_]{locale}_{aspect}_{composition}_v{version}.{ext}
en-US_9x16_hook-title_v001.mov
zh-CN_9x16_checklist-card_v001.mov
```

## Covers (Remotion stills or exported frames)

```text
[{anything}_]{locale}_{platform}_{aspect}_cover_v{version}.png
zh-CN_rednote_3x4_cover_v001.png
```

## Kdenlive timelines

```text
[{anything}_]{locale}_v{version}.kdenlive
en-US_v003.kdenlive
```

## Exports (final renders)

```text
[{anything}_]{locale}_{platform}_{aspect}_v{version}_{stage}.mp4
en-US_tiktok_9x16_v001_review.mp4
zh-CN_rednote_9x16_v002_final.mp4
```

`stage` is `review` (internal check) or `final` (uploaded).

## General rules

- Aspect tokens: `9x16`, `16x9`, `1x1`, `3x4`, and `16x10` (covers only — Bilibili
  requires a 16:10 cover image).
- Platform tokens: `tiktok`, `ytshorts`, `reels`, `rednote`, `douyin`, `bilibili`,
  `wechat` (see [platforms.md](platforms.md)).
- Versions are `v001`-style, monotonically increasing, never reused, never deleted from
  the manifest history.
- Asset IDs inside `manifest.yml` (`RAW_001`, `SEL_001`, `VO_EN_001`) are unique within
  one episode and never renumbered.
- `video_id` never appears in a media filename as a *requirement*. It may appear, and on every
  file produced before 2026-09-07 it does.
- Underscores separate fields; hyphens live inside a field (`gopro-front`). Nothing else.
