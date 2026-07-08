import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {z} from 'zod';
import {exitFade} from '../shared';

export const photoRevealSchema = z.object({
  durationSec: z.number().default(4.2),
  /** Photo in public/. Cover-fitted to the frame, so a 3:4 photo keeps its middle ~75%. */
  src: z.string().default('e002/first-ride.jpg'),
  /** Zoom-out: starts in tighter, settles on the cover fit (1.0 is the hard floor —
   *  below it the photo letterboxes). Whole-bike limit measured at 1.65. */
  startScale: z.number().default(1.32),
  endScale: z.number().default(1.0),
  /** Horizontal crop centre as object-position %. 62% == photo-x 0.53, which centres the
   *  rider+bike and stops the front tire crowding the right cut. Range 0..100 maps the
   *  visible window centre across photo-x [0.375, 0.625] at scale 1.0. */
  objectPositionX: z.number().default(62),
  /** Soft blur around a sharp middle. Keep gentle. */
  blurPx: z.number().default(11),
  /** Ultra-thin colour strips that take the very top and bottom edges. */
  barPx: z.number().default(16),
});

export type PhotoRevealProps = z.infer<typeof photoRevealSchema>;

/** A chromatic sweep, like the thin gradient strips on short-form video. */
const BAR_GRADIENT =
  'linear-gradient(90deg,#ED6B00,#FF3A08,#FACC15,#2FA84F,#2A5CFF,#7C6CFF,#EF5DA8,#ED6B00)';

/**
 * Full-screen photo cutaway that zooms out. The middle stays sharp while the surround
 * softens into a blurred copy of itself (subtle, not a heavy vignette), and the very top
 * and bottom edges are given over to ultra-thin animated colour strips — so the photo
 * covers the screen without reaching all of its edges.
 */
export const PhotoReveal: React.FC<PhotoRevealProps> = ({
  src,
  startScale,
  endScale,
  blurPx,
  barPx,
  objectPositionX,
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

  const scale = interpolate(frame, [0, durationInFrames - 1], [startScale, endScale], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const opacity =
    interpolate(frame, [0, 8], [0, 1], {extrapolateRight: 'clamp'}) *
    exitFade(frame, durationInFrames, 10);

  // Sweep the strips' gradient across their width for the whole shot.
  const sweep = interpolate(frame, [0, durationInFrames - 1], [0, 200], {
    extrapolateRight: 'clamp',
  });

  const photo: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: `${objectPositionX}% 50%`,
  };

  const bar: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    right: 0,
    height: barPx,
    background: BAR_GRADIENT,
    backgroundSize: '300% 100%',
    backgroundPosition: `${sweep}% 0`,
    filter: 'saturate(1.15)',
  };

  return (
    <AbsoluteFill style={{opacity, overflow: 'hidden'}}>
      {/* photo area — inset so the strips own the extreme top/bottom edges */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: barPx,
          bottom: barPx,
          overflow: 'hidden',
        }}
      >
        {/* blurred surround (scaled a touch wider so the blur never shows an edge) */}
        <Img
          src={staticFile(src)}
          style={{
            ...photo,
            filter: `blur(${blurPx}px) saturate(1.05) brightness(0.92)`,
            transform: `scale(${scale * 1.08})`,
          }}
        />
        {/* sharp middle, feathered into the blurred copy */}
        <Img
          src={staticFile(src)}
          style={{
            ...photo,
            transform: `scale(${scale})`,
            WebkitMaskImage:
              'radial-gradient(ellipse 74% 58% at 50% 47%, #000 62%, transparent 96%)',
            maskImage:
              'radial-gradient(ellipse 74% 58% at 50% 47%, #000 62%, transparent 96%)',
          }}
        />
        {/* gentle depth so the middle reads first */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 82% 64% at 50% 47%, transparent 60%, rgba(0,0,0,0.26) 100%)',
          }}
        />
      </div>

      <div style={{...bar, top: 0}} />
      <div style={{...bar, bottom: 0}} />
    </AbsoluteFill>
  );
};
