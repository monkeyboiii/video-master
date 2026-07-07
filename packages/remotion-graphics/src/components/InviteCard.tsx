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
import {bone} from '../theme/tokens';
import {bodyFont} from '../theme/fonts';

export const inviteCardSchema = z.object({
  durationSec: z.number().default(4),
  /** The real invite card art (logo + avatar + QR + scan CTA), used directly. */
  src: z.string().default('e002/invite-card.png'),
  /** Platform-agnostic label patched over the "Instagram people welcome!" line. */
  patchLabel: z.string().default('New riders welcome'),
});

export type InviteCardProps = z.infer<typeof inviteCardSchema>;

/**
 * The original invite card art used directly, patched to cover the
 * "Instagram people welcome!" line (this ships to TikTok / YT / Reels too).
 * Sits at the bottom-leading edge at ~50% opacity so it never covers the face.
 */
export const InviteCard: React.FC<InviteCardProps> = ({src, patchLabel}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const cardIn = spring({
    frame,
    fps,
    config: {damping: 15, mass: 0.85},
    durationInFrames: 22,
  });
  const opacity =
    interpolate(frame, [0, 5], [0, 1], {extrapolateRight: 'clamp'}) *
    exitFade(frame, durationInFrames);

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'flex-start',
        paddingLeft: 40,
        paddingBottom: 120,
        opacity: opacity * 0.55,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: 470,
          transform: `translateX(${(1 - cardIn) * -60}px)`,
        }}
      >
        <Img src={staticFile(src)} style={{width: '100%', display: 'block'}} />
        {/* patch over "Instagram people welcome!" — platform agnostic */}
        <div
          style={{
            position: 'absolute',
            top: '43.4%',
            left: '12%',
            width: '76%',
            height: '4.6%',
            background: '#060607',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              fontFamily: bodyFont('en-US'),
              fontSize: 18,
              fontWeight: 600,
              color: bone[300],
            }}
          >
            {patchLabel}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
