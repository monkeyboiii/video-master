import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {z} from 'zod';
import type {Locale} from '../shared';
import {exitFade, localeSchema, localeScale} from '../shared';
import {displayFont, monoFont} from '../theme/fonts';
import {SAFE_ZONE, bone, dirt, scrim, track, xGradientCss} from '../theme/tokens';

export const ctaCardSchema = z.object({
  locale: localeSchema,
  action: z.enum(['save', 'comment', 'follow']),
  line: z.string(),
  handle: z.string(),
  durationSec: z.number(),
});

export type CtaCardProps = z.infer<typeof ctaCardSchema>;

const ACTION_LABEL: Record<Locale, Record<CtaCardProps['action'], string>> = {
  'en-US': {save: 'Save this', comment: 'Comment below', follow: 'Follow'},
  'zh-CN': {save: '收藏这条', comment: '评论区聊聊', follow: '关注不迷路'},
};

const ActionIcon: React.FC<{action: CtaCardProps['action']}> = ({action}) => {
  const common = {
    stroke: bone[50],
    strokeWidth: 3.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };
  if (action === 'save') {
    return (
      <svg width="52" height="52" viewBox="0 0 40 40">
        <path d="M11 6h18v28l-9-6.5L11 34V6Z" {...common} />
      </svg>
    );
  }
  if (action === 'comment') {
    return (
      <svg width="52" height="52" viewBox="0 0 40 40">
        <path
          d="M32 7H8a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h6v7l9-7h9a3 3 0 0 0 3-3V10a3 3 0 0 0-3-3Z"
          {...common}
        />
      </svg>
    );
  }
  return (
    <svg width="52" height="52" viewBox="0 0 40 40">
      <path d="M20 9v22M9 20h22" {...common} />
    </svg>
  );
};

/** Call-to-action card near the bottom of the safe zone. */
export const CtaCard: React.FC<CtaCardProps> = ({
  locale,
  action,
  line,
  handle,
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const scale = localeScale(locale);

  const panelIn = spring({
    frame,
    fps,
    config: {damping: 200},
    durationInFrames: 9,
  });
  const iconIn = spring({
    frame: frame - 4,
    fps,
    config: {damping: 200},
    durationInFrames: 8,
  });
  const opacity =
    interpolate(frame, [0, 5], [0, 1], {extrapolateRight: 'clamp'}) *
    exitFade(frame, durationInFrames);

  return (
    <AbsoluteFill
      style={{
        paddingTop: SAFE_ZONE.top,
        paddingBottom: SAFE_ZONE.bottom + 30,
        paddingLeft: SAFE_ZONE.left,
        paddingRight: SAFE_ZONE.right,
        justifyContent: 'flex-end',
        opacity,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 32,
          backgroundColor: scrim(0.9),
          borderRadius: 24,
          padding: '34px 40px',
          transform: `translateY(${(1 - panelIn) * 56}px)`,
        }}
      >
        <div
          style={{
            width: 96,
            height: 96,
            flexShrink: 0,
            borderRadius: 20,
            background: xGradientCss,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `scale(${0.6 + 0.4 * iconIn})`,
            opacity: iconIn,
          }}
        >
          <ActionIcon action={action} />
        </div>
        <div style={{minWidth: 0}}>
          <div
            style={{
              fontFamily: monoFont(locale),
              fontSize: 26 * scale,
              fontWeight: 600,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: dirt[300],
              marginBottom: 10,
            }}
          >
            {ACTION_LABEL[locale][action]}
          </div>
          <div
            style={{
              fontFamily: displayFont(locale),
              fontWeight: 800,
              fontSize: 50 * scale,
              lineHeight: 1.12,
              letterSpacing: locale === 'zh-CN' ? '0' : '-0.015em',
              color: bone[50],
            }}
          >
            {line}
          </div>
          <div
            style={{
              fontFamily: monoFont(locale),
              fontSize: 30 * scale,
              fontWeight: 500,
              color: track[300],
              marginTop: 12,
            }}
          >
            {handle}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
