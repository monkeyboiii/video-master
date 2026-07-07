import React from 'react';
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {z} from 'zod';
import {exitFade} from '../shared';
import {bone, scrim, xGradientCss} from '../theme/tokens';
import {monoFont} from '../theme/fonts';

export const brandTitleSchema = z.object({
  durationSec: z.number().default(2),
  /** Optional mono kicker under the logo, e.g. "the app for riders". */
  tagline: z.string().optional(),
});

export type BrandTitleProps = z.infer<typeof brandTitleSchema>;

/**
 * The DirtBikeX logo lockup (white wordmark + orange X) slamming in over footage.
 * Replaces the old text "Made For Riders" hook-title as the brand stamp.
 */
export const BrandTitle: React.FC<BrandTitleProps> = ({tagline}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const logoIn = spring({
    frame,
    fps,
    config: {damping: 13, mass: 0.7},
    durationInFrames: 22,
  });
  const sweep = spring({
    frame: frame - 8,
    fps,
    config: {damping: 200},
    durationInFrames: 14,
  });
  const opacity =
    interpolate(frame, [0, 4], [0, 1], {extrapolateRight: 'clamp'}) *
    exitFade(frame, durationInFrames);

  return (
    <AbsoluteFill
      style={{justifyContent: 'center', alignItems: 'center', opacity}}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 30,
          transform: `scale(${0.82 + logoIn * 0.18}) translateY(${(1 - logoIn) * 30}px)`,
        }}
      >
        <Img
          src={staticFile('brand/logo-lockup.svg')}
          style={{
            width: 760,
            filter: 'drop-shadow(0 10px 34px rgba(0,0,0,0.55))',
          }}
        />
        <div
          style={{
            width: 420 * sweep,
            height: 13,
            borderRadius: 3,
            background: xGradientCss,
            transformOrigin: 'center',
          }}
        />
        {tagline ? (
          <div
            style={{
              fontFamily: monoFont('en-US'),
              fontSize: 30,
              fontWeight: 600,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: bone[50],
              backgroundColor: scrim(0.82),
              padding: '9px 20px',
              borderRadius: 8,
              opacity: sweep,
            }}
          >
            {tagline}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
