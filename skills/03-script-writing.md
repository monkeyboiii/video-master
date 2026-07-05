# Skill: Script Writing (脚本)

## Purpose

Create high-retention DirtBikeX scripts. Beats are defined once (locale-neutral);
each locale's script is then written natively against those beats.

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
   `script.<locale>.md`, fill the `{{...}}` tokens, then write each beat's spoken lines,
   on-screen subtitle emphasis words, and visual notes.
3. Set per-locale `target_duration_sec` per beat; zh-CN typically runs 10–20% shorter.
4. Read the script aloud mentally at speaking pace; verify total duration against the
   platform sweet spot (`docs/platforms.md`).
5. Cut filler. Then cut again. Every sentence moves information forward.
6. Update manifest `status: scripting`; run `node tools/validate.mjs`.

## Rules

- First 2 seconds hit pain point, contrast, benefit, or counterintuitive claim. Never a
  self-introduction.
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
