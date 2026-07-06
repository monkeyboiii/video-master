# Skill: Topic Selection (选题)

## Purpose

Turn an idea, pain point, or metric insight into an approved episode brief that scores
strongly on all five design dimensions (`docs/golden-rules.md` — see its Topic 选题
section for the full doctrine).

Topic formula: **user pain point + our solution + concrete benefit.** Never start
from "what we want to say" or our knowledge inventory — start from the viewer's stuck
point and reverse-engineer.

## Inputs

- The idea/request from the human, or `next episode` decisions in prior `review.md` files
- `series/<series>/series.yml` — series positioning, audience, and **tone register**
  (the episode inherits it; note any deliberate deviation in `brief.md`)
- Recent `review.md` metrics from the same series, if any
- Optional: external reference videos/links from the human (recorded under
  `## References` in `brief.md`)

## Outputs

- New episode directory scaffolded via `node tools/new-episode.mjs <SERIES> <slug>`
- `brief.md` completed
- `manifest.yml` initialized (`status: topic`, formats, empty variants wired)

## Steps

1. Name the viewer: one concrete person (e.g. "adult beginner who just bought a used
   125 and stalls it on every hill"). Not a demographic.
2. Name the pain point in the viewer's own words — the sentence they would type into
   search or say to a friend.
3. Write the one-sentence viewer benefit (the core conclusion the video will prove).
4. Score the topic 1–5 on each of the five dimensions: user relevance, emotional
   trigger, information density potential, personal positioning, interaction conversion.
   Record scores in `brief.md`. Two or more weak scores (≤2) → rework the angle or
   recommend dropping it, with reasons.
5. Design all four interaction triggers deliberately ("this is about me", emotional
   reaction, save-worthy value, comment motivation — table in `docs/golden-rules.md`
   Topic section) and pass the judgment test: why would the viewer **like** this?
   **save** it? **comment**? **follow**? Record the answers in `brief.md` — if any
   answer is missing, the topic isn't mature.
6. Scaffold the episode and fill `brief.md` (template sections are mandatory).
7. Set manifest `status: topic` and run `node tools/validate.mjs`.

## Rules

- Start from the user's pain, never from "what we want to say".
- One episode = one problem = one core conclusion. Split anything bigger.
- If the topic exists in another series or a prior episode, link it and justify the
  difference — no accidental duplicates.
- Propose the topic in both locales' terms: the pain point phrasing may differ between
  en-US and zh-CN audiences; capture both in the brief.

## Starting a new series (when no existing series fits)

1. Propose it to the human first: audience, promise, positioning, and a 3–4 letter
   uppercase code. A new series is a positioning decision, not a filing decision.
2. On approval: create `series/<kebab-slug>/series.yml` from `templates/series.yml`,
   fill every field, and register the code in the table in
   `docs/naming-conventions.md` in the same change.
3. Run `node tools/validate.mjs` (it enforces code format/uniqueness and warns on empty
   positioning fields). Then scaffold the first episode as above.

## Done criteria

- `brief.md` has a named viewer, pain point (both locales), one-sentence benefit,
  five-dimension scores, and designed reactions.
- `manifest.yml` exists, `status: topic`, and `node tools/validate.mjs` passes.
- Human has an explicit go / no-go question to answer, not a vague pitch.
