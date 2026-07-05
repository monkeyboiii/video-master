# Skill: Cover & Title Packaging (封面/标题)

## Purpose

Design the packaging hypothesis — title, cover concept, first frame, platform caption —
for each locale. Packaging is drafted **early** (it sharpens the script) and locked
**late** (after the edit, when real frames exist).

## Inputs

- `brief.md`, `manifest.yml`
- `docs/platforms.md` — cover specs and safe zones per platform
- `docs/golden-rules.md` packaging rules
- After the edit exists: candidate frames from `edit-notes.md`

## Outputs

- `cover.en-US.md` and `cover.zh-CN.md` (copy `templates/episode/cover.template.md` and
  fill the `{{...}}` tokens), each with:
  - 3+ title variants, ranked, with the reasoning
  - Cover concept: layout, on-cover text (≤ 2 lines), emotional read
  - First-frame intent (what the viewer sees at 0.0s)
  - Platform caption drafts per target platform
- Once footage exists: cover stills rendered via the `cover-9x16` / `cover-3x4`
  compositions in `packages/remotion-graphics/` (see `skills/05-remotion-graphics.md`),
  named per `docs/naming-conventions.md`

## Steps

1. Re-read the brief's pain point and benefit sentence. The packaging must promise
   exactly that benefit — nothing broader.
2. Draft ≥3 title variants per locale, each built on one of the four opening formulas
   from `docs/golden-rules.md` (Hook section) — **A pain point first, B identity
   contrast, C benefit promise, D counterintuitive claim** — and label which formula
   each uses. Titles are written natively per locale, not translated.
3. Describe the cover: background image intent, on-cover text, where text sits relative
   to platform safe zones and cover crops (`docs/platforms.md`).
4. Define the first frame so the shooter can capture it deliberately.
5. Write platform captions (hashtags included) per locale per platform.
6. Update manifest `status: packaging`; run `node tools/validate.mjs`.
7. **Post-edit pass** (second invocation of this skill): review actual footage frames,
   pick/adjust the cover, render stills, record final choice + rationale in the cover
   files, and update `manifest.yml outputs.covers`.

## Rules

- Title, cover, and first frame are one promise stated three ways — they must agree.
- No promise the video doesn't pay off.
- On-cover text must be legible at feed-thumbnail size: big type, ≤ 2 lines, high
  contrast against the background.
- zh-CN covers follow zh-CN platform norms (e.g. RedNote 3:4 text-forward covers), not
  scaled-down en-US designs.

## Done criteria

- Both cover files complete with ranked titles and reasoning.
- Cover text verified against each target platform's crop/safe zone in `docs/platforms.md`.
- Manifest status advanced and `node tools/validate.mjs` passes.
- (Post-edit pass) Final cover stills exist in `media/exports/` and are recorded in the
  manifest.
