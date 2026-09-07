import {zTextarea} from '@remotion/zod-types';
import React, {useMemo} from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {z} from 'zod';
import {FPS, localeSchema, overlayMetadata} from '../shared';
import {SpokenSubtitle} from './SpokenSubtitle';

/**
 * A whole narration as spoken captions: one sentence on screen at a time, cut between them.
 *
 * WHY SENTENCES ARE THE CUT. `SpokenSubtitle` never wraps, so a long line gets small rather than
 * tall. That makes "too long" visible instead of ugly — and the fix is a cut, not a smaller face.
 * Splitting on sentence boundaries puts the cut where the voice already pauses, so it reads as
 * punctuation rather than as an edit.
 *
 * A sentence is a blank-line-separated block. Within it, one `text|startMs|endMs` row per word,
 * exactly the Caption[] shape `tools/transcribe.mjs` writes — so a real transcription can be
 * pasted in with only the blank lines added.
 *
 * Each sentence holds until the next one starts rather than vanishing at its own last word: a
 * caption that disappears the instant it is spoken is unreadable, and the gap reads as a dropped
 * frame.
 */
export const spokenSubtitleTrackSchema = z.object({
  locale: localeSchema,
  /** Sentences separated by a blank line; `text|startMs|endMs` per word within each. */
  script: zTextarea(),
  durationSec: z.number(),
  fontSize: z.number().optional(),
  litText: z.boolean().optional(),
  /** Frames to keep the last sentence up after its final word. */
  tailFrames: z.number().optional(),
});

export type SpokenSubtitleTrackProps = z.infer<typeof spokenSubtitleTrackSchema>;

type Block = {rows: string; fromMs: number; toMs: number};

const parseBlocks = (script: string): Block[] =>
  script
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((b) => {
      const times = b
        .split('\n')
        .map((l) => l.split('|'))
        .filter((p) => p.length >= 3);
      const starts = times.map((p) => Number(p[1]));
      const ends = times.map((p) => Number(p[2]));
      return {
        rows: b,
        fromMs: Math.min(...starts),
        toMs: Math.max(...ends),
      };
    })
    .sort((x, y) => x.fromMs - y.fromMs);

export const SpokenSubtitleTrack: React.FC<SpokenSubtitleTrackProps> = ({
  locale,
  script,
  fontSize,
  litText,
  tailFrames = 12,
}) => {
  const blocks = useMemo(() => parseBlocks(script), [script]);

  return (
    <AbsoluteFill>
      {blocks.map((b, i) => {
        const from = Math.round((b.fromMs / 1000) * FPS);
        // hold until the next sentence starts; the last one gets a short tail
        const nextFrom = blocks[i + 1]
          ? Math.round((blocks[i + 1].fromMs / 1000) * FPS)
          : Math.round((b.toMs / 1000) * FPS) + tailFrames;
        const durationInFrames = Math.max(1, nextFrom - from);
        // timings inside SpokenSubtitle are absolute, so rebase them onto the sequence
        const rebased = b.rows
          .split('\n')
          .map((l) => {
            const [t, a, z] = l.split('|');
            return `${t}|${Number(a) - b.fromMs}|${Number(z) - b.fromMs}`;
          })
          .join('\n');
        return (
          <Sequence key={i} from={from} durationInFrames={durationInFrames}>
            <SpokenSubtitle
              locale={locale}
              words={rebased}
              durationSec={durationInFrames / FPS}
              fontSize={fontSize}
              litText={litText}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

export const spokenSubtitleTrackMetadata =
  overlayMetadata<SpokenSubtitleTrackProps>(20);
