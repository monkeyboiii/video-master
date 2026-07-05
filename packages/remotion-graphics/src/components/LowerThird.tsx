import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {z} from 'zod';
import {exitFade, localeSchema, localeScale} from '../shared';
import {displayFont, monoFont} from '../theme/fonts';
import {SAFE_ZONE, bone, scrim, track, xGradientCss} from '../theme/tokens';

export const lowerThirdSchema = z.object({
  locale: localeSchema,
  name: z.string(),
  label: z.string(),
  durationSec: z.number(),
});

export type LowerThirdProps = z.infer<typeof lowerThirdSchema>;

/** Slide-in lower third, anchored bottom-left inside the safe zone. */
export const LowerThird: React.FC<LowerThirdProps> = ({
  locale,
  name,
  label,
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const scale = localeScale(locale);

  const barIn = spring({
    frame,
    fps,
    config: {damping: 200},
    durationInFrames: 8,
  });
  const slideIn = spring({
    frame: frame - 2,
    fps,
    config: {damping: 200},
    durationInFrames: 9,
  });
  const opacity =
    interpolate(frame, [0, 4], [0, 1], {extrapolateRight: 'clamp'}) *
    exitFade(frame, durationInFrames);

  return (
    <AbsoluteFill style={{opacity}}>
      <div
        style={{
          position: 'absolute',
          left: SAFE_ZONE.left,
          bottom: SAFE_ZONE.bottom,
          maxWidth: 1080 - SAFE_ZONE.left - SAFE_ZONE.right,
          display: 'flex',
          alignItems: 'stretch',
        }}
      >
        <div
          style={{
            width: 12,
            borderRadius: 6,
            background: xGradientCss,
            transform: `scaleY(${barIn})`,
            transformOrigin: 'bottom center',
          }}
        />
        <div
          style={{
            backgroundColor: scrim(0.85),
            borderRadius: '0 18px 18px 0',
            padding: '26px 40px 26px 30px',
            marginLeft: 10,
            opacity: slideIn,
            transform: `translateX(${(1 - slideIn) * -48}px)`,
          }}
        >
          <div
            style={{
              fontFamily: displayFont(locale),
              fontWeight: 700,
              fontSize: 54 * scale,
              lineHeight: 1.1,
              letterSpacing: locale === 'zh-CN' ? '0' : '-0.015em',
              color: bone[50],
            }}
          >
            {name}
          </div>
          <div
            style={{
              fontFamily: monoFont(locale),
              fontSize: 26 * scale,
              fontWeight: 500,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: track[300],
              marginTop: 10,
            }}
          >
            {label}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
