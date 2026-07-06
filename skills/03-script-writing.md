# Skill: Script Writing (脚本)

## Purpose

Create high-retention DirtBikeX **reading scripts** (口播稿) — the CONTENT layer: what
is spoken and what appears on screen, per locale. Beats are defined once
(locale-neutral); each locale's script is then written natively against those beats.
Visual execution is deliberately out of scope here: the locale-neutral visual seed
lives in each manifest beat's `visual_intent`, and the full shot plan is
`storyboard.md` (`skills/04-storyboard.md`). The full doctrine — opening formulas,
sentence types, positioning, benefit framing — lives in `docs/golden-rules.md` (Hook
and Body sections); the required sections below are its script structure made
mandatory.

## Inputs

- `manifest.yml`, `brief.md`, `cover.<locale>.md` (the promise being paid off)
- Target locale(s) and platform(s)
- Series positioning from `series.yml`
- `docs/golden-rules.md`, `docs/localization.md`

## Outputs

- Beats added to `manifest.yml` (IDs, purpose, visual intent, overlay, per-locale
  `target_duration_sec`)
- `script.en-US.md` and/or `script.zh-CN.md`
- Suggested title/hook adjustments fed back into the cover files if the script found a
  stronger angle

## Script structure (required sections)

1. **Hook** — lands in ≤ 2 seconds
2. **User problem** — the viewer recognizes themselves
3. **Core conclusion** — stated early, not saved for the end
4. **Key points** — usually three; each one earns its seconds
5. **Personal experience** — proof in service of the viewer's benefit
6. **Checklist** — the saveable artifact
7. **Follow expectation** — the designed reason to follow

## Steps

1. Define/confirm beats in `manifest.yml`. Beat IDs are stable slugs (`hook`, `problem`,
   `conclusion`, `point-1`…, `experience`, `checklist`, `cta`). Every script line will
   belong to a beat.
2. Write the script per locale: copy `templates/episode/script.template.md` to
   `script.<locale>.md`, fill the `{{...}}` tokens, then write each beat's spoken lines
   and on-screen subtitle emphasis words. Visual ideas that surface while writing go
   into the beat's `visual_intent` in the manifest, not the script.
3. Set per-locale `target_duration_sec` per beat; zh-CN typically runs 10–20% shorter.
4. Read the script aloud mentally at speaking pace; verify total duration against the
   platform sweet spot (`docs/platforms.md`).
5. Cut filler. Then cut again. Every sentence moves information forward.
6. Update manifest `status: scripting`; run `node tools/validate.mjs`.

## Rules

- The hook uses one of the four opening formulas: A pain point, B identity contrast,
  C benefit promise, D counterintuitive claim. Never a self-introduction.
- Every sentence is one of the six functional types — pain point, conclusion, reversal,
  value, case, action. A sentence that is none of them gets cut. The filler blacklist
  in `docs/golden-rules.md` ("Today let's talk about…", "Many people may not know…",
  "Next I'll share…", "This is actually very important…", "Personally, I think…" and
  their zh-CN equivalents) never survives a draft.
- Positioning is embedded, never introduced: compress experience into a signal
  ("I bought the wrong first bike myself, so this only covers the regrets"), not a bio.
- Everything frames as viewer benefit: "what my experience helps you avoid",
  never "what happened to me".
- The core conclusion appears in the first third of the video.
- Each locale is written natively — see `docs/localization.md` for what may differ and
  what must stay shared. Writing one locale by translating the other is a review failure.
- Mark subtitle emphasis words in the script (bold) — the subtitle pass
  (`skills/07-subtitles-localization.md`) builds on them.
- Personal experience earns its place only as proof of the viewer benefit.

## Done criteria

- Viewer benefit is explicit and identical in intent across locales.
- All required sections present; every line assigned to a beat that exists in the
  manifest.
- Save/comment/follow motivation is concrete (what exactly gets saved? commented?).
- No filler sentences survive a delete-test read.
- `node tools/validate.mjs` passes with `status: scripting`.
