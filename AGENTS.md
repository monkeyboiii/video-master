# AGENTS.md — DirtBikeX video-master

The repo contract. Everything an agent needs about this repo is under `agents.d/` — shape and
rules in the harness's `playbook/agents-d.md`.

- Read `agents.d/modules/toolline.md` once: this repo makes **parts of a video**, not a video,
  and that doc says what it deliberately does not do. Then read only the job you were asked for.
- **Splice narration, place sound effects, QC a render** → `voice-and-render-qc.md`.
  **Subtitles for a cut** → `captions.md`. **An overlay, segment or background asset** →
  `remotion-overlays.md`. Names, locales and episode flow → `naming-conventions.md`,
  `localization.md`.
- `dbx docs list video-master` is the index; `dbx docs find NAME` resolves a doc by its current
  or former name. Repo-only gotchas are in `agents.d/memory/MEMORY.md`.
- `repos.toml` declares `verify = "tools/vm check"` — that is what `dbx check` runs here.
