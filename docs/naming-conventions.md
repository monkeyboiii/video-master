# Naming Conventions

Boring, systematic names. Creativity belongs in the video, not the file system.
`tools/validate.mjs` enforces the patterns below.

## Video ID

```text
DBX-{SERIES}-S{season}E{episode}
```

Directory name adds the slug:

```text
DBX-{SERIES}-S{season}E{episode}-{kebab-slug}
```

Examples:

```text
DBX-BEG-S01E001-first-bike-choice
DBX-GEAR-S01E002-basic-gear-checklist
DBX-TRK-S01E001-how-track-owners-get-found
```

- Season and episode are zero-padded: `S01`, `E001`.
- Slug is lowercase kebab-case ASCII, ≤ 40 chars, derived from the English title.
- The slug may be refined once before the `scripting` status; after that it is frozen
  (issues, filenames, and external storage reference it).

## Series codes

| Code | Series |
|------|--------|
| BEG  | Beginner rider |
| GEAR | Gear and maintenance |
| TRK  | Track owners / stewards |
| LOC  | Riding locations |
| APP  | DirtBikeX app & community |
| NEWS | Dirt-bike news / reactions |

New series = new code: 3–4 uppercase letters, registered in that series' `series.yml`
and added to this table in the same PR.

## Locales

Always full BCP-47 tags: `en-US`, `zh-CN`. Never `en`, `cn`, `chinese`.

## Shot files (raw footage)

```text
{VIDEO_ID}_SH{shot}_TK{take}_{camera-or-content}.{ext}
```

```text
DBX-BEG-S01E003_SH010_TK01_gopro-front.MP4
DBX-BEG-S01E003_SH020_TK02_facecam.MP4
DBX-BEG-S01E003_SH030_TK01_clutch-closeup.MP4
```

Shot numbers step by 10 (`SH010`, `SH020`) so pickups can slot between (`SH015`).

## Voiceover files

```text
{VIDEO_ID}_{locale}_vo_v{version}.wav
DBX-BEG-S01E003_zh-CN_vo_v001.wav
```

## Generated overlays (Remotion output)

```text
{VIDEO_ID}_{locale}_{aspect}_{composition}_v{version}.{ext}
DBX-BEG-S01E003_en-US_9x16_hook-title_v001.mov
DBX-BEG-S01E003_zh-CN_9x16_checklist-card_v001.mov
```

## Covers (Remotion stills or exported frames)

```text
{VIDEO_ID}_{locale}_{platform}_{aspect}_cover_v{version}.png
DBX-BEG-S01E003_zh-CN_rednote_3x4_cover_v001.png
```

## Kdenlive timelines

```text
{VIDEO_ID}_{locale}_v{version}.kdenlive
DBX-BEG-S01E003_en-US_v003.kdenlive
```

## Exports (final renders)

```text
{VIDEO_ID}_{locale}_{platform}_{aspect}_v{version}_{stage}.mp4
DBX-BEG-S01E003_en-US_tiktok_9x16_v001_review.mp4
DBX-BEG-S01E003_zh-CN_rednote_9x16_v002_final.mp4
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
- Underscores separate fields; hyphens live inside a field (`gopro-front`). Nothing else.
