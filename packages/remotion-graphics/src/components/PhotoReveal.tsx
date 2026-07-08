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
  /** Photo in public/. first-ride.jpg is 1440x1920 (3:4). */
  src: z.string().default('e002/first-ride.jpg'),
  /**
   * Zoom-out. 1.0 is the resting scale: the photo cover-fits the sharp band exactly, so its
   * FULL WIDTH is visible and only the top/bottom ~10% of the photo is cropped away.
   * Below 1.0 the band would letterbox — hard floor.
   */
  startScale: z.number().default(1.32),
  endScale: z.number().default(1.0),
  /**
   * Horizontal crop centre, as an object-position %. Only bites while scale > 1 in the sharp
   * band (at 1.0 the photo's width fits exactly); it always bites on the blurred backdrop,
   * which cover-fits 9:16 and so must drop 25% of the photo's width. 62% == photo-x 0.53,
   * which centres the rider+bike and keeps the front tire off the right cut.
   */
  objectPositionX: z.number().default(62),
  /**
   * Vertical crop centre for the sharp band, as an object-position %. The photo's top ~30%
   * (rows 0..576) is empty underpass deck, so bias the crop DOWN: at 92% the band takes 353 of
   * its 384 cropped rows off the top, leaving just enough concrete to frame the shot. 100%
   * would crop the full 384 off the top and join the blurred band seamlessly (the fill backdrop
   * puts photo row 384 exactly at the seam), but it clips the ground at the bottom.
   */
  objectPositionY: z.number().default(92),
  /**
   * Fraction of the frame height given to the blurred band at EACH end. 0.2 = one fifth,
   * leaving the middle three fifths for the sharp photo.
   */
  bandFrac: z.number().default(0.2),
  /** Blur on the bands. Strong enough that no detail survives — it is material, not photo. */
  blurPx: z.number().default(40),
  /** Bands sit slightly back so the sharp middle reads first. */
  bandDim: z.number().default(0.22),
});

export type PhotoRevealProps = z.infer<typeof photoRevealSchema>;

/**
 * Full-screen photo cutaway that zooms out.
 *
 * The photo covers the screen but does not reach its top and bottom edges: the outer fifth at
 * each end is a blurred, dimmed, cover-fit copy of the same photo — the classic short-form
 * "blurred fill". The middle three fifths carries the photo sharp, cover-fitted, which crops a
 * little off its top and bottom. The blurred bands are therefore, roughly, the cropped-off
 * parts: the photo bleeds off the frame instead of stopping at a hard edge.
 *
 * Geometry at rest (photo 1440x1920 into a 1080x1920 frame):
 *   sharp band  1080x1152  — photo scaled x0.75, FULL WIDTH, 384 rows cropped vertically.
 *                            At objectPositionY 92% that is 353 rows off the top (the empty
 *                            underpass deck) and 31 off the bottom: rows 353..1889 survive.
 *   backdrop    1080x1920  — photo stretched to the frame, so its horizontal mapping matches
 *                            the sharp band exactly and the seam does not slide sideways.
 */
export const PhotoReveal: React.FC<PhotoRevealProps> = ({
  src,
  startScale,
  endScale,
  objectPositionX,
  objectPositionY,
  bandFrac,
  blurPx,
  bandDim,
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

  // The backdrop drifts with the photo, but damped — it reads as depth, not a second zoom.
  const backdropScale = 1 + (scale - 1) * 0.35;

  const bandPct = bandFrac * 100;

  return (
    <AbsoluteFill style={{opacity, overflow: 'hidden'}}>
      {/*
       * Blurred fill behind everything.
       *
       * `fill` (not `cover`) on purpose: it maps the photo's full width onto the frame's full
       * width, exactly as the sharp band does at rest, so the two stay in horizontal register —
       * a cover-fit backdrop crops 25% of the width and visibly slides the subject sideways
       * behind the seam. The resulting 1.33x vertical stretch is invisible under this much blur.
       * The wrapper is over-sized so the blur kernel always has material to sample at the edges.
       */}
      <div style={{position: 'absolute', inset: '-6%', overflow: 'hidden'}}>
        <Img
          src={staticFile(src)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'fill',
            transform: `scale(${backdropScale})`,
            filter: `blur(${blurPx}px) saturate(1.05) brightness(${1 - bandDim})`,
          }}
        />
      </div>

      {/* falloff into the extreme edges, so each band reads as intent rather than dead space */}
      <AbsoluteFill
        style={{
          background: [
            `linear-gradient(to bottom, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0) ${bandPct}%)`,
            `linear-gradient(to top, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0) ${bandPct}%)`,
          ].join(','),
        }}
      />

      {/* sharp middle three fifths */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: `${bandPct}%`,
          bottom: `${bandPct}%`,
          overflow: 'hidden',
        }}
      >
        <Img
          src={staticFile(src)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: `${objectPositionX}% ${objectPositionY}%`,
            transform: `scale(${scale})`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
