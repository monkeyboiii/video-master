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
import {bodyFont, displayFont} from '../theme/fonts';
import {SAFE_ZONE, bone, dirt, scrim, track, xGradientCss} from '../theme/tokens';

export const checklistCardSchema = z.object({
  locale: localeSchema,
  title: z.string(),
  items: z.array(z.string()),
  durationSec: z.number(),
});

export type ChecklistCardProps = z.infer<typeof checklistCardSchema>;

const ITEM_STAGGER = 7;
const FIRST_ITEM_AT = 10;

/** Dark card with a title and items that check in staggered. */
export const ChecklistCard: React.FC<ChecklistCardProps> = ({
  locale,
  title,
  items,
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
        opacity,
      }}
    >
      <div
        style={{
          backgroundColor: scrim(0.9),
          borderRadius: 28,
          padding: '52px 48px',
          transform: `translateY(${(1 - panelIn) * 44}px)`,
        }}
      >
        <div
          style={{
            width: 64,
            height: 10,
            borderRadius: 3,
            background: xGradientCss,
            marginBottom: 28,
          }}
        />
        <div
          style={{
            fontFamily: displayFont(locale),
            fontWeight: 800,
            fontSize: 62 * scale,
            lineHeight: 1.1,
            letterSpacing: locale === 'zh-CN' ? '0' : '-0.02em',
            color: bone[50],
            marginBottom: 40,
          }}
        >
          {title}
        </div>
        {items.map((item, i) => {
          const rowIn = spring({
            frame: frame - (FIRST_ITEM_AT + i * ITEM_STAGGER),
            fps,
            config: {damping: 200},
            durationInFrames: 9,
          });
          const checkIn = spring({
            frame: frame - (FIRST_ITEM_AT + 4 + i * ITEM_STAGGER),
            fps,
            config: {damping: 200},
            durationInFrames: 8,
          });
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 26,
                marginTop: i === 0 ? 0 : 30,
                opacity: rowIn,
                transform: `translateX(${(1 - rowIn) * 36}px)`,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  flexShrink: 0,
                  borderRadius: 10,
                  border: `3px solid ${track[500]}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 6,
                    backgroundColor: dirt[500],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: `scale(${checkIn})`,
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M4.5 12.5L10 18L19.5 6.5"
                      stroke={bone[50]}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
              <div
                style={{
                  fontFamily: bodyFont(locale),
                  fontWeight: 600,
                  fontSize: 42 * scale,
                  lineHeight: 1.28,
                  color: bone[50],
                  paddingTop: 2,
                }}
              >
                {item}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
