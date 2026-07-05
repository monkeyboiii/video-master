# Publishing Checklist

Walk this checklist once **per export, per platform**. It is the last gate between QC
(`skills/08-audio-render-qc.md`) and a live post; a `final` export is not uploaded until
its platform's section is complete. Specs referenced here live in
[platforms.md](platforms.md) — if the two ever disagree, platforms.md wins and this doc
gets fixed.

## 1. Pre-publish gates (all platforms)

Do not proceed to upload until every box is checked:

- [ ] **QC PASS recorded.** `edit-notes.md` has a `## QC <filename>` block for this exact
      file with all 11 checks, measured values, and verdict `PASS` or `PASS-WITH-NOTES`
      (`skills/08-audio-render-qc.md`). A FAIL on any technical check blocks `final`
      renaming, no exceptions.
- [ ] **File named as a final export** per
      [naming-conventions.md](naming-conventions.md):
      `{VIDEO_ID}_{locale}_{platform}_{aspect}_v{version}_final.mp4`. Platform and aspect
      tokens match the target (e.g. `wechat_3x4`, not a recycled `9x16` name).
- [ ] **Manifest current.** `manifest.yml outputs.exports` lists this file;
      `node tools/validate.mjs` passes.
- [ ] **Cover locked.** The skills/02 post-edit pass is done: final cover chosen from
      real footage, stills rendered and recorded in `manifest.yml outputs.covers`, named
      `{VIDEO_ID}_{locale}_{platform}_{aspect}_cover_v{version}.png`. Exception:
      `ytshorts` has no cover upload — the designed first frame stands in; note the
      chosen frame in `cover.<locale>.md` instead.
- [ ] **Caption/title drafted and within limits** for this platform and locale (numbers
      in section 2). Hook in the visible portion; hashtags counted toward the limit where
      the platform counts them.
- [ ] **Subtitles inside the safe zone** — QC check 8 passed against the platform's
      region in [platforms.md](platforms.md); nothing under the action rail or caption
      zone.
- [ ] **Duration under the platform max** (QC check 4) — hard-check, not assumption.

## 2. Per-platform upload steps

### TikTok (`tiktok`)

- [ ] Upload via **desktop** if using a custom cover image; in-app allows frame-select
      only. Cover text center-weighted (profile grid crops to ~3:4).
- [ ] Caption ≤ 4000 chars, hook in the first line (~1 line visible before "more");
      remaining space used as keyword-rich search description.
- [ ] Cover remains editable ~7 days post-publish — fixable, but aim to lock before.

### YouTube Shorts (`ytshorts`)

- [ ] Upload as 9:16 ≤ 3 min so it auto-classifies as a Short (`#Shorts` tag not
      needed).
- [ ] **Frame-select the designed thumbnail frame in the mobile app at upload time** —
      no custom upload, no desktop selection, no post-publish change. This is the only
      moment to get the cover right.
- [ ] Title ≤ 100 chars with the promise in the first ~40 (mobile shelf truncation);
      description ≤ 5000 chars.
- [ ] Attach the related long-form video if this Short funnels to one.

### Instagram Reels (`reels`)

- [ ] Upload the clean Remotion/Kdenlive export — never a downloaded TikTok file
      (watermarks are downranked).
- [ ] Upload custom cover; verify focal point + text read inside the central 3:4 grid
      crop.
- [ ] Caption ≤ 2200 chars, hook in the first ~125 (visible before "… more");
      ≤ 30 hashtags.
- [ ] Confirm Facebook crossposting setting is as intended.

### RedNote 小红书 (`rednote`)

- [ ] Upload the 3:4 master (1080x1440); keep file under 300 MB for fast processing.
- [ ] Upload the 3:4 text-forward cover (题图大字) — the cover is the headline in the
      waterfall feed.
- [ ] **Title ≤ 20 CJK chars, written as search keywords** — this is the main
      search/CTR lever, not a slogan.
- [ ] Body ≤ 1000 chars including topics; ~10 topics is the practical norm.

### Douyin 抖音 (`douyin`)

- [ ] Publish via the **web 创作服务平台**, not the app: enables the HD toggle, custom
      cover upload, and scheduled publishing.
- [ ] Enable HD; confirm the source export is ≥ 8 Mbps (QC value) to survive
      recompression.
- [ ] Upload custom cover: key art/text inside the central 1080x1350; cover title ~10
      CJK chars, large type.
- [ ] Caption: hook in the first 15–20 CJK chars (in-app truncates around ~40; only the
      first line shows before 展开); web allows up to ~1000.
- [ ] Add location/POI tag and assign to the series 合集.

### Bilibili 哔哩哔哩 (`bilibili`)

- [ ] Upload via member.bilibili.com; 16:9 exports go to the main feed, 9:16 exports
      route into Story Mode.
- [ ] Upload the 16:10 cover (1146x717 recommended; 1920x1200 fine; JPG/PNG < 5 MB, no
      animation) — required, bold-text norm, must match content.
- [ ] Title ≤ 80 CJK chars; description ~2000 chars (confirm limit in creator center);
      ≤ 10 tags; select the 分区 category.
- [ ] Declare 自制 (original) — affects creator incentives.
- [ ] Confirm no critical burned-in text in the top third (danmaku overlay).

### WeChat Channels 视频号 (`wechat`)

- [ ] Publish via the PC 视频号助手 (channels.weixin.qq.com) — needed for custom cover,
      scheduling, and 1080p retention.
- [ ] Confirm the export is the 3:4/center-composed variant: everything critical inside
      the 6:7 (1080x1260) feed crop. **Do not upload an uncomposed 9:16 master.**
- [ ] Upload or frame-select the cover designed for the 6:7 crop; verify the first frame
      is meaningful (fallback covers can render black).
- [ ] Optional display title 6–16 chars (surfaces in search/shares); description ≤ ~1000
      chars, hook in the first ~3 lines (feed auto-folds).
- [ ] Attach linked 公众号 article / location if relevant.

## 3. Post-publish (all platforms)

- [ ] Record each live post in `manifest.yml` under `outputs.published.<locale>` as
      `{platform, export, url, date}` (date `YYYY-MM-DD`); set `status: published` once
      all planned platforms for the variant are live. Run `node tools/validate.mjs` —
      it requires these entries at `status: published`.
- [ ] **Schedule the metric capture** for `review.md` (`skills/09-review-retrospective.md`):
      views, average watch time, completion, saves/comments/follows — recorded per
      variant per platform **with the capture date**. Metrics without dates are
      worthless.
- [ ] Note any platform-side deviations (recompression artifacts, cover replaced,
      caption edited after publish) in `edit-notes.md` so the retrospective sees them.

Remember golden rule 7: no next episode of a series is scripted until the published
episode has a `review.md` with real metrics.
