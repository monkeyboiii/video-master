# S{NN} — {Season name}

<!--
  A season README is what makes its number mean anything. `S03E003` reads as "the third episode of
  the 100-track challenge" only because series/S03/README.md says that is what S03 is. Without this
  file the id is two numbers, which is why `tools/vm check` requires it.

  KEEP IT SHORT — one screen. The bar is: a reader who has never seen the repo learns what the
  season is and why its episodes belong together, WITHOUT opening an episode. Everything past that
  makes the file less likely to be read, which costs more than the detail was worth.

  DOES NOT BELONG HERE, however true:
    - production quirks — TTS, translation, splices, codecs, frame sync   -> the episode's
      edit-notes.md, or agents.d/modules/{localization,captions,voice-and-render-qc}.md
    - how a cut was assembled, per-beat timings, asset ids                -> manifest.yml
    - anything that is about ONE episode and not about the season

  State only what a file supports. A claim you cannot trace to a manifest, brief or edit-note is a
  defect here, not colour.
-->

One paragraph: what this season is, and what every episode in it repeats.

## Episodes

| ID | Slug | What it is | Status |
|---|---|---|---|
| E001 | `some-slug` | one sentence — what a viewer gets | `topic` |

## Lineage

Only if episodes here follow or answer episodes elsewhere. `tools/vm tree` prints the edges; this
says why they exist.

## Where it stands

Two to four bullets. What has shipped, and what a producer must not walk past — an uncleared bed,
an unanswered release question, a status that is stale. Specificity here is the difference between
a doc and a brochure.
