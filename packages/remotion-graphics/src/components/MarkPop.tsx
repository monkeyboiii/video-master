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

/**
 * A single mark that arrives in place — opacity ramp plus a spring scale — and then holds.
 *
 * Used where a prop should *appear* rather than slide in: the X emerging as the palm opens, and
 * the closing wordmark, which fades up the same way the profile card does so the two land as a
 * pair rather than one cutting on hard.
 */
export const markPopSchema = z.object({
  durationSec: z.number().default(1.5),
  src: z.string().default('e202/orange-X.svg'),
  /** Centre of the mark, in 1080x1920 frame coords. */
  x: z.number().default(540),
  y: z.number().default(960),
  width: z.number().default(240),
  /** Native aspect (h/w) of the asset. */
  aspect: z.number().default(377 / 344),
  /** Entrance length. */
  popSec: z.number().default(0.45),
  /** Scale it grows from. 1 = pure fade, no growth. */
  fromScale: z.number().default(0.55),
  shadow: z.boolean().default(true),
});

export type MarkPopProps = z.infer<typeof markPopSchema>;

export const MarkPop: React.FC<MarkPopProps> = ({
  src,
  x,
  y,
  width,
  aspect,
  popSec,
  fromScale,
  shadow,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const grow = spring({
    frame,
    fps,
    durationInFrames: Math.max(1, Math.round(popSec * fps)),
    config: {damping: 13, mass: 0.6},
  });
  const scale = interpolate(grow, [0, 1], [fromScale, 1]);
  const opacity = interpolate(frame, [0, Math.round(popSec * fps * 0.45)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const h = width * aspect;

  return (
    <AbsoluteFill>
      <Img
        src={staticFile(src)}
        style={{
          position: 'absolute',
          left: x - width / 2,
          top: y - h / 2,
          width,
          height: h,
          transform: `scale(${scale})`,
          opacity,
          filter: shadow
            ? 'drop-shadow(0 0 22px rgba(0,0,0,0.55)) drop-shadow(0 10px 16px rgba(0,0,0,0.42))'
            : undefined,
        }}
      />
    </AbsoluteFill>
  );
};
