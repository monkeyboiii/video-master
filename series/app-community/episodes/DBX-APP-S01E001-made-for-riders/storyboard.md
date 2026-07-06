# Storyboard & Shot Plan — DBX-APP-S01E001

<!-- EXECUTION layer. Draft — edit freely. Style: modern/minimal transitions +
     subtitles; animation-heavy ONLY on the three feature explainers (SH040–060).
     Rules: skills/04-storyboard.md · naming: docs/naming-conventions.md -->

Session budget: ~1 hr (1 staged B-roll + founder facecam + 3 screen-records + 1 graphic)  ·  Cameras: phone (facecam), device screen capture

## Shot-by-shot breakdown (timeline order)

| SH | Beat | Frame / composition | Action | Transition in | Caption / overlay | SFX intent | Camera token |
|----|------|---------------------|--------|---------------|-------------------|------------|--------------|
| SH010 | hook | MCU of the doubter, handheld, slightly chaotic | partner/coworker throws hands up, yells the line | cold open | burned sub: "Nobody cares about your dirt bike!" | the raw yell, room tone | broll |
| SH020 | i-do | founder CU, centered, locked off, dead still | deadpan: "I do." | hard cut | "I do." | bass drop / hit on the cut | facecam |
| SH030 | pivot | founder → app home screen | whip from face into the app opening / wall of riders | whip pan | MADE FOR RIDERS (hook-title) | whoosh | facecam + screenrec |
| SH040 | features | app screen-record, full-bleed | language switcher cycles EN → 中文 → ES → … | hard cut | 10 LANGUAGES (animated stamp) | click ×3 | screenrec |
| SH050 | features | app post composer, screen-record | copy a YouTube/IG link → paste → embed renders with a play button | hard cut | PASTE. IT'S THERE. (animated stamp) | pop on paste + whoosh on render | screenrec |
| SH060 | features | rider profile/post, screen-record | a normal rider's post lights up with a sponsor / airtime badge | hard cut | SPONSORSHIP FOR ALL (animated stamp) | ding / shine | screenrec |
| SH070 | cta | logo lockup end card (Remotion) | stable hold; loop-safe last frame | clean snap cut | DOWNLOAD · @dirtbikex (cta-card) | music resolve | endcard |

<!-- Retention cadence: a cut/stamp every 1–2s throughout; the three feature demos are
     the pattern-interrupt core. Nothing sits static >2s except the CTA hold. -->

## Shooting order (grouped by setup)

### A. Founder facecam (one sit-down)

- SH020 "I do" — nail the deadpan; several takes, the calmer the better.
- SH030 pivot line — the whip start; shoot looking into lens, then a fast head/camera move to motivate the whip into the app.

### B. Device screen-records (captured on phone)

- SH040 language cycle · SH050 paste→embed reveal (the money shot — get a clean paste and a crisp embed pop) · SH060 sponsor/airtime badge.
- Record at 1080×1920, 60fps if possible (smoother slow-in on the reveals).

### C. Staged B-roll

- SH010 the "nobody cares" yell — a real person, handheld, unpolished. Good take = the yell reads as exasperated-real, not acted.

### D. Graphic (no shoot)

- SH070 end card rendered from Remotion (cta-card + logo lockup).

## Post-shoot

- [ ] Files renamed: `DBX-APP-S01E001_SH###_TK##_<token>.<EXT>`
- [ ] Every file recorded in manifest `assets.raw` with external_uri
- [ ] Probed with `node tools/probe-media.mjs`; durations/resolutions noted
- [ ] Deviations from this plan noted per shot (they feed edit-notes.md)

## Graphics to build before render (not in the design system yet)

- **feature-callout** — the animated text stamp for SH040–060 (10 LANGUAGES / PASTE.
  IT'S THERE. / SPONSORSHIP FOR ALL). Animation-heavy, brand-styled. New Remotion
  component via the design-system path (`skills/05`).
- **cta-card `download` action** — the component's action is currently
  save/comment/follow; this launch needs a `download` variant. Small component change.
