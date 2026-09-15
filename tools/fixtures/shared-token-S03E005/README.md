# Fixture: one whisper token spanning several script words, and its known answer

From the same S03E005 pass as `../dropped-word-S03E005/` — a DIFFERENT failure mode, found by
scanning the whole document for it once one instance turned up. That fixture is "whisper found no
token at all for a script word" (the reverse-anchor problem, O69). This one is "whisper's token
boundary doesn't line up with the script's word boundary" — group-words has no bug finding the
anchor, the anchor itself just isn't as fine-grained as the script wants it to be.

## The mechanism

`whisper-raw-excerpt.json` is `Caption[]` as `tools/transcribe.mjs` writes it — ALREADY
multi-character per entry (`"的时候"`, `"你在"`, `"真的是"`), one `startMs`/`endMs` pair per TOKEN.
`group-words.mjs` explodes each entry's `text` into individual characters for its LCS match
(`[...String(c.text)]`), but every exploded character keeps its PARENT token's identical span —
there is no attempt to subdivide a token's time across the characters within it, because nothing
downstream needed that until a script word boundary fell inside one.

That's fine when the script's own word boundaries agree with whisper's token boundaries. It breaks
when they don't: if the script writes `真的 是` as two words, and whisper's token was `真的是` as
one, group-words assigns BOTH resulting words the token's exact span — not sequential slices of
it. Two captions silently claim the identical moment.

## The three instances, and the known-good split

| Script words | Token (whisper-raw-excerpt.json) | Bug (before fixing) | Known-good split |
|---|---|---|---|
| 的 / 时候 | `"的时候"` 21020-21480 (460ms, 3 chars) | both 21020-21480 | 的: 21020-21173 (1/3); 时候: 21173-21480 (2/3) |
| 你 / 在 | `"你在"` 27690-28190 (500ms, 2 chars) | both 27690-28190 | 你: 27690-27940 (1/2); 在: 27940-28190 (1/2) |
| 真的 / 是 | `"真的是"` 35940-36500 (560ms, 3 chars) | both 35940-36500 | 真的: 35940-36313 (2/3); 是: 36313-36500 (1/3) |

The split is proportional by character count within the shared token — the only signal available
once the token itself carries no finer timing. Not claimed to be more precise than that: a correct
fix should reproduce this proportional split, not a more exact one, since the source data has
nothing finer to offer.

## What a fix needs to detect

After group-words' normal per-character assignment, any two (or more) CONSECUTIVE words whose
final span is identical — same `startMs` AND `endMs` — are candidates for this class. `is-anchor`
status alone won't catch it (every character in a shared token IS anchored, correctly, to real
whisper data); only comparing adjacent words' spans does. `build-captions.mjs`'s own check (added
alongside this fixture) does exactly that comparison, after overrides are applied — a fix inside
group-words.mjs itself should do the same comparison before any manual override is needed.

## Why this needs its own fixture, not just the dropped-word one

An implementation tested only against `../dropped-word-S03E005/` would correctly handle "no token
found" and still ship broken on this class — the failure mode, the detection signal (identical
spans vs. missing anchors), and the fix (proportional split of a shared span vs. recovering a
collapsed one) are all different. Found and verified 2026-09-15 — see S03E005's
`build-captions.mjs` git history (commit "a systematic alignment audit") for the full context, and
`ops/findings.toml` O69/O71/O72 for what still needs building.
