# Platforms — delivery specs and safe zones

This is the reference for every platform DirtBikeX publishes to: formats, durations,
safe zones, cover mechanics, and caption limits. QC (`skills/08-audio-render-qc.md`)
hard-checks exports against this doc, and the publishing checklist
([publishing-checklist.md](publishing-checklist.md)) walks it per upload. Two repo rules
derive from it:

1. **Every deliverable names its platform.** Exports and covers carry a platform token
   from the table below, per [naming-conventions.md](naming-conventions.md) — there is no
   such thing as a "generic" final export.
2. **Safe zones are baked into the design system, not eyeballed per edit.** Remotion
   components position text against the shared safe-zone constants; editors and QC verify
   against the same numbers in this doc.

Specs verified **2026-07-05** from current platform documentation and creator-tool
behavior. See "When specs change" at the bottom.

## Summary

| Token | Platform | Primary aspect | Resolution | Sweet spot | Max duration | Separate cover upload? |
|-------|----------|---------------|------------|-----------|--------------|------------------------|
| `tiktok` | TikTok | `9x16` | 1080x1920 | 21–34 s | 10 min in-app / 60 min web | Yes (desktop only; frame-select in app) |
| `ytshorts` | YouTube Shorts | `9x16` | 1080x1920 | 15–45 s | 3 min | **No** — frame-select only |
| `reels` | Instagram Reels | `9x16` | 1080x1920 | 7–30 s (≤ 90 s for reach) | 3 min | Yes |
| `rednote` | RedNote 小红书 | `3x4` | 1080x1440 | 15–60 s (tutorials 3–5 min) | 15 min | Yes — expected, text-forward |
| `douyin` | Douyin 抖音 | `9x16` | 1080x1920 | 15–60 s (≤ 34 s new account) | 30 min | Yes (web uploader) |
| `bilibili` | Bilibili 哔哩哔哩 | `16x9` | 1920x1080 | 3–15 min | Multi-hour (no short cap) | Yes — required, 16:10 |
| `wechat` | WeChat Channels 视频号 | `3x4` (6:7 feed crop) | 1080x1440 | ≤ 60 s (tutorials 1–3 min) | 60 min (PC assistant) | Yes (PC assistant) |

Locale mapping follows [localization.md](localization.md): **en-US** →
`tiktok` / `ytshorts` / `reels`; **zh-CN** → `rednote` / `douyin` / `bilibili` /
`wechat`. Per-episode overrides live in `manifest.yml` under
`variants.<locale>.platforms`.

## The universal 9:16 safe zone

Every 9:16 platform overlays chrome on the same regions: top nav/search bar, right-side
action rail (like/comment/share), bottom caption + music + progress area. The repo uses
one conservative rule that satisfies all of them:

> On a 1080x1920 frame, critical content and burned-in text stay inside a central
> **~880x1340** region — top **~150 px**, bottom **~430 px**, and right **~145 px** are
> reserved by platform chrome.

This region is encoded as `SAFE_ZONE` in
`packages/remotion-graphics/src/theme/tokens.ts`. Remotion components consume it; QC
check 8 (`skills/08-audio-render-qc.md`) verifies against it. Platform-native text tools
respect their own chrome automatically — **burned-in** Remotion text is our
responsibility.

Two platforms need more than the universal rule: RedNote's discovery feed crops 9:16 to
the central 3:4, and WeChat's feed crops to the central 6:7. Details per platform below.

## TikTok (`tiktok`) — en-US

| Spec | Value |
|------|-------|
| Aspect | 9:16 strongly preferred; 1:1 / 16:9 accepted but bar-boxed and underperform |
| Resolution | 1080x1920; playback capped at 1080p (4K gets downscaled); H.264/AAC MP4 |
| Upload size | ~288 MB iOS / ~72 MB Android in-app; up to 4 GB via web |
| Duration | 10 min in-app, 60 min via web; algorithm sweet spot ~21–34 s, under 60 s safest |
| Safe zone | Right ~110–140 px (action rail, lower two-thirds); bottom ~320–420 px; top ~130–150 px — covered by the universal `SAFE_ZONE` |

**Cover.** 9:16 at 1080x1920, same frame as the video. In-app upload is frame-select
only; custom image upload requires the desktop uploader. Cover is editable ~7 days after
posting (varies by region). Profile grid crops covers to roughly 3:4 — keep cover text
center-weighted.

**Caption.** 4000 characters; only ~1 line visible before "more". Hashtags count toward
the limit.

Notes for DirtBikeX:

- en-US flagship. Front-load the hook in the visible first line, then use the remaining
  4000 chars as keyword-rich search description — TikTok search indexes captions.
- The same 9:16 master serves Douyin with swapped zh-CN text layers (sibling variants,
  not translations — [localization.md](localization.md)).

## YouTube Shorts (`ytshorts`) — en-US

| Spec | Value |
|------|-------|
| Aspect | 9:16; anything square-to-vertical ≤ 3 min is auto-classified as a Short (16:9 becomes a regular video) |
| Resolution | 1080x1920 recommended (up to 4K accepted); MP4 H.264 |
| Duration | 3 min max (extended from 60 s, Oct 2024); sweet spot 15–45 s; loop-friendly edits boost retention |
| Safe zone | Right action rail lower half; bottom ~15–20% (title, handle, subscribe, sound); top ~10% — covered by the universal `SAFE_ZONE` |

**Cover.** **No custom thumbnail upload.** Frame-select only, mobile app only, at upload
time only — not desktop, not after publishing. Plan a designed "thumbnail frame" into the
video itself (a clean title card ~1 s in) and pick it at upload. Grid/shelf displays at
9:16.

**Caption.** Title 100 chars (~40 visible on the mobile shelf); description 5000 chars.
`#Shorts` hashtag no longer required — classification is automatic by format.

Notes for DirtBikeX:

- Since there is no cover upload, bake the "cover" into the first frames of the Remotion
  comp — this is the one platform where the cover hypothesis (skills/02) ships inside the
  video file.
- Shorts traffic funnels to long-form on the same channel: end-cards pointing at full
  ride videos work, and related-video linking lets a Short attach a long-form video.

## Instagram Reels (`reels`) — en-US

| Spec | Value |
|------|-------|
| Aspect | 9:16 full-bleed; feed preview crops to 4:5; profile grid crops to 3:4 (changed from 1:1, Jan 2025) |
| Resolution | 1080x1920; 30 fps standard (60 fps accepted but compressed harder); max ~4 GB; MP4 H.264/AAC |
| Duration | 3 min max (since Jan 2025); ≤ 90 s remains the safer reach zone; hook-driven 7–30 s clips perform best |
| Safe zone | Top ~250 px (audio/camera header); bottom ~420 px (username, caption, audio ticker); right ~110–150 px — covered by the universal `SAFE_ZONE`; additionally keep critical content inside the central 4:5 for the feed-preview crop |

**Cover.** Custom cover upload from camera roll supported, at post time and editable
later (grid thumbnails can also be re-edited retroactively). Design at 1080x1920 but keep
the focal point and any cover text inside the central 3:4 (~1013x1350 grid crop), ideally
the central 1:1 for legacy surfaces.

**Caption.** 2200 chars; ~125 chars visible before "… more"; max 30 hashtags.

Notes for DirtBikeX:

- Render a clean per-platform export from Remotion/Kdenlive — Instagram downranks
  visible TikTok watermarks, so never re-upload a downloaded TikTok file.
- Crossposting to Facebook is automatic if enabled; no separate deliverable needed.

## RedNote 小红书 (`rednote`) — zh-CN

| Spec | Value |
|------|-------|
| Aspect | **3:4 is platform-native** (the discovery feed is a two-column waterfall of 3:4 cards); 9:16 supported and plays full-screen; 16:9 deprioritized in feed |
| Resolution | 1080x1440 (3:4) or 1080x1920 (9:16); 1080p is the sweet spot — 2K/4K accepted with negligible gain; file limit ~1 GB, keep under 300 MB for fast processing |
| Duration | Up to 15 min standard accounts; sweet spots: 15–60 s lifestyle clips, 2–4 min reviews, 3–5 min tutorials |
| Safe zone | Two zones: (1) **feed crop** — anything outside the central 3:4 of a 9:16 video is invisible in the discovery card; (2) full-screen — right ~12–15% (action rail), bottom ~20% (title + caption + topics), top ~8% |

**Cover.** Separate cover upload fully supported and heavily used. 3:4 vertical at
1080x1440 is the strong norm. Big text-overlay covers (题图大字) are the dominant
convention — the cover functions as a clickable headline in the waterfall feed.

**Caption.** Title: **20 CJK chars, hard limit** — and the main search/CTR lever. Body:
1000 chars standard; hashtags/topics count toward the body; ~10 topics is the practical
norm.

Notes for DirtBikeX:

- Discovery is search-heavy: write the 20-char title as SEO keywords a rider would
  actually search (车型 + 问题 + 结论), not as a slogan.
- The 笔记 framing rewards useful/informational angles — gear reviews, riding-spot
  guides, maintenance checklists outperform pure hype. This matches our golden rules.
- A 3:4 cover with bold Chinese title text is non-negotiable for feed CTR. A mainland
  phone number is needed to register; overseas accounts work but get region-tagged.

## Douyin 抖音 (`douyin`) — zh-CN

| Spec | Value |
|------|-------|
| Aspect | 9:16 dominates (> 85% of feed traffic); 16:9 letterboxed in feed; 1:1 rare |
| Resolution | 1080x1920 recommended; up to 4K and HDR10+ via web uploader (创作服务平台); bitrate ≥ 8 Mbps, H.264 preferred, to survive recompression |
| Duration | Up to 30 min; ordinary shorts best at 15–60 s; completion rate rules the algorithm, so under ~34 s is safest for a new account |
| Safe zone | Right ~15% from mid-height down (action rail); bottom ~20–25% (handle, caption, music ticker, progress); top ~8% — covered by the universal `SAFE_ZONE`; Chinese design guides recommend the centered 1080x1350 region |

**Cover.** Frame-select in app; custom image upload via the web 创作服务平台. Design at
1080x1920 with key art and text inside the central 1080x1350 (profile grid and feed
cards crop to ~3:4). Cover title text: ~10 CJK chars, large type.

**Caption.** In-app caption truncates around ~40 CJK chars; the web uploader allows up to
~1000, but only the first line shows before 展开 — put the hook in the first 15–20
chars. #话题 hashtags count toward the caption.

Notes for DirtBikeX:

- **Always publish via the web uploader** (创作服务平台): HD toggle, custom cover, and
  scheduled publishing are web-only. Transcode is aggressive — export high bitrate
  (QC's ≥ 8 Mbps floor exists for this).
- Location/POI tagging and 合集 (series collections) help dirt-bike niche
  discoverability — map 合集 to our series codes.
- Mainland phone number + ID verification + mainland IP are effectively required. This is
  the zh-CN twin of the TikTok output: same 9:16 master, re-localized text layers.

## Bilibili 哔哩哔哩 (`bilibili`) — zh-CN

| Spec | Value |
|------|-------|
| Aspect | **16:9 horizontal is the native norm** (long-form PUGC culture); 9:16 supported, routed into Story Mode (vertical feed) |
| Resolution | 1920x1080 standard, up to 4K/8K for higher tiers; bitrate ≥ 6000 kbps for 1080p, ≥ 20000 kbps for 4K; H.264/H.265 MP4/MOV |
| Duration | Effectively long-form — multi-hour uploads allowed, no short-video cap; community norm 3–15 min horizontal; Story Mode clips typically under 3–5 min |
| Safe zone | 16:9 playback has minimal chrome, but **danmaku bullet comments overlay the top half** — avoid critical text in the top third. Vertical Story Mode mirrors Douyin chrome; reuse the universal 9:16 `SAFE_ZONE` |

**Cover.** Separate cover upload required/expected: recommended 1146x717 px, **16:10
ratio** (1920x1200 also fine), JPG/PNG under 5 MB, no animation. Cover-with-bold-text is
the CTR norm, and the cover must relate to video content per submission rules. Story Mode
posts still surface the 16:10 cover on search/space pages.

**Caption.** Title max 80 CJK chars; description (简介) supports long text (~2000 chars —
confirm in the creator center at upload); up to 10 tags; 分区 category selection is
required.

Notes for DirtBikeX:

- This is the zh-CN **long-form home**: 16:9 ride films, builds, and multi-minute
  tutorials belong here, with vertical shorts cross-posted into Story Mode.
- Danmaku culture rewards moments designed for audience reaction — plan a comment-bait
  beat, and keep the top third clear of burned-in text so danmaku doesn't collide.
- Declare 自制 (original) vs 转载 (repost) correctly — it affects creator incentives.
  Upload via the member.bilibili.com web uploader.

## WeChat Channels 视频号 (`wechat`) — zh-CN

| Spec | Value |
|------|-------|
| Aspect | Feed card displays **6:7** (1080x1260) for vertical — full 9:16 uploads get top/bottom cropped in feed; native 6:7 or 3:4 masters avoid surprise crops; 16:9 displays at 1080x608 |
| Resolution | 1080 wide standard; up to 2 GB / 1 hour via the PC 视频号助手 (channels.weixin.qq.com); MP4 H.264; recompression is heavy — export high bitrate |
| Duration | Up to 60 min via the PC assistant; sweet spot under 60 s for feed distribution; knowledge/tutorial content sustains 1–3 min |
| Safe zone | The critical zone is the **6:7 center crop**: on a 1080x1920 master only the middle ~1080x1260 is guaranteed visible in feed. Full-screen adds bottom ~20% (account, caption, interaction bar) and a right rail on the lower half |

**Cover.** Frame-select or custom upload in the PC assistant; design for the 6:7
(1080x1260) feed crop. Make the first frame meaningful — missing covers fall back to
frame 1 and can render black. An optional short display title (标题, roughly 6–16 chars)
surfaces in search and shares.

**Caption.** Description up to ~1000 chars, auto-folds after ~3 lines in feed —
front-load the hook. #topics and @mentions supported; a linked 公众号 article and
location can be attached.

Notes for DirtBikeX:

- **The one platform where a straight 9:16 master is not safe.** Render a dedicated
  `3x4` variant from Remotion (it pairs with the RedNote 3:4 master) or strictly
  center-compose the 9:16 for the 6:7 crop.
- Distribution is social-graph-first: shares into chats/Moments drive cold-start, so
  shareability (save-worthy checklists, "send this to your riding buddy" framing) beats
  algorithm-bait.
- A mainland-verified WeChat account is required; use the PC 视频号助手 for scheduling,
  covers, and 1080p retention.

## When specs change

Platform chrome, crops, and limits shift roughly quarterly. When any spec here is found
stale:

1. Update this doc **and** `SAFE_ZONE` in
   `packages/remotion-graphics/src/theme/tokens.ts` in the same change — they must never
   disagree.
2. Update the "verified" date at the top of this doc with the check date.
3. If a duration or caption limit changed, sweep
   [publishing-checklist.md](publishing-checklist.md) for the same numbers.

Last verified: **2026-07-05**.
