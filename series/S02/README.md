# S02 — Music-Synced Identity Cuts

Season 2 of the `app-community` series is the season with nobody talking in it. Both episodes begin from footage that was already shot and already cut to a music track, so the production work here is an overlay pass laid on an existing timeline — the storyboards record where a graphic lands, not where a camera goes. Neither manifest carries a voiceover asset, and both explain themselves in the same words: `music-synced montage; no spoken VO`.

What the two episodes have in common beyond that is what they are trying to prove. Neither is an explainer; each builds the DirtBikeX identity out of a suited rider, the mark, and the founder. E001 runs helmet-and-gear, an app-utility overlay reused from S01E002, Rubio's profile card, and closes on the app icon. E002 stages a joke — the identical desk coding done in ordinary clothes, then in full MX kit — and converts the rider's pointing gestures into four orange X marks that collapse on a clap into the DirtBikeX wordmark. Both end the same way: wordmark above the helmet, profile card beside it. Both draw every graphic from the same two tracked SVGs, `DirtBikeX.svg` and `orange-X.svg`, rasterized at the size the edit needs rather than shipped as PNG variants.

## Episodes

| ID | Slug | What it is | Status |
|---|---|---|---|
| E001 | `synced-app-flavor` | 22.55s at 60fps: fingertip X callouts, a gear-up run, the reused `21 languages` / `Post once` app proof, Rubio's profile card, closing on the app icon before the source blackout. | `qc` |
| E002 | `suit-on-full-throttle` | 27.133s at 30fps: the same desk work without the suit and then in full race kit, handing off to a palm mark, four corner X's, and a clap that forms the DirtBikeX logo. | `topic` |

## Where the season actually stands

Nothing here is published. `outputs.published` is empty in both manifests, as are `covers` and `kdenlive`. Each episode names exactly one en-US review export, and neither declares a zh-CN variant, although the series' `default_platforms` defines one.

E001 is at `qc` with a recorded verdict of PASS-WITH-NOTES in its `edit-notes.md`. The review export is 1080x1920, 60fps, 22.55s trimmed at the first black frame, HEVC Main10 HLG/BT.2020 — but the source's Dolby Vision RPU does not survive compositing, so the export is HLG HDR, not Dolby Vision. Two notes are still open: the safe zones want a look on an actual phone before publish, and the pre-generated `*-balanced` / `*-soft` PNGs under `assets/` are dead inputs to be removed once the pass is signed off.

E002 declares `status: topic`, and its paperwork matches: `brief.md` is still the blank template — no viewer, no pain point, no five-dimension scores — and the `script.en-US.md`, `cover.en-US.md` and `subtitles/en-US.srt` its manifest names do not exist on disk. The edit runs well ahead of that label. Hard cuts and action beats are measured frame by frame, the four corner anchors are resolved and locked, the Remotion props are written, and `render-review.sh` is in place. The manifest states the gate plainly: script and cover are next.

Both episodes are blocked on the same unresolved question. `MUS_001` in each is the music already embedded in the source, and both carry the line `DECIDE: confirm background music is cleared for commercial social use before final publish`. Neither episode can publish until that is answered.

## What carries between episodes

The colour contract is the one non-negotiable. Graphics are sRGB and the timeline is HLG/BT.2020, so every graphic layer is converted colorimetrically (`npl=203`, the BT.2408 reference white) and composited in 10-bit RGB, never graded and never dimmed. E001 measured why: stamped raw, all three orange gradient stops collapse to a flat `(255,0,0)` — the gradient is destroyed, not shifted, and no amount of opacity tuning brings it back. E002's render script cites the same contract by name and inherits it unchanged.

Sources are not uniform, so probe before assuming. E001 is 1440x2560 at 60fps with 48 kHz audio; E002 is 1440x2560 at 30fps with 44.1 kHz audio that needs resampling on delivery, and it carries burned-in captions of its own — `Pov: without the suit`, `Now with the suit!`, `Compiled!`, `Zenkai! Full throttle!` — which no added overlay may collide with. E001's props could all be static stamps because its opening segments are frozen stills; E002's cannot, because the hand moves inside the shot.

Asset reuse runs one way and then stops. E001 copied S01E002's flattened feature and profile-card MOVs in directly, deliberately, as brand continuity. E002 rebuilds the profile card from the Remotion `profile-card` composition against `public/e002/rubio-profile.jpg` rather than salvaging E001's flattened copy, and moves its animated props into Remotion as `BrandForm` and `MarkPop`. That is the direction for whoever produces the next episode: Remotion for anything that moves, in-graph rasterized SVG for anything that does not.

The footage is not in this repo. `media/**` is gitignored; only the manifests name what lives out there.
