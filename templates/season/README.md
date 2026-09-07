# S{NN} — {Season name}

<!--
  A season's README is what makes its number mean anything. `S03E003` says "the third episode of
  the 100-track challenge" only because series/S03/README.md says that is what S03 is; without this
  file the id is just two numbers. `tools/vm check` requires it for exactly that reason.

  Write it for someone who has never seen the repo. They should finish this file knowing what the
  season is and why its episodes belong together, WITHOUT opening an episode. That is the bar.

  State only what a file supports. A claim you cannot trace to a manifest, brief or edit-note is a
  defect here, not colour — this repo's whole discipline is that the manifest is the source of truth.
-->

One paragraph: what this season is, who it is for, and what every episode in it repeats.

## The episodes

| ID | Slug | What it is | Status |
|---|---|---|---|
| E001 | `some-slug` | one sentence — what a viewer gets, not what it is about | `topic` |

## Why they belong together

What makes this a season rather than a list. If the answer is "they were made at the same time",
say that — it is a real answer and pretending otherwise is worse.

## Where it actually stands

What has shipped, what has not, and anything a producer must not walk past — an uncleared music
bed, an unanswered release question, a status that is stale. Being specific here is the difference
between a doc and a brochure.

## Lineage

If episodes here answer episodes elsewhere, say so and name them. `tools/vm tree` prints the edges;
this is where the reason lives.
