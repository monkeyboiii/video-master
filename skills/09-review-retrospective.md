# Skill: Review & Retrospective (复盘)

## Purpose

Close the loop: capture real performance, judge the packaging/content hypotheses, and
convert what was learned into concrete decisions for the next episode. Every completed
video must improve the next one.

## Inputs

- Platform metrics per variant per platform (from the human): views, average watch
  time / retention curve shape, completion rate, likes, saves, comments, shares, follows
  gained
- The episode's `brief.md` (original hypotheses), `cover.*.md` (packaging hypotheses),
  `edit-notes.md`
- Prior `review.md` files in the series (trend context)

## Outputs

- `review.md` completed from `templates/episode/review.md` (copy it in, fill the
  `{{...}}` tokens)
- Manifest `status: retro`
- Next-episode inputs: topic candidates or fixes, fed to `skills/01-topic-selection.md`

## Steps

1. Record raw metrics per variant per platform with the date of capture. Metrics without
   dates are useless for trends.
2. Judge each designed reaction from the brief: did viewers actually save / comment /
   follow? Compare intended vs observed.
3. Read the retention shape against the beats: where did viewers leave? Map drop-offs to
   beat IDs, not timestamps alone.
4. Verdict the packaging: did the hook hold past 2 seconds (retention at 2–3s)? Did the
   cover/title earn the click (view rate vs series baseline)?
5. Compare variants: what worked in one locale but not the other, and why (content,
   platform, or packaging)?
6. Write 复盘 conclusions as **decisions, not observations**: "next episode: state the
   price in the hook" beats "pricing seemed to interest people".
7. List 1–3 next-episode topic candidates or fixes with a one-line rationale each.
8. Set `status: retro`; run `node tools/validate.mjs`.

## Rules

- No new episode is scripted in a series while its previous published episode lacks a
  completed `review.md` (golden rule #7).
- Every conclusion must trace to a metric or a mapped drop-off — no vibes-only verdicts.
- Failures are recorded plainly. A retro that only celebrates is a failed retro.
- Update series-level learnings: if a rule proved out repeatedly, propose an edit to
  `docs/golden-rules.md` or the relevant skill file in the same PR.

## Done criteria

- `review.md` has dated metrics, beat-mapped retention notes, packaging verdicts,
  variant comparison, and decision-form conclusions.
- At least one concrete next-episode input exists.
- Manifest `status: retro`; `node tools/validate.mjs` passes.
