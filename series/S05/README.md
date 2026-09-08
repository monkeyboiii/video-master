# S05 — Spin-offs from the 100-track challenge

S03 is the counted field mission: ride to a real track, meet whoever keeps it running, put it on
the map, tick the counter. This season is what that run throws off. An episode lands here when it
comes **out of** the 100-track challenge but does not advance it — a person met on a visit who
deserves a piece of their own, a race the challenge rides into, a re-cut of an episode that
underperformed. The entry test is the origin, not the format.

**Nothing here moves the counter.** That is the line between this season and S03, and it is the
reason the pieces need a season rather than a decimal: they are countable as a set only if they
have real numbers of their own.

**Was: "Remedy."** The season opened as the home for re-cuts, on the strength of one episode.
That definition could not hold E002, which is not a re-cut of anything — it is the challenge
running into MXGP — and a season whose README describes half its episodes is a number that has
stopped meaning anything. Renaming it costs nothing because the season number carries no format
claim; `remedy` survives where it was always the more precise statement, as E001's
`lineage.relation`, which is a fact about that episode rather than about the season.

## Episodes

| ID | Slug | What it is | Status |
|---|---|---|---|
| E001 | `barber-shop-dirt-bike` | The Tonglu barber from S03E003 as a portrait: close to a million yuan spent building the track, and at 53 he rides it better than the narrator. zh-CN. | `topic` |
| E002 | `mxgp-shanghai-this-weekend` | Pre-MXGP propaganda: the world championship lands in Shanghai and the narrator, mid-challenge, tells you to go. zh-CN. | `topic` |

## Lineage

`E001` — `follows: S03E003`, `parent: S03E003`, `relation: remedy`.

S03E003 finds the track by getting a haircut from the man who runs it, and answers "how do you
find a place like this". E001 answers "who is the man who built it". Neither supersedes the other;
both stay in the tree, and `tools/vm tree` prints the edge between them.

`E002` — **no lineage block, deliberately.** `parent` and `follows` name a single EPISODE, and
this one answers no single episode: it spins off the whole S03 run. Writing `parent: S03E001`
would be a false precision, and there is nothing else to point at, because a season is not a
lineage target. The connection is in the season definition above and in the script's own closing
beat — 我的100条赛道挑战还在继续 — which is where a viewer meets it anyway.

## Where it stands

- Both episodes are `topic`. Neither is shot.
- E001: the subject speaks on camera and is the episode. Confirm he agreed to be published before
  it ships — the same release question S03E003 carries, and the more pointed one here.
- E002: dated material. It is pre-event propaganda for one weekend, so it is worthless after it,
  and it carries a third-party source clip (VOX_002) with no licence on file.
- E002 is also the repo's first **分镜设计** — a parsable `storyboard.yml` plus a placeholder
  previz render. That experiment is described in `agents.d/modules/storyboard-previz.md`; it has
  no skill and is not yet a convention other episodes are expected to follow.
