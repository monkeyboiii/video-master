import React from 'react';
import {
  AbsoluteFill,
  OffthreadVideo,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {z} from 'zod';
import {exitFade} from '../shared';
import {dirt} from '../theme/tokens';

/** An orange box drawn over the recording to show what was selected / tapped. Coordinates
 *  are normalized 0..1 within the screen area; from/to are seconds into this overlay. */
const markerSchema = z.object({
  from: z.number(),
  to: z.number(),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
});

export const sideScreenSchema = z.object({
  durationSec: z.number().default(6),
  /** Pre-chopped screen recording in public/ (already cut to this exact duration). */
  src: z.string(),
  /** Box in the 1080x1920 frame. Default = the blank wall left of the founder,
   *  measured to clear his face on the tightest feature clip and sit above the helmet. */
  x: z.number().default(24),
  y: z.number().default(96),
  w: z.number().default(391),
  h: z.number().default(852),
  /** Tap/selection highlights — only needed where the chop makes the screen hard to read. */
  markers: z.array(markerSchema).default([]),
});

export type SideScreenProps = z.infer<typeof sideScreenSchema>;

/**
 * An app screen-recording pinned into the reserved blank space on the LEFT, while the
 * founder speaks from the right. Stretched to fill the box (objectFit: fill) — the box
 * aspect matches the recordings, so there's no visible distortion. Never covers his face.
 */
export const SideScreen: React.FC<SideScreenProps> = ({src, x, y, w, h, markers}) => {
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
          height: h,
          borderRadius: 30,
          overflow: 'hidden',
          border: '5px solid #0b0b0b',
          boxShadow: '0 24px 60px rgba(0,0,0,0.62)',
          background: '#000',
          transform: `translateX(${(1 - inn) * -70}px) scale(${0.94 + inn * 0.06})`,
          transformOrigin: 'left center',
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
          // quick snap in, then a slow breathe so it reads without pulling focus
          const pop = interpolate(age, [0, 5], [0.86, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const breathe = 0.72 + 0.28 * (0.5 + 0.5 * Math.sin(age / 6));
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
                borderRadius: 8,
                boxShadow: `0 0 14px 2px rgba(237,107,0,${0.42 * breathe})`,
                background: `rgba(237,107,0,${0.1 * breathe})`,
                transform: `scale(${pop})`,
                opacity: interpolate(age, [0, 4], [0, 1], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                }),
              }}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
