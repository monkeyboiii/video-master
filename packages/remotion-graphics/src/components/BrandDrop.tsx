import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {z} from 'zod';
import {SAFE_ZONE} from '../theme/tokens';

export const brandDropSchema = z.object({
  durationSec: z.number().default(5.0),
  /** The full wordmark that surfaces from the top. */
  lockupSrc: z.string().default('brand/logo-lockup.svg'),
  /** The mark it becomes in the corner. */
  markSrc: z.string().default('brand/logo-mark.svg'),

  /** Wordmark width at rest. */
  lockupWidth: z.number().default(620),
  /** Corner icon edge length. */
  iconSize: z.number().default(128),

  /** Where the wordmark settles after dropping in (frame coords, centre of the lockup). */
  restX: z.number().default(540),
  restY: z.number().default(330),

  // Phase lengths, in seconds. drop -> hold -> fly -> iconHold -> fade.
  dropSec: z.number().default(0.55),
  holdSec: z.number().default(1.20),
  flySec: z.number().default(0.80),
  iconHoldSec: z.number().default(1.80),
  fadeSec: z.number().default(0.65),
});

export type BrandDropProps = z.infer<typeof brandDropSchema>;

/**
 * The DirtBikeX logo as a *standalone* element — it never takes the screen.
 *
 * It surfaces through the top edge on the word "DirtBikeX", holds long enough to read, then
 * flies to the top **trailing** (right) corner, shrinking and cross-fading from the wordmark
 * into the bare mark, where it sits as an icon before fading out.
 *
 * Nothing behind it is blurred: this is a transparent overlay, no Route-B blur window.
 * The corner rest position honours the platform safe zone (top 150, right 145).
 */
export const BrandDrop: React.FC<BrandDropProps> = ({
  lockupSrc,
  markSrc,
  lockupWidth,
  iconSize,
  restX,
  restY,
  dropSec,
  holdSec,
  flySec,
  iconHoldSec,
  fadeSec,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();

  const dropF = dropSec * fps;
  const holdEndF = dropF + holdSec * fps;
  const flyEndF = holdEndF + flySec * fps;
  const iconEndF = flyEndF + iconHoldSec * fps;
  const fadeEndF = iconEndF + fadeSec * fps;

  // Corner target: centre of the icon, inset by the safe zone.
  const cornerX = width - SAFE_ZONE.right - iconSize / 2;
  const cornerY = SAFE_ZONE.top + iconSize / 2;

  // ── drop: surface through the top edge, overshooting slightly, then settle
  const drop = spring({
    frame,
    fps,
    config: {damping: 14, mass: 0.8},
    durationInFrames: Math.round(dropF),
  });
  const dropY = interpolate(drop, [0, 1], [-260, restY]);

  // ── fly: travel to the corner while shrinking into the mark
  const fly = interpolate(frame, [holdEndF, flyEndF], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

  const x = interpolate(fly, [0, 1], [restX, cornerX]);
  const y = interpolate(fly, [0, 1], [dropY, cornerY]);
  // the wordmark shrinks to icon scale; the mark grows into it from the same box
  const lockupScale = interpolate(fly, [0, 1], [1, iconSize / lockupWidth]);
  const markScale = interpolate(fly, [0, 1], [lockupWidth / iconSize, 1]);

  // cross-fade wordmark -> mark across the middle of the flight
  const lockupOpacity = interpolate(fly, [0.15, 0.55], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const markOpacity = interpolate(fly, [0.35, 0.8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // ── overall: fade in on the drop, fade out after the icon has sat a beat
  const opacity =
    interpolate(frame, [0, 5], [0, 1], {extrapolateRight: 'clamp'}) *
    interpolate(frame, [iconEndF, fadeEndF], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });

  const centred: React.CSSProperties = {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
  };

  return (
    <AbsoluteFill style={{opacity}}>
      <div style={{position: 'absolute', left: x, top: y, width: 0, height: 0}}>
        <Img
          src={staticFile(lockupSrc)}
          style={{
            ...centred,
            width: lockupWidth,
            opacity: lockupOpacity,
            transform: `translate(-50%, -50%) scale(${lockupScale})`,
            filter: 'drop-shadow(0 10px 34px rgba(0,0,0,0.55))',
          }}
        />
        <Img
          src={staticFile(markSrc)}
          style={{
            ...centred,
            width: iconSize,
            opacity: markOpacity,
            transform: `translate(-50%, -50%) scale(${markScale})`,
            filter: 'drop-shadow(0 6px 20px rgba(0,0,0,0.5))',
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
