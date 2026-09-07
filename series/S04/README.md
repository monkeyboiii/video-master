# S04 — Product & feature introductions

Three episodes whose subject is the product itself. No track is visited in any of them and none
of them moves the 100-track counter that S03 exists to run — that is the line between this season
and that one. What holds them together is not "feature videos": in two of the three a rider asked
for something and got it, and in the third a rider found something broken and said so. The map
exists because someone sent a GPX file; trail upload exists because someone sent a DM; the product
update exists because a stranger at a track opened the app and it came up in the wrong language.

They are also where the bilingual discipline starts. E001 is the first episode in the S03 run with
a complete, separately authored zh-CN read rather than a Chinese hook spliced onto an English
soundtrack, and all three carry two full locale reads.

Read off the briefs, the viewer is: a rider with a GPX on his phone and nowhere to put it where
anyone would find it (E001); someone who rides trails nobody has mapped and has never posted them,
because posting has always meant broadcasting (E002); someone who downloaded the app, opened it in
a language they don't read, assumed it was broken, and never opened it again (E003).

## The episodes

| Ep | Slug | What it is | Status |
|---|---|---|---|
| E001 | `put-it-on-the-map` | A rider sends the GPX of his local trail and asks for it to be findable. The founder builds the map, the trail goes on it with the uploader credited, and the ask is: send yours. 5 beats, 20.53s (en-US) / 21.37s (zh-CN). | `topic` |
| E002 | `share-your-trails` | The feature the DM produced: upload a trail, private by default, send a link to a few people, and go public or back to private with one tap either way. Ends on "does this seem useful?" rather than a CTA. 13 beats, 41.17s / 44.51s. | `topic` |
| E003 | `almost-100-riders-first-bug` | The channel's housekeeping episode: nearly 100 riders, an airtime card for the first 66 comments, then the first bug — the app opening in the wrong language — owned on camera with the profile-settings workaround. 11 beats, 27.23s / 26.03s. | `topic` |

Both locales are **sibling variants, not translations** (`agents.d/modules/localization.md`):
separately authored, separately read, and different in content where it matters. Per-beat
durations differ by locale in all three — E002's closing beat is 5.08s in en-US against 2.72s in
zh-CN, E001's CTA is 3.49s against 5.59s — so the picture is cut per locale, never to one shared
timeline. All three are 9x16, 1080x1920, 30fps; en-US to TikTok / YouTube Shorts / Reels, zh-CN to
RedNote / Douyin / Bilibili.

## What the renumbering preserves

These three were produced as interstitials inside S03 and filed as `S03E002.5`, `S03E003.8` and
`S03E004.5`. The fraction encoded exactly one fact — **when the piece published**, between which
two field episodes — and nothing about why it exists. It also made the set uncountable: a decimal
of its parent cannot be sorted, filtered or reported on as a season. Renumbering fixes that and
would throw the publish position away, so the position moves into each manifest's `lineage` block:

| Now | Was | `follows` | `parent` | `relation` |
|---|---|---|---|---|
| `S04E001` | `S03E002.5` | `S03E002` | `S03E002` | `inspired-by` |
| `S04E002` | `S03E003.8` | `S03E003` | — | — |
| `S04E003` | `S03E004.5` | `S03E004` | — | — |

`follows` and `parent` are different facts and the season checker (`tools/series/check.mjs`) keeps
them apart. **`follows` is where the episode published in the original run** — the fraction,
written down, and the only thing the fraction ever said. **`parent` is the episode this one
answers**, which only E001 does. E002 and E003 have `follows` and no parent: a feature piece and a
product update that shipped between two field episodes without answering either. The first pass at
this migration inferred a parent for every fraction from its number and got two of four wrong,
which is the whole reason the two fields exist separately; the mapping above is operator-confirmed,
not inferred. A `relation` without a `parent` is an error, and a `relation` without a `reason` is a
warning — the reason is the useful half.

`S03E003.5` (`barber-shop-dirt-bike`), the other interstitial in the S03E003–S03E004 gap, is not in
this season. It is a portrait of the barber, not a product piece; it shares only its position with
E002.

## Where the season actually is

All three are at `status: topic`, and that is not paperwork. The stage gates are ordered
(`topic → packaging → scripting → shooting → …`), so an episode with finished audio and finished
text still sits at `topic` until packaging — the covers — is done. **What every episode here needs
next is a cover, not more audio.**

What is done: both VO masters per episode, cut, measured and reproducible from the episode's own
`vo-process.sh`. The policy is a pure splice — dead air cut, nothing else touched — and each
`edit-notes.md` carries the measurements that prove it. The `beats` in each manifest are the
measured durations of those masters, not a plan, which makes them the shooting plan too.

What is not:

- **No footage.** `assets.raw` and `assets.selected` are empty in all three, no `storyboard.md`
  exists, and every `outputs` block (overlays, covers, kdenlive, exports, published) is empty.
  E001 and E002's edit-notes say it outright: footage is not shot; the assembly plan lands after
  the shoot.
- **No subtitles yet.** Every variant points at `subtitles/<locale>.srt`; none of those files
  exists. Beat durations are provisional until that pass.
- **Every music bed is NOT CLEARED.** `california-love.mp3` (E001), `riders-on-the-storm-instrumental.mp3`
  (E002) and `50-cent-disco-inferno.mp3` (E003) are commercial recordings with no licence on file,
  placeholders for the review mix only. Two of the three are not even confirmed to be
  instrumentals — they carry no `-instrumental` marker and a transcriber returning `[Music]` is not
  proof. A vocal bed under a voiceover is unusable at any level, so this is one listening session
  standing between the season and a real mix.
- **E003 was delivered with no script at all.** Both of its scripts are whisper transcriptions
  aligned to the master's own splice structure, with four uncertain readings per locale tabled at
  the bottom of each. One of them is not a caption detail: en-US reads "For 66 comments" where
  zh-CN reads 前 66 个 — "the first 66". Those are different promises, and whether 66 airtime cards
  are provisioned at all is not recorded anywhere. Its slug is the agent's, not the operator's, and
  the naming rules freeze it at `scripting`.
- **E001's two variants promise different things.** The en-US `on-the-map` beat credits the rider
  ("with him as the uploader"); the zh-CN read has no equivalent clause — confirmed as a real gap,
  not a transcription miss. Crediting the rider is the point of the episode.
- **E002 has two live editorial questions.** Its closing beat moved from a plea to a question in
  both locales, and "track owners get their spot" is gone from the last two en-US takes and from
  the zh script — as recorded, the beat that was meant to mean "one map, two kinds of pin" now
  speaks only to riders. Its `meme-room` beat is 1.20s / 1.22s of held room tone with no voiceover
  at all: a load-bearing hole the edit must fill, or the cut reads as broken.
- **Two identifiable third parties.** E002's zh-CN soundtrack carries the DM rider's own recording
  (`VOX_001`) with nothing on file; E003 tells the story of a rider met at a track who is described
  but not named or shown. Both are open questions, and both are separate from S03's barber.

## Producing the next one here

An episode belongs in S04 if its subject is the product or the channel rather than a place: no
track visited, the counter does not move, and the thing being explained is something a user can go
and do in the app. If it publishes into an existing run, record where in `lineage.follows`. Add
`parent` only if it genuinely answers an episode — and when you do, write the `reason` in the same
edit, because a relation nobody explained is how the fractions lost their meaning in the first
place.
