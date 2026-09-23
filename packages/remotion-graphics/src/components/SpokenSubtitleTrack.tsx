import {measureText} from '@remotion/layout-utils';
import {zTextarea} from '@remotion/zod-types';
import React, {useMemo} from 'react';
import {AbsoluteFill, Sequence, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {FPS, localeSchema, overlayMetadata, type Locale} from '../shared';
import {bodyFont} from '../theme/fonts';
import {
  captionRoom,
  captionSize,
  captionStyleSchema,
  parseWords,
  SpokenSubtitle,
  wordGap,
  type Word,
} from './SpokenSubtitle';

/**
 * A whole narration as spoken captions: one line on screen at a time, cut between them.
 *
 * WHY SENTENCES ARE THE CUT. A sentence boundary is where the voice already pauses, so a cut
 * there reads as punctuation rather than as an edit. A sentence is a blank-line-separated block.
 * Within it, one `text|startMs|endMs` row per word — exactly the Caption[] shape
 * `tools/transcribe.mjs` writes, so a real transcription can be pasted in with only the blank
 * lines added. A fourth field of `*` marks a word as important.
 *
 * AND WHY THE TRACK ALSO CUTS. `SpokenSubtitle` draws at a fixed size and never wraps, so a
 * sentence wider than the safe zone would simply run off the frame. The track measures each
 * sentence at that fixed size and, when it does not fit, splits it into two — at the word
 * boundary that leaves the two halves closest to equal width, so neither half looks like a
 * leftover. It recurses, so a very long sentence becomes as many parts as it needs. This is the
 * replacement for shrinking the type to fit: the reader gets the same size on every line and
 * more lines, instead of one line nobody can read.
 *
 * A LINE HOLDS BRIEFLY PAST ITS LAST HIGHLIGHT — UNLESS THE GAP TO THE NEXT LINE IS WIDE.
 *
 * Two wrong answers came before this one. First the line held until the NEXT line started, so a
 * finished caption sat for seconds over a picture that had moved on. Then the knob was removed
 * entirely — clear on the exact frame the last highlight goes out, no tail at any length — because
 * a tail past a line's own natural end is a distinct beat with the line present and nothing lit,
 * which reads as forgotten rather than ended. That was right about a WIDE gap and wrong about a
 * narrow one: an abrupt vanish right before a short, ordinary pause reads as its own kind of
 * artefact, just as noticeable as an unwarranted tail.
 *
 * So, in priority order:
 *   1. The line tracks its own speech. `fromMs`/the last word's `endMs` are never invented.
 *   2. Past the last highlight, a gap under `HOLD_GAP_MS` holds IN FULL — the line stays up until
 *      the next line's own start, so THIS NEVER DELAYS THE INCOMING LINE (a hold that pushed the
 *      next line's appearance later would just move the artefact, not remove it) and never leaves
 *      a blank frame either.
 *   3. A gap at or over `HOLD_GAP_MS` still holds a SMALL floor, `MIN_HOLD_FRAMES` — it does not
 *      clear on the exact frame the last highlight does. Found on S03E005 (花样精实透 →
 *      但如果我告诉你): a word's measured `endMs` is a boundary the aligner drew, not a guarantee
 *      that nothing audible continues a beat past it — a hard cut right there reads as the line
 *      being cut off mid-breath, not as a clean ending. `MIN_HOLD_FRAMES` is deliberately much
 *      smaller than `HOLD_GAP_MS`, so a genuinely long silence still clears well before the next
 *      line and the forgotten-caption artefact the old (zero-hold) rule was written against does
 *      not come back.
 *
 * ONE threshold governs whether the hold is FULL (to the next line) or FLOOR (a few frames);
 * `MIN_HOLD_FRAMES` is not a second gap-length to tune against `HOLD_GAP_MS` — it is clamped with
 * `Math.min` against the next line's own start, so it can never produce the hold-then-blank
 * flicker a two-independent-threshold design risked (dbx-oracle caught that shape once already,
 * for a since-removed 150ms/200ms pair): whatever `MIN_HOLD_FRAMES` is set to, the worst case is
 * it collapses into a full hold, never into a gap with nothing on screen.
 *
 * `HOLD_GAP_MS` was raised from 200ms to 600ms on S03E005, 2026-09-23, after a measurement — not
 * a feel — showed 200ms was picked against the WRONG data. whisper.cpp's interpolated timing
 * (superseded by MFA, see "A word is whatever a row is" in captions.md) chained sentences with a
 * 0ms gap at 16 of 19 transitions — an artefact of the old interpolation, not a real silence — so
 * every transition held in full under the 200ms rule almost by accident. MFA measures the REAL
 * acoustic pause between sentences, and on this episode every one of the 19 within-narration gaps
 * came back 190-520ms — genuinely non-zero, and past 200ms for all but one of them. Compared
 * side by side against the whisper-token render (identical code, older data), the 200ms threshold
 * now read as worse than the old always-hold behaviour it replaced: it dismissed the line into a
 * visible blank for nearly every ordinary sentence-to-sentence breath, not just the rare long
 * silence the rule exists for. 600ms sits with headroom above the measured 520ms max, so every
 * observed within-narration pause on this episode holds in full — while staying an order of
 * magnitude below the multi-second cross-BEAT gap the original no-hold rule was protecting
 * against, so that artefact does not come back either. Still a per-episode measurement standing
 * in for a global default, same as 200ms was — re-measure against a differently-paced episode
 * before trusting this number there.
 */
const HOLD_GAP_MS = 600;
const MIN_HOLD_FRAMES = 5;
export const spokenSubtitleTrackSchema = z.object({
  locale: localeSchema,
  /** Sentences separated by a blank line; `text|startMs|endMs[|*]` per word within each. */
  script: zTextarea(),
  durationSec: z.number(),
  fontSize: z.number().optional(),
  /** Defaults per locale: en `plain`, zh `band`. See SpokenSubtitle. */
  captionStyle: captionStyleSchema.optional(),
});

export type SpokenSubtitleTrackProps = z.infer<typeof spokenSubtitleTrackSchema>;

const parseBlocks = (script: string): Word[][] =>
  script
    .split(/\n\s*\n/)
    .map((b) => parseWords(b))
    .filter((ws) => ws.length > 0)
    .sort((x, y) => x[0].startMs - y[0].startMs);

/**
 * Split one sentence into parts that each fit `room`, cutting where the two sides come out most
 * nearly equal. A single word that does not fit is returned as-is — there is nothing left to cut,
 * and a silently dropped caption is worse than one that overhangs.
 */
const splitToFit = (
  ws: Word[],
  width: (ws: Word[]) => number,
  room: number,
): Word[][] => {
  if (ws.length < 2 || width(ws) <= room) return [ws];
  let cut = 1;
  let best = Infinity;
  for (let i = 1; i < ws.length; i++) {
    const d = Math.abs(width(ws.slice(0, i)) - width(ws.slice(i)));
    if (d < best) {
      best = d;
      cut = i;
    }
  }
  return [
    ...splitToFit(ws.slice(0, cut), width, room),
    ...splitToFit(ws.slice(cut), width, room),
  ];
};

const toRows = (ws: Word[], baseMs: number): string =>
  ws
    .map(
      (w) =>
        `${w.text}|${w.startMs - baseMs}|${w.endMs - baseMs}${w.important ? '|*' : ''}`,
    )
    .join('\n');

export const SpokenSubtitleTrack: React.FC<SpokenSubtitleTrackProps> = ({
  locale,
  script,
  fontSize,
  captionStyle,
}) => {
  const {width: canvas, height: canvasH} = useVideoConfig();
  const family = bodyFont(locale as Locale);
  const size = captionSize(locale as Locale, fontSize);
  const gap = wordGap(locale as Locale, size);
  const room = captionRoom(canvas, canvasH);

  const parts = useMemo(() => {
    const lineWidth = (ws: Word[]) =>
      ws.reduce(
        (a, w) =>
          a +
          measureText({
            text: w.text,
            fontFamily: family,
            fontSize: size,
            fontWeight: '800',
          }).width,
        0,
      ) + gap * Math.max(0, ws.length - 1);
    return parseBlocks(script).flatMap((b) => splitToFit(b, lineWidth, room));
  }, [script, family, size, gap, room]);

  return (
    <AbsoluteFill>
      {parts.map((ws, i) => {
        const fromMs = ws[0].startMs;
        const from = Math.round((fromMs / 1000) * FPS);
        const ownEndMs = ws[ws.length - 1].endMs;
        const ownEnd = Math.round((ownEndMs / 1000) * FPS);
        const next = parts[i + 1];
        // Priority 2/3 — see the header. No next line: still holds MIN_HOLD_FRAMES, same as any
        // wide-gap line — there's no next line to delay, only the same abrupt-vanish risk to avoid.
        // Classified in MILLISECONDS, from the raw word timestamps, not by comparing two
        // independently-rounded frame numbers: rounding ownEndMs and nextStartMs to frames
        // separately before subtracting can drift by up to a frame each, which can push a
        // genuinely-under-threshold gap (e.g. a real 199ms gap) across the line. `until` itself
        // still lands on a real frame (nextFrom, already rounded) — only the classification
        // avoids the double rounding.
        const nextStartMs = next ? next[0].startMs : ownEndMs;
        const nextFrom = Math.round((nextStartMs / 1000) * FPS);
        const gapMs = nextStartMs - ownEndMs;
        const holdsInFull = gapMs > 0 && gapMs < HOLD_GAP_MS;
        const minHoldUntil = ownEnd + MIN_HOLD_FRAMES;
        const until = next
          ? (holdsInFull ? nextFrom : Math.min(nextFrom, minHoldUntil))
          : minHoldUntil;
        return (
          <Sequence
            key={i}
            from={from}
            durationInFrames={Math.max(1, until - from)}
          >
            <SpokenSubtitle
              locale={locale}
              // timings inside SpokenSubtitle are relative to its sequence
              words={toRows(ws, fromMs)}
              durationSec={Math.max(1, until - from) / FPS}
              fontSize={fontSize}
              captionStyle={captionStyle}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

export const spokenSubtitleTrackMetadata =
  overlayMetadata<SpokenSubtitleTrackProps>(20);
