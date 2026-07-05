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
import {SAFE_ZONE, bone, scrim, xGradientCss} from '../theme/tokens';

export const hookTitleSchema = z.object({
  locale: localeSchema,
  kicker: z.string().optional(),
  title: z.string(),
  durationSec: z.number(),
});

export type HookTitleProps = z.infer<typeof hookTitleSchema>;

/** Big punchy opening title: mono kicker, huge display type on dark line panels. */
export const HookTitle: React.FC<HookTitleProps> = ({locale, kicker, title}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const scale = localeScale(locale);

  const kickerIn = spring({
    frame,
    fps,
    config: {damping: 200},
    durationInFrames: 8,
  });
  const titleIn = spring({
    frame: frame - 3,
    fps,
    config: {damping: 200},
    durationInFrames: 9,
  });
  const sweep = spring({
    frame: frame - 8,
    fps,
    config: {damping: 200},
    durationInFrames: 10,
  });
  const opacity =
    interpolate(frame, [0, 5], [0, 1], {extrapolateRight: 'clamp'}) *
    exitFade(frame, durationInFrames);

  return (
    <AbsoluteFill
      style={{
        paddingTop: SAFE_ZONE.top,
        paddingBottom: SAFE_ZONE.bottom,
        paddingLeft: SAFE_ZONE.left,
        paddingRight: SAFE_ZONE.right,
        justifyContent: 'center',
        alignItems: 'flex-start',
        opacity,
      }}
    >
      {kicker ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            marginBottom: 34,
            opacity: kickerIn,
            transform: `translateY(${(1 - kickerIn) * 24}px)`,
          }}
        >
          <div
            style={{
              width: 20,
              height: 20,
              background: xGradientCss,
              borderRadius: 4,
            }}
          />
          <div
            style={{
              fontFamily: monoFont(locale),
              fontSize: 30 * scale,
              fontWeight: 600,
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              color: bone[50],
              backgroundColor: scrim(0.82),
              padding: '8px 18px',
              borderRadius: 8,
            }}
          >
            {kicker}
          </div>
        </div>
      ) : null}
      <h1
        style={{
          margin: 0,
          fontFamily: displayFont(locale),
          fontWeight: 800,
          fontSize: 108 * scale,
          lineHeight: 1.14,
          letterSpacing: locale === 'zh-CN' ? '0' : '-0.02em',
          color: bone[50],
          opacity: titleIn,
          transform: `translateY(${(1 - titleIn) * 46}px)`,
        }}
      >
        <span
          style={{
            backgroundColor: scrim(0.88),
            padding: '8px 22px',
            boxDecorationBreak: 'clone',
            WebkitBoxDecorationBreak: 'clone',
          }}
        >
          {title}
        </span>
      </h1>
      <div
        style={{
          marginTop: 30,
          marginLeft: 22,
          width: 340,
          height: 14,
          borderRadius: 3,
          background: xGradientCss,
          transform: `scaleX(${sweep})`,
          transformOrigin: 'left center',
        }}
      />
    </AbsoluteFill>
  );
};
