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
 * Each part holds until the next one starts rather than vanishing at its own last word: a caption
 * that disappears the instant it is spoken is unreadable, and the gap reads as a dropped frame.
 */
export const spokenSubtitleTrackSchema = z.object({
  locale: localeSchema,
  /** Sentences separated by a blank line; `text|startMs|endMs[|*]` per word within each. */
  script: zTextarea(),
  durationSec: z.number(),
  fontSize: z.number().optional(),
  /** Frames to keep the last line up after its final word. */
  tailFrames: z.number().optional(),
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
  tailFrames = 12,
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
        // hold until the next line starts; the last one gets a short tail
        const next = parts[i + 1];
        const until = next
          ? Math.round((next[0].startMs / 1000) * FPS)
          : Math.round((ws[ws.length - 1].endMs / 1000) * FPS) + tailFrames;
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
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

export const spokenSubtitleTrackMetadata =
  overlayMetadata<SpokenSubtitleTrackProps>(20);
