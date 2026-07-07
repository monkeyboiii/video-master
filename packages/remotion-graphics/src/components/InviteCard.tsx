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
import {bone, dirt, xGradientCss} from '../theme/tokens';
import {bodyFont, displayFont} from '../theme/fonts';

export const inviteCardSchema = z.object({
  durationSec: z.number().default(4),
  name: z.string().default('Zenkai Rubio'),
  invited: z.string().default('invited you to DirtBikeX'),
  qrSrc: z.string().default('e002/invite-qr.png'),
  cta: z.string().default('Scan to join — or grab the invite code in the description'),
  footer: z.string().default("I'll be waiting for you there"),
});

export type InviteCardProps = z.infer<typeof inviteCardSchema>;

/**
 * End-of-video invite. Reuses the invite-card branding (logo + Rubio's avatar)
 * and keeps the real scannable QR code (cropped from the source card), while the
 * caption also points to the invite code in the description — matching the VO.
 */
export const InviteCard: React.FC<InviteCardProps> = ({
  name,
  invited,
  qrSrc,
  cta,
  footer,
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const cardIn = spring({
    frame,
    fps,
    config: {damping: 15, mass: 0.85},
    durationInFrames: 22,
  });
  const avatarIn = spring({
    frame: frame - 5,
    fps,
    config: {damping: 11, stiffness: 130},
    durationInFrames: 16,
  });
  const qrIn = spring({
    frame: frame - 10,
    fps,
    config: {damping: 13, mass: 0.7},
    durationInFrames: 18,
  });
  const opacity =
    interpolate(frame, [0, 5], [0, 1], {extrapolateRight: 'clamp'}) *
    exitFade(frame, durationInFrames);

  return (
    <AbsoluteFill
      style={{justifyContent: 'center', alignItems: 'center', opacity}}
    >
      <div
        style={{
          width: 830,
          padding: '44px 48px 48px',
          background: 'rgba(10,9,8,0.96)',
          borderRadius: 42,
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 30px 90px rgba(0,0,0,0.7)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 18,
          transform: `translateY(${(1 - cardIn) * 70}px) scale(${0.9 + cardIn * 0.1})`,
        }}
      >
        <Img src={staticFile('brand/logo-lockup.svg')} style={{width: 320}} />
        <div
          style={{
            width: 132,
            height: 132,
            borderRadius: '50%',
            border: `5px solid ${dirt[500]}`,
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            transform: `scale(${avatarIn})`,
          }}
        >
          <Img
            src={staticFile('e002/rubio-avatar.png')}
            style={{width: '100%', height: '100%', objectFit: 'cover'}}
          />
        </div>
        <div
          style={{
            fontFamily: displayFont('en-US'),
            fontWeight: 800,
            fontSize: 44,
            lineHeight: 1.15,
            color: bone[50],
            textAlign: 'center',
          }}
        >
          {name}{' '}
          <span style={{color: bone[300], fontWeight: 600}}>{invited}</span>
        </div>
        <Img
          src={staticFile(qrSrc)}
          style={{
            width: 380,
            height: 380,
            borderRadius: 20,
            transform: `scale(${0.85 + qrIn * 0.15})`,
            filter: 'drop-shadow(0 12px 30px rgba(0,0,0,0.5))',
          }}
        />
        <div
          style={{
            marginTop: 4,
            fontFamily: displayFont('en-US'),
            fontWeight: 800,
            fontSize: 34,
            lineHeight: 1.2,
            letterSpacing: '-0.01em',
            color: 'transparent',
            backgroundImage: xGradientCss,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            textAlign: 'center',
            maxWidth: 700,
          }}
        >
          {cta}
        </div>
        <div
          style={{
            fontFamily: bodyFont('en-US'),
            fontSize: 30,
            fontWeight: 500,
            color: bone[300],
            textAlign: 'center',
          }}
        >
          {footer}
        </div>
      </div>
    </AbsoluteFill>
  );
};
