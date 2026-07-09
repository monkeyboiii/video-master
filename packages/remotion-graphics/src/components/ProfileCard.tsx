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
import {exitFade} from '../shared';
import {bone, dirt, scrim} from '../theme/tokens';
import {monoFont} from '../theme/fonts';

export const profileCardSchema = z.object({
  durationSec: z.number().default(3),
  /** Profile screenshot in public/, e.g. e002/rubio-profile.jpg */
  src: z.string().default('e002/rubio-profile.jpg'),
  handle: z.string().default('@rubio'),
  /**
   * Distance from the bottom of the frame to the bottom of the card. The default (190) puts it
   * in the lower third, where it OVERLAPS the caption band (y1372-1466) — fine for episodes that
   * stop their captions there (E002), but not for a continuous caption track. Raise it to lift
   * the card clear of the band: 630 leaves ~80px of air above it.
   */
  bottomInset: z.number().default(190),
});

export type ProfileCardProps = z.infer<typeof profileCardSchema>;

/**
 * Founder's in-app profile screen as a floating card that snaps in — shown when
 * he says "My name is Rubio." Establishes identity (verified, Founder, @rubio).
 */
export const ProfileCard: React.FC<ProfileCardProps> = ({src, handle, bottomInset}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const cardIn = spring({
    frame,
    fps,
    config: {damping: 15, mass: 0.8},
    durationInFrames: 20,
  });
  const chipIn = spring({
    frame: frame - 8,
    fps,
    config: {damping: 12, stiffness: 130},
    durationInFrames: 16,
  });
  const opacity =
    interpolate(frame, [0, 4], [0, 1], {extrapolateRight: 'clamp'}) *
    exitFade(frame, durationInFrames);

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: bottomInset,
        opacity,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: 860,
          transform: `translateY(${(1 - cardIn) * 60}px) scale(${0.9 + cardIn * 0.1})`,
        }}
      >
        <div
          style={{
            borderRadius: 34,
            overflow: 'hidden',
            border: `3px solid ${dirt[500]}`,
            boxShadow: '0 24px 70px rgba(0,0,0,0.6)',
          }}
        >
          <Img
            src={staticFile(src)}
            style={{width: '100%', display: 'block'}}
          />
        </div>
        <div
          style={{
            position: 'absolute',
            top: -26,
            left: 40,
            fontFamily: monoFont('en-US'),
            fontSize: 34,
            fontWeight: 700,
            letterSpacing: '0.06em',
            color: bone[50],
            background: dirt[500],
            padding: '8px 22px',
            borderRadius: 12,
            boxShadow: '0 8px 22px rgba(0,0,0,0.45)',
            transform: `scale(${chipIn}) rotate(${(1 - chipIn) * -6}deg)`,
            transformOrigin: 'left center',
          }}
        >
          {handle}
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: -22,
            right: 44,
            fontFamily: monoFont('en-US'),
            fontSize: 26,
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: bone[50],
            background: scrim(0.9),
            padding: '8px 18px',
            borderRadius: 10,
            opacity: chipIn,
          }}
        >
          Founder · DirtBikeX
        </div>
      </div>
    </AbsoluteFill>
  );
};
