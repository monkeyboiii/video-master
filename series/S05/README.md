# S05 — Remedy

S05 is where an episode gets a second attempt. An episode is admitted here when it re-tells a
topic an earlier episode already covered, because the earlier one underperformed. That is the
only entry test, and it is recorded as lineage rather than left to a reader's inference:
every episode in this season names a `parent` — the episode it answers — and carries
`relation: remedy`. `follows` is a separate field and records where the episode published in
the original run, which is not the same fact.

Two things follow from that, and they are what makes this season safe to add to. **The parent
is never touched.** A remedy does not supersede, replace or re-cut its parent's master; both
episodes stay, and nothing is reused between them — not the take, not a graft, not the music
bed. And **a remedy is only worth making if you can say what changed.** The comparison against
the parent is the whole reason the season exists, so this README carries it in full for the one
episode that is here.

Positioning is inherited from the series that S01–S05 all belong to: DirtBikeX speaks as the
community, rider-to-rider, and the app appears as a consequence rather than a pitch. A remedy
episode may drop the product moment entirely — E001 does.

## Episodes

| ID | Slug | What it is | Status |
|---|---|---|---|
| E001 | `barber-shop-dirt-bike` | zh-CN portrait of the Tonglu barber from S03E003 — he spent close to a million yuan building the track, and at 53 rides it better than the narrator. | `topic` |

Follows S03E003 · parent S03E003 · relation `remedy`. It does not advance the 100-track
counter: no new track is visited, it is the same track seen from a different angle.

## What E001 changed against S03E003

S03E003 is the mission episode — day three of the 100-track run, and its argument is that a
track like this is found through a person rather than a search box, so the barber is the *lead*
and the haircut is the structural joke. E001 asks the other question: who the man is, and what
the track cost him. The reversal is staged twice — the bike parked in the shop reverses the
barber, then "车竟然不是主角" reverses the bike, and the money turns out to have gone into a
pile of dirt.

| | S03E003 (parent) | S05E001 (remedy) |
|---|---|---|
| Question | how a track nobody has mapped gets found | who built it, and what it cost |
| Locales | en-US and zh-CN, separately authored sibling reads | zh-CN only; no en-US take exists |
| Master | 40.99s (en) / 40.98s (zh), 11 beats | 49.00s, 12 beats — the longest cut in S03 |
| VO source | take 2, two grafts and three discarded spans, cut in six (en) / four (zh) regions | take 1, a single region, no grafts, pure dead-air cut |
| Track-specific detail | none — the script's two placeholders were never recorded, so no line is true only of this track | 快100万, 三层楼高的落差, 20多米的大跳台, and the apprentices |
| Counter | closes on the TRACK 3 / 100 card | does not move |
| Product moment | one, 1.48s in zh (弄上地图) | none; the app never appears |
| Music bed | usher-yeah-instrumental, ducked 10 dB under the barber exchange | show-me-instrumental from 50s, no duck — there is no two-speaker exchange to duck under |

The brief's five-dimension scores move the same way the structure does: information density
2 → 4 and emotional trigger 4 → 5, bought by giving up personal positioning 5 → 3, because
the founder is a narrator here and not the subject. That trade is deliberate and it is the
one dimension the episode concedes.

The density change is the substantive one. S03E003's edit notes close on an open decision
that neither of its cuts contains a single line that is only true of that track; E001 is
three second-hand numbers and a scene of apprentices, and it is built on nothing else. Those
numbers are therefore the episode's spine and its exposure at once — see below.

There is also a production fact worth carrying forward: E001's take is the first in S03 that
needed no region-splitting at all. Every earlier take had a click, a breath or handling noise
above the −34 dB threshold that the cut had to step over; this one has none, the master is a
single region `0.60 → 69.39`, and it is verified as a pure splice (+0.01 dB mean across
125 Hz–8 kHz, 1935 gated frames in the raw take against 1934 in the master). Region-splitting
is a workaround for a take, not a property of the pipeline.

## Production reality

Nothing in this season is finished, and the README should not be read as if it were.

E001 is at `status: topic`. The VO is recorded, cut and verified, and the script and beats are
transcribed off it, but the packaging pass has not run — there is no cover, `cover: null` in
the only variant, and the stage gates are ordered, so it stays at `topic` until a cover exists.
No footage is shot: `assets.raw` and `assets.selected` are both empty, the edit notes carry VO
decisions only, and the assembly plan lands after the shoot. `subtitles/` and `remotion-props/`
are empty directories, and every `outputs` map is `{}`.

Four things need a human before this ships, all of them recorded in the episode's own DECIDE
list:

- **Music is NOT CLEARED.** All three candidate beds are commercial recordings with no licence
  on file, placeholders for the review mix only. The chosen one (Show Me) also peaks +0.9 dBFS
  in the source — a clipped master, attenuated 28.8 dB here, never to be used near unity. Which
  bed wins is still open; Magnolia additionally cannot be confirmed as an instrumental and its
  file is only 70.09s, so a longer re-cut could not cover itself without a loop.
- **The three numbers are second-hand.** 快100万, 三层楼, 20多米 are the founder's paraphrase of
  what he was told. They are the spine of the episode and the comments will test them.
- **Consent, separately from the parent.** S03E003 puts the barber on camera and grafts his own
  voice into both masters; this episode is *about* him, his money and his age. That is a
  different question and it should be asked again rather than assumed.
- **The transcription is weak and the script is built on it.** whisper base misheard heavily
  (全杭州 → 全行中, 土堆 → 吐嘴, 徒弟 → 图地); the script lists every correction inferred, but the
  final line at 65.76–68.37s is unreadable and three more places are marked (?). No subtitle
  work starts before an ear pass.

There is no en-US variant, and if one is wanted it is authored natively, never translated off
the Chinese page.

## Adding the next episode here

Admit it only if it re-tells a topic an earlier episode covered and the earlier one
underperformed; anything else that publishes between two numbered episodes is an interstitial
and belongs with its own season. Name the parent and the relation in lineage before anything
else, leave the parent's cut alone, and write the comparison — question, structure, locales,
length, what the parent lacked — into this file at the same time. A remedy whose difference
from its parent is not written down is indistinguishable from a duplicate.
