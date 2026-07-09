import React from 'react';
import {
  AbsoluteFill,
  Easing,
  OffthreadVideo,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {z} from 'zod';
import {exitFade} from '../shared';
import {monoFont} from '../theme/fonts';
import {bone, dirt} from '../theme/tokens';

/** An orange box drawn over the recording to show what was selected / tapped. Coordinates
 *  are normalized 0..1 within the screen area; from/to are seconds into this overlay. */
const markerSchema = z.object({
  from: z.number(),
  to: z.number(),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  /** `circle` rings a round control (a play/pause button); `rect` boxes a row or button. */
  shape: z.enum(['rect', 'circle']).default('rect'),
  /**
   * How the marker arrives.
   *  - `pop`    snaps in at 0.86x and settles. Fine when the eye is already near the element.
   *  - `shrink` starts wide and contracts onto the element, which *finds* it for the viewer.
   *    Use it for a small control on a busy screen — a play/pause button on a splash video.
   */
  enter: z.enum(['pop', 'shrink']).default('pop'),
  /** `shrink` only: the scale it starts at, in multiples of the final size. */
  shrinkFrom: z.number().default(4.2),
});

export const sideScreenSchema = z.object({
  durationSec: z.number().default(6),
  /** Pre-chopped screen recording in public/ (already cut to this exact duration). */
  src: z.string(),
  /** Box in the 1080x1920 frame. Default = the blank wall left of the founder,
   *  measured to clear his face on the tightest feature clip and sit above the helmet.
   *  `w`/`h` MUST carry the recording's own aspect ratio — the video is stretched to fill
   *  the box, so a mismatched box silently distorts the app UI. */
  x: z.number().default(24),
  y: z.number().default(96),
  w: z.number().default(391),
  h: z.number().default(852),
  /** Tap/selection highlights — only needed where the chop makes the screen hard to read. */
  markers: z.array(markerSchema).default([]),
  /** Optional chip under the card naming the surface ("Search users"). Same treatment as the
   *  feature-phone labels in S01E002, so the two episodes read as one visual language. */
  label: z.string().default(''),
  /** Label chip size. The fan-out cards are ~2/3 the width of a single card. */
  labelSize: z.number().default(27),
});

export type SideScreenProps = z.infer<typeof sideScreenSchema>;

/**
 * An app screen-recording pinned into the reserved blank space on the LEFT, while the
 * founder speaks from the right. Stretched to fill the box (objectFit: fill) — the caller
 * is responsible for giving the box the recording's aspect ratio.
 */
export const SideScreen: React.FC<SideScreenProps> = ({
  src,
  x,
  y,
  w,
  h,
  markers,
  label,
  labelSize,
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const t = frame / fps;

  const inn = spring({
    frame,
    fps,
    config: {damping: 14, mass: 0.7},
    durationInFrames: 20,
  });
  const opacity =
    interpolate(frame, [0, 4], [0, 1], {extrapolateRight: 'clamp'}) *
    exitFade(frame, durationInFrames);

  return (
    <AbsoluteFill style={{opacity}}>
      <div
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: w,
          transform: `translateX(${(1 - inn) * -70}px) scale(${0.94 + inn * 0.06})`,
          transformOrigin: 'left center',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: w,
            height: h,
            borderRadius: 30,
            overflow: 'hidden',
            border: '5px solid #0b0b0b',
            boxShadow: '0 24px 60px rgba(0,0,0,0.62)',
            background: '#000',
          }}
        >
          <OffthreadVideo
            src={staticFile(src)}
            muted
            style={{width: '100%', height: '100%', objectFit: 'fill'}}
          />
          {markers.map((m, i) => {
            if (t < m.from || t > m.to) return null;
            const age = (t - m.from) * fps;
            // a slow breathe so it reads without pulling focus
            const breathe = 0.72 + 0.28 * (0.5 + 0.5 * Math.sin(age / 6));
            const scale =
              m.enter === 'shrink'
                ? // starts wide and contracts onto the control, so the eye is led to it
                  interpolate(age, [0, 0.55 * fps], [m.shrinkFrom, 1], {
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp',
                    easing: Easing.out(Easing.cubic),
                  })
                : interpolate(age, [0, 5], [0.86, 1], {
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp',
                  });
            // a shrinking ring must not paint a huge orange wash on its way in
            const fillAlpha =
              m.enter === 'shrink'
                ? 0.1 * breathe * interpolate(age, [0.35 * fps, 0.6 * fps], [0, 1], {
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp',
                  })
                : 0.1 * breathe;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `${m.x * 100}%`,
                  top: `${m.y * 100}%`,
                  width: `${m.w * 100}%`,
                  height: `${m.h * 100}%`,
                  border: `3px solid ${dirt[500]}`,
                  borderRadius: m.shape === 'circle' ? '50%' : 8,
                  boxShadow: `0 0 14px 2px rgba(237,107,0,${0.42 * breathe})`,
                  background: `rgba(237,107,0,${fillAlpha})`,
                  transform: `scale(${scale})`,
                  opacity: interpolate(age, [0, 4], [0, 1], {
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp',
                  }),
                }}
              />
            );
          })}
        </div>
        {label ? (
          <div style={{display: 'flex', justifyContent: 'center', marginTop: 16}}>
            <div
              style={{
                fontFamily: monoFont('en-US'),
                fontSize: labelSize,
                fontWeight: 700,
                letterSpacing: '0.03em',
                color: bone[50],
                background: dirt[500],
                padding: `${Math.round(labelSize * 0.3)}px ${Math.round(labelSize * 0.67)}px`,
                borderRadius: 10,
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </div>
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
