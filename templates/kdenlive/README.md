# Kdenlive template seeds

Small `.kdenlive` seed projects with the house track layout:

```text
V1 footage · V2 overlays · V3 spare · A1 voiceover · A2 music/SFX
```

Rules (from `skills/06-kdenlive-editing.md` and the file-format research):

- A seed is **saved by the pinned Kdenlive version** on the editing machine, with media
  referenced by relative paths, then committed here. Record the Kdenlive version in the
  filename: `vertical-9x16_kdenlive-25.04.kdenlive`.
- Seeds are generate-once artifacts. Kdenlive rewrites the whole XML on save — never
  hand-edit, diff, or merge a Kdenlive-saved file; replace it.
- Working timelines live in `media/timelines/` (git-ignored), never here.
- Programmatic rough cuts, if built later, target OpenTimelineIO import
  (Kdenlive ≥ 25.04), not generated `.kdenlive` XML.

No seed is committed yet: create the first one from the editing machine once the pinned
Kdenlive version is decided.
