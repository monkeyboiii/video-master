import React from 'react';
import {
  AbsoluteFill,
  Img,
  OffthreadVideo,
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
  /**
   * Footage segment (in public/) to render *behind* the logo, blurred like an
   * ultra-thin material. A Remotion overlay is rendered against transparency, so CSS
   * `backdrop-filter` has nothing to blur — the backdrop has to be baked in. When set,
   * this overlay is opaque for its duration, so place it BELOW the caption track.
   */
  bgSrc: z.string().optional(),
  bgTrimSec: z.number().default(0),
  /** Keep it gentle — a material, not a defocus. */
  bgBlurPx: z.number().default(8),
  /** Slight darkening so the white wordmark reads. */
  bgDim: z.number().default(0.14),
});

export type BrandTitleProps = z.infer<typeof brandTitleSchema>;

/**
 * The DirtBikeX logo lockup (white wordmark + orange X) slamming in over footage.
 * With `bgSrc`, the frame behind it is rendered blurred + slightly dimmed, so the logo
 * sits on a soft material rather than on busy footage.
 */
export const BrandTitle: React.FC<BrandTitleProps> = ({
  tagline,
  bgSrc,
  bgTrimSec,
  bgBlurPx,
  bgDim,
}) => {
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
    <AbsoluteFill style={{opacity, overflow: 'hidden'}}>
      {bgSrc ? (
        <AbsoluteFill style={{overflow: 'hidden'}}>
          <OffthreadVideo
            src={staticFile(bgSrc)}
            trimBefore={Math.round((bgTrimSec ?? 0) * fps)}
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              // scaled a touch so the blur never samples past the frame edge
              transform: 'scale(1.08)',
              filter: `blur(${bgBlurPx}px) saturate(0.92) brightness(${1 - bgDim})`,
            }}
          />
          <AbsoluteFill
            style={{
              background:
                'radial-gradient(ellipse 82% 62% at 50% 45%, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.30) 100%)',
            }}
          />
        </AbsoluteFill>
      ) : null}

      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
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
    </AbsoluteFill>
  );
};
