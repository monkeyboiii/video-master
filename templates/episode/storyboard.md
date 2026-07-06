# Storyboard & Shot Plan — {{VIDEO_ID}}

<!-- The EXECUTION layer (分镜执行稿): how each shot is framed, captured, cut,
     captioned, and scored. Built from manifest beats + the reading scripts.
     This is the plan; what actually happened lands in edit-notes.md.
     Rules: skills/04-storyboard.md · naming: docs/naming-conventions.md -->

Session budget: ___ (from human)  ·  Cameras: ___

## Shot-by-shot breakdown (timeline order)

| SH | Beat | Frame / composition | Action | Transition in | Caption / overlay | SFX intent | Camera token |
|----|------|---------------------|--------|---------------|-------------------|------------|--------------|
| SH010 | hook | | | hard cut | hook-title | | gopro-front |
| SH020 | | | | | | | |

<!-- Shots step by 10 (pickups slot between: SH015). Footage is shared across
     locales by default — mark "(zh-CN only)" in Action for exceptions.
     Transition and SFX vocabulary from docs/golden-rules.md (Edit 剪辑); plan
     coverage for a pattern interrupt every 1–3s: a second angle or detail insert
     per beat. Caption / overlay names a composition (hook-title, checklist-card, …),
     an on-screen text intent, or "-". -->

## Shooting order (grouped by location/setup for the session)

### Location / setup 1:

- Shots: SH010, SH030, …
- Per shot, one line: what "good take" means · must-hear audio (if VO is live)

### Location / setup 2:

<!-- Mandatory coverage: the cover/first-frame shot (cover.*.md), one safety wide
     per location, B-roll for the checklist beat. -->

## Post-shoot

- [ ] Files renamed: `{{VIDEO_ID}}_SH###_TK##_<token>.<EXT>`
- [ ] Every file recorded in manifest `assets.raw` with external_uri
- [ ] Probed with `node tools/probe-media.mjs`; durations/resolutions noted
- [ ] Deviations from this plan noted per shot (they feed edit-notes.md)
