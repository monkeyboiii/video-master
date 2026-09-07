# Season 1 — What the Community Gives a Rider

Series `app-community`, code `APP`, season 1. Four founder-to-camera vertical shorts —
`short_vertical`, 9x16, 1080x1920, 30 fps — each shipped as an en-US cut and a zh-CN cut of the
same footage.

The season is written for riders and the dirt-curious: people who want somewhere to share rides,
find other riders and follow the sport, plus anyone still deciding whether the app is worth the
download. It also reaches the small businesses at the edge of that world — track owners, two-person
moto brands, privateers with a decal sponsor. What holds the four episodes together is a single
promise: every one of them shows a specific person what the community gives *them*, and none of
them is a feature tour for its own sake. The season speaks as the community rather than as a
company marketing an app, in a register that is rider-to-rider and deliberately unpolished — real
riding footage, real app screens, clean type, no stock, no hard sell. Those commitments come from
`series/app-community/series.yml`, which this README retires.

## The episodes

| ID | Slug | What it is | Status |
|---|---|---|---|
| E002 | `founder-story` | ~66s: why DirtBikeX exists, told through one first ride — brutal, addictive, and then nobody to share it with — closing on the invite code. | `editing` |
| E003 | `track-owners` | ~54s: the discovery gap ("you can't show up to a ride day you never discover"), then three screens for people who run tracks — get verified, create ride days including recurring ones, riders RSVP and get reminded. | `editing` |
| E004 | `sponsorship-passes` | ~68s: "I build ad slots because I hate ads" — how a sponsorship pass works: pick a spot, set start and duration, appear in search, chat, filters and the splash screen, capped and rotated, with stats. | `editing` |
| E005 | `verified-boost-rider` | ~65s: the paid tier for riders who are already here daily — custom flair, stronger invite tools, deeper sponsorship stats, and the group chat where features get tested first. | `editing` |

Durations are the pause-cropped timeline lengths in each manifest, not raw clip time. The
directories are still `series/app-community/episodes/DBX-APP-S01E00N-<slug>/`, and each manifest's
`video_id` still carries the `DBX-APP-` prefix.

## Why they belong together

They are a ladder of audiences, and the manifests and briefs say so explicitly. E002 argues the
app to riders. E003 is the first episode aimed at track owners — no overlap in audience or CTA
with what came before it. E004 sells reach to the same buyer E003 pitched, and E005 sells belonging
back to riders, assuming E004 was watched: its stats beat exists to say *if you hold a sponsorship
pass, you get deeper stats*, and E003's flair (granted by role) is the thing E005 sells by
subscription. Each brief records the duplicate check that keeps these from repeating each other.

They also share a grammar. One continuous kinetic-caption overlay runs the whole length of each
video, with per-beat overlays layered on top (`brand-title` / `brand-drop` landing on the word
"DirtBikeX", `side-screen` cards holding app recordings in the frame's blank column, `profile-card`
arriving just before "My name is Rubio" and clearing before the CTA verb — E003 set that
convention and E004 and E005 cite it). Every episode ends on the founder's name and exactly one
action: the invite code in the description (E002), comment "OWNER" (E003), comment "PASS" (E004),
follow and open the bio link (E005).

## How they were made

Narration came first in every episode. There is no authored reading script anywhere in the season:
`script.en-US.md` is a transcript of record of what was actually said, and for E005 the manifest
goes further — the `.srt` files are canonical and outrank both the director's outline and the
transcript. E003, E004 and E005 briefs were written *after* the shoot, on purpose, so the retro has
a stated angle to judge against.

The cut takes video from face-enhanced renders and audio from the original `.MOV`, frame-sync
verified by RMS-envelope cross-correlation rather than by eye. The talking-head sources are HLG HDR
and each carries a second, undecodable 4.0 `apac` spatial audio track — map the AAC stream
explicitly, never let ffmpeg pick. Each episode assembles into a kdenlive project; the repo holds a
rough-cut ffmpeg flatten for review, and the final render happens on a Mac after zoom-keyframe
polish. Media bytes live outside git under `media/`.

Redaction is done at the source, before any chop: E002 blurs usernames and a rival forum's logo in
the scattered-apps cutaway; E005 blurs a real third party who appears in two screen recordings and
blurs the live invite QR, so nothing scannable and no un-redacted frame can reach an export.

The zh-CN half is not a sibling variant. On a human-directed exception to the repo's localization
rule, it is a literal translation riding the unchanged English audio, so every timing is identical
to en-US and the bilingual caption overlay (English line, then Chinese line) is the only re-render;
every other overlay is reused from en-US. Fully localized props exist for a later round but are not
in these cuts.

## Where the season actually stands

Nothing has shipped. All four manifests are `status: editing`, `outputs.published` is empty in all
four, `outputs.covers` is empty in all four, and the only export recorded per episode is one
`*_v001_review.mp4` rough cut. Cover documents exist in both locales for all four episodes with
ranked title variants, but the chosen frame is TBD everywhere and E004's and E005's cover docs say
plainly that the still must be pulled from the final Mac render, not the rough cut.

Open items a producer should not walk past:

- **Music and SFX are not cleared.** All four episodes carry the same `bgm-vampire-heart.mp3` and
  the same SFX pack, and in all four the `source` and `license` fields are `DECIDE:` — origin URL
  unrecorded, commercial-social use unconfirmed. This blocks publish for the whole season, not one
  episode.
- **E004's CTA promises free day passes.** Its brief and cover both hold a `DECIDE:` to confirm
  supply before publishing, because the comment volume is the entire point.
- **E005 knowingly ships a weak CTA.** Interaction conversion scores 2 of 5: the recorded words are
  "follow and go check out my link in the bio" where the outline had drafted a one-word comment
  trigger. The director settled it — the subtitles are the script — and the cover copy is where the
  conversion path gets spelled out instead. Confirm the bio link points at a real invite first.
- **E002's brief is stale.** It still lists the anchoring moment, the hook and the CTA as open and
  the script as not locked, while its manifest and script record the narration as recorded and
  locked. Trust the manifest.
- **E003's zh-CN packaging is unmapped.** Its cover doc keeps the en-US platform sections
  (tiktok / ytshorts / reels) and the English hashtags, but the zh-CN variant publishes to rednote,
  douyin and bilibili. A human still has to decide the section mapping and Chinese tags.
- The `zh-CN` pain-point line is blank in the E003, E004 and E005 briefs.

## What is in an episode folder

`manifest.yml` is the source of truth — status, beats with per-locale target durations, every raw
and selected asset, and the outputs. Around it: `brief.md` (viewer, pain point, the five-dimension
scores and the designed reactions), `script.{en-US,zh-CN}.md`, `cover.{en-US,zh-CN}.md`,
`storyboard.md`, `edit-notes.md`, `subtitles/*.srt`, `remotion-props/` for the overlay renders, and
`caption-map.mjs`. The shell and Python next to them are the reproduction record for the cut, and
they differ by episode: `broll-process.sh` (E002), `screen-chop.sh` (E003–E005),
`footage-process.sh` and `speech-check.py` (E004, E005), `build-zh-CN.sh` and the
`kdenlive-build.repl` pair (all four). The director's outlines (`rough.md`) and the canonical
`_source/srt/` files are referenced by the manifests but live under `media/`, outside git.
