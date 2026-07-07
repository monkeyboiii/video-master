import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {z} from 'zod';
import {exitFade} from '../shared';
import {bone, dirt, moto, SAFE_ZONE, scrim} from '../theme/tokens';
import {displayFont} from '../theme/fonts';

const captionWordSchema = z.object({
  t: z.string(), // the word (include trailing punctuation)
  s: z.number(), // start time in seconds, relative to this overlay
  e: z.enum(['brand', 'harsh']).optional(), // emphasis color
});

export const kineticCaptionsSchema = z.object({
  durationSec: z.number(),
  words: z.array(captionWordSchema),
  fontScale: z.number().default(1),
  /** Max words shown at once (older ones scroll off). Kept small = one line. */
  window: z.number().default(6),
});

export type KineticCaptionsProps = z.infer<typeof kineticCaptionsSchema>;

const colorFor = (e?: 'brand' | 'harsh'): string =>
  e === 'brand' ? dirt[400] : e === 'harsh' ? moto.red : bone[50];

/**
 * Streaming captions: words appear one-by-one as spoken (like a message typing
 * out), accumulate in a rolling window, keyword-colored. Bottom-anchored above
 * the platform safe zone. Rendered as a ProRes 4444 alpha overlay for Kdenlive.
 */
export const KineticCaptions: React.FC<KineticCaptionsProps> = ({
  words,
  fontScale,
  window: win,
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const t = frame / fps;

  const revealedIdx: number[] = [];
  words.forEach((w, i) => {
    if (t >= w.s) revealedIdx.push(i);
  });
  const shown = revealedIdx.slice(-win);

  const opacity =
    interpolate(frame, [0, 3], [0, 1], {extrapolateRight: 'clamp'}) *
    exitFade(frame, durationInFrames);
  const fontSize = 60 * fontScale;

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: SAFE_ZONE.bottom + 24,
        paddingLeft: 40,
        paddingRight: 40,
        opacity,
      }}
    >
      <div
        style={{
          background: scrim(0.6),
          borderRadius: 22,
          padding: '14px 26px',
          display: 'flex',
          flexWrap: 'nowrap',
          whiteSpace: 'nowrap',
          justifyContent: 'center',
          alignItems: 'baseline',
          gap: '0 16px',
          maxWidth: 1000,
          overflow: 'hidden',
        }}
      >
        {shown.map((i, k) => {
          const w = words[i];
          const wf = frame - w.s * fps;
          const appear = interpolate(wf, [0, 6], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const pop = interpolate(wf, [0, 4, 9], [0.62, 1.12, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const isLatest = i === shown[shown.length - 1];
          const ageFade = k === 0 && shown.length >= win ? 0.4 : 1;
          return (
            <span
              key={i}
              style={{
                fontFamily: displayFont('en-US'),
                fontWeight: 800,
                fontSize,
                lineHeight: 1.18,
                color: colorFor(w.e),
                opacity: appear * ageFade,
                transform: `translateY(${(1 - appear) * 18}px) scale(${
                  isLatest ? pop : 1
                })`,
                textShadow: '0 2px 10px rgba(0,0,0,0.55)',
                display: 'inline-block',
              }}
            >
              {w.t}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
