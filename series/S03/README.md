# S03 — The 100-Track Challenge

One rookie rider visits **100 real dirt bike tracks**, one per episode, and counts them on
screen. That is the whole season. A field episode goes to a track, meets the people who keep
it running, and ends on a counter card, so any single episode reads as part of a series. The
app arrives as a consequence of the visit rather than a pitch, and the register — set in E000
and held since — is that the narrator is not qualified and is going anyway, deliberately
self-deprecating where S01E002's founder story was sincere.

Every episode is a 9×16 vertical short, 1080×1920 at 30 fps. E000–E002 are en-US only, with
an alternate Chinese-hook soundtrack over the same English body for the Chinese platforms;
from E002.5 on the Chinese side is a **natively authored sibling read**, not a translation, so
the two locales differ in length, structure and sometimes content. Named locations so far:
Huzhou (E001), Tonglu (E003), and a 农家乐 at the foot of Niushou Mountain in Nanjing (E004).
E002's hometown park is never located — its Chinese hook is written in Hangzhou dialect, which
is the only hint the files give.

## Where the count stands: 4 of 100

Four tracks have been visited — E001 Huzhou, E002 the e-bike park, E003 the barber's track in
Tonglu, E004 the Nanjing farm.

You can tell without opening an episode by reading two lines. The last `beats:` entry in a
counting episode's `manifest.yml` is its counter card, and the matching **On-screen /
subtitle emphasis** line in `script.en-US.md` spells the card out: `track-one-down` →
`+1 — 1 / 100`, `learning` → `E-BIKE PARK 2 / 100`, `that-ll-do` → `TRACK 3 / 100`,
`track-four-found` → `TRACK 4 / 100`. The highest card in the season is the count. Every
non-counting episode says so in the comment at the top of its own `manifest.yml`.

Two qualifications. The count is what has been **written and recorded**, not what has aired —
nothing in S03 has been shot or published (see Production reality). And the count is of
*visits*, not signups: E002's boss turned the app down and the counter ticked anyway, which
E002's script states outright ("the count is visits, not deals, so it still ticks").

**E000 does not count.** It visits no track. Its manifest opens the counter at 0, its closing
beat is a TRACK ZERO card, its cover text is `TRACK 0 / 100`, and its hook shot is briefed as
"an empty or unremarkable track… the shot should look like nowhere". It is the premise, not an
episode of the format. The first tick is E001.

**The four interstitials do not count either.** Each carries a one-decimal number, publishes
between two numbered episodes, and states in its manifest header that it does not advance the
counter. They exist because the mission produces things that are not tracks: a map, a feature,
a portrait, a bug. E004.5's "almost 100 riders" is app installs — a different hundred, easy to
misread as the track count.

## Episodes

| Id | Slug | What it is | Status |
|---|---|---|---|
| E000 | `track-zero` | The premise: the scene is invisible, one unqualified rookie is going to document 100 tracks. Counter opens at 0 / 100. | `scripting` |
| E001 | `100-tracks-day-one` | Track 1, Huzhou. The format pilot — find the rider who grew up on the track, and the track dog. | `scripting` |
| E002 | `ebike-park-day-two` | Track 2, the hometown park, now all-electric. The boss turns the app down and asks for GPX and live tracking instead. | `scripting` |
| E002.5 | `put-it-on-the-map` | Interstitial. A rider sent a GPX; it became the map, with him credited. First native zh-CN read in S03. | `topic` |
| E003 | `barber-track-day-three` | Track 3, Tonglu. The track is found by getting a haircut from the man who runs it. | `topic` |
| E003.5 | `barber-shop-dirt-bike` | Interstitial. The same barber as a portrait — ~1M yuan spent on dirt, a three-storey drop, a 20 m table. zh-CN only. | `topic` |
| E003.8 | `share-your-trails` | Interstitial. The trail-upload feature a DM asked for: private by default, one tap either way. | `topic` |
| E004 | `nanjing-farm-track-day-four` | Track 4, a 农家乐 at Niushou Mountain. Went for an easy day, came back with a technique — downshift mid-air. | `topic` |
| E004.5 | `almost-100-riders-first-bug` | Interstitial. Nearly 100 riders in the app, a giveaway, and the first bug — a wrong-language default — owned on camera. | `topic` |

## Production reality

**Nothing has been shot.** The stage ladder is `topic → packaging → scripting → shooting →
editing → qc → published → retro`, and the season's highest status is `scripting`. All nine
have empty `assets.raw` and `assets.selected`, no `storyboard.md`, no `.srt`, and empty
`outputs.published`. The one export declared anywhere is E002's burned-in bilingual **review**
cut over a zh-CN grade. The three `cover.*.md` that exist are packaging drafts whose
"Post-edit lock" sections are still TBD, because they need real frames.

**The six `topic` episodes are held there by a missing cover, not missing audio.** Every one
has its voiceover recorded, spliced and measured, and its script transcribed off the take;
several are the most finished audio in the season. Because packaging sits below scripting on
an ordered ladder, an episode with no cover cannot claim `scripting` — each manifest says so
in as many words. E004.5 additionally needs one ear pass over four uncertain transcribed
lines. What moves these six forward is packaging work.

**No music in this season is cleared.** Every bed is marked `NOT CLEARED — commercial
recording, no licence on file for social commercial use`, placeholder for review mixes only.
E002's record-scratch SFX is `UNKNOWN — no licence on file`. Four beds are separately
unconfirmed as instrumentals — `california-love`, `playboi-carti-magnolia`,
`gunna-who-you-foolin`, `50-cent-disco-inferno` — and need one listen, because a vocal bed
under a voiceover is unusable. Nothing here can publish on its current soundtrack.

**Two consent questions are open, and they are not licensing questions.** The barber speaks on
camera in E003 and his lines are grafted into both masters; E003.5 then makes him the subject,
which the brief flags as a second, separate ask. E003.8's zh-CN master grafts the DM rider's
own recording with nothing on file. Both briefs say to ask before shipping rather than assume.

Each brief also ends with a **go / no-go question for the human** — several of them are
product commitments the episodes make on camera (e-bikes in scope, an uploader credit on a
trail, private-by-default upload behaviour). If the app cannot back them when a viewer goes
and looks, the episode breaks on first use. Read the brief before shooting.

## Moving into `series/S03/`

This folder does not exist yet. The episodes are still flat under
`series/app-community/episodes/`, and `tools/series/check.mjs` currently reports
`no seasons found`. Three things are known about the move from the tooling itself:

- The target tree is `series/S0N/E0NN-slug/`, with `video_id: "S03E00N"`. All nine manifests
  still carry the retired `DBX-APP-S03E00N` form and a `series:` field —
  `tools/series/episode.mjs` errors on the first and warns on the second ("the season is the
  series now").
- **The four decimal ids have no valid new form.** `RE.videoId` and `RE.episodeDir` in
  `tools/lib.mjs` admit only `E###`. The replacement the new checker provides is
  `lineage.follows`, which records where an episode published in the original run — the
  comment there says that is exactly what the fractional number used to encode. No manifest
  carries `lineage` yet, and no whole numbers have been assigned.
- `tools/validate.mjs` (the old per-episode validator) is broken: it imports `listSeries` from
  `tools/lib.mjs`, which now exports `listSeasons`. Validate through `tools/series/check.mjs`.
