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
});

export type SideScreenProps = z.infer<typeof sideScreenSchema>;

/**
 * An app screen-recording pinned into the reserved blank space on the LEFT, while the
 * founder speaks from the right. Stretched to fill the box (objectFit: fill) — the box
 * aspect matches the recordings, so there's no visible distortion. Never covers his face.
 */
export const SideScreen: React.FC<SideScreenProps> = ({src, x, y, w, h}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

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
      </div>
    </AbsoluteFill>
  );
};
