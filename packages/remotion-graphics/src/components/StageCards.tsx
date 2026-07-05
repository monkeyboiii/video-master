import {fitText} from '@remotion/layout-utils';
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
import {displayFont} from '../theme/fonts';
import {SAFE_ZONE, bone, scrim, stageColors} from '../theme/tokens';

export const stageCardsSchema = z.object({
  locale: localeSchema,
  items: z.array(z.string().min(1)).min(2).max(6),
  colors: z.array(z.string()),
  scatterDelaySec: z.number(),
  background: z.boolean(),
  durationSec: z.number(),
});

export type StageCardsProps = z.infer<typeof stageCardsSchema>;

const ENTRANCE_AT = 6;
const STAGGER = 3;

type Rect = {x: number; y: number; w: number; h: number};

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/**
 * Six capsules pop in along a horizontal line, then scatter out and morph into
 * a grid of stage cards (2x3 portrait, 3x2 landscape) on a dotted background.
 * Set background:false to render transparent for layering over footage.
 */
export const StageCards: React.FC<StageCardsProps> = ({
  locale,
  items,
  colors,
  scatterDelaySec,
  background,
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames, width, height} = useVideoConfig();
  const scale = localeScale(locale);
  const landscape = width > height;

  // ── Layout ──
  const inset = landscape
    ? {top: Math.round(height * 0.1), bottom: Math.round(height * 0.18), left: 120, right: 120}
    : SAFE_ZONE;
  const contentW = width - inset.left - inset.right;
  const contentH = height - inset.top - inset.bottom;
  const cols = landscape ? 3 : 2;
  const rows = Math.ceil(items.length / cols);
  const gap = landscape ? 44 : 36;
  const cardW = (contentW - gap * (cols - 1)) / cols;
  const cardH = Math.min(cardW * (landscape ? 0.55 : 0.62), (contentH - gap * (rows - 1)) / rows);
  const gridH = rows * cardH + (rows - 1) * gap;
  const gridTop = inset.top + (contentH - gridH) / 2;

  const cardRect = (i: number): Rect => {
    const row = Math.floor(i / cols);
    // Center an incomplete last row instead of leaving a hole bottom-right.
    const inRow = Math.min(cols, items.length - row * cols);
    const rowOffset = ((cols - inRow) * (cardW + gap)) / 2;
    return {
      x: inset.left + rowOffset + (i % cols) * (cardW + gap),
      y: gridTop + row * (cardH + gap),
      w: cardW,
      h: cardH,
    };
  };

  const capGap = landscape ? 18 : 14;
  const capH = landscape ? 84 : 76;
  const capW = Math.min(landscape ? 250 : 180, (contentW - capGap * (items.length - 1)) / items.length);
  const rowW = items.length * capW + (items.length - 1) * capGap;
  const capRect = (i: number): Rect => ({
    x: width / 2 - rowW / 2 + i * (capW + capGap),
    y: gridTop + gridH / 2 - capH / 2,
    w: capW,
    h: capH,
  });

  const capFont = (landscape ? 34 : 30) * scale;
  const cardFont = (landscape ? 60 : 56) * scale;
  const labelPadX = 24;

  // Clamp so the last item's morph finishes before the exit fade, and never
  // starts before the capsules have finished popping in.
  const lastStagger = (items.length - 1) * STAGGER;
  const scatterAt = Math.max(
    ENTRANCE_AT + lastStagger + 8,
    Math.min(Math.round(scatterDelaySec * fps), durationInFrames - 12 - lastStagger - 18),
  );
  const opacity = exitFade(frame, durationInFrames);
  const drift = -frame * 0.2;

  return (
    <AbsoluteFill style={{opacity, backgroundColor: background ? '#0C0B09' : undefined}}>
      {background ? (
        <AbsoluteFill
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(250,248,244,0.12) 3px, transparent 3.5px), radial-gradient(circle, rgba(250,248,244,0.12) 3px, transparent 3.5px)',
            backgroundSize: '96px 96px, 96px 96px',
            backgroundPosition: `0px ${drift}px, 48px ${48 + drift}px`,
          }}
        />
      ) : null}
      {items.map((label, i) => {
        const color = colors[i % Math.max(colors.length, 1)] ?? stageColors[i % stageColors.length];
        const pop = spring({
          frame: frame - (ENTRANCE_AT + i * STAGGER),
          fps,
          config: {damping: 200},
          durationInFrames: 10,
        });
        const p = spring({
          frame: frame - (scatterAt + i * STAGGER),
          fps,
          config: {damping: 200},
          durationInFrames: 18,
        });
        const a = capRect(i);
        const b = cardRect(i);
        const w = lerp(a.w, b.w, p);
        const h = lerp(a.h, b.h, p);
        // Fit long labels instead of clipping them (nowrap + overflow hidden).
        const fit = (designed: number, boxW: number): number =>
          Math.min(
            designed,
            fitText({
              text: label,
              withinWidth: Math.max(boxW - labelPadX * 2, 10),
              fontFamily: displayFont(locale),
              fontWeight: 800,
            }).fontSize,
          );
        const radius = lerp(capH / 2, 22, p);
        const barIn = interpolate(p, [0.55, 1], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: lerp(a.x, b.x, p),
              top: lerp(a.y, b.y, p),
              width: w,
              height: h,
              borderRadius: radius,
              overflow: 'hidden',
              backgroundColor: background ? '#171512' : scrim(0.92),
              border: '2px solid rgba(255,255,255,0.07)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
              opacity: pop,
              transform: `scale(${lerp(0.6, 1, pop)})`,
            }}
          >
            {/* capsule outline, fades out as the top bar fades in */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: Math.max(radius - 2, 0),
                border: `2px solid ${color}`,
                opacity: 1 - barIn,
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 8,
                backgroundColor: color,
                opacity: barIn,
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: displayFont(locale),
                fontWeight: 800,
                fontSize: lerp(fit(capFont, a.w), fit(cardFont, b.w), p),
                letterSpacing: locale === 'zh-CN' ? '0.02em' : '-0.01em',
                color,
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
