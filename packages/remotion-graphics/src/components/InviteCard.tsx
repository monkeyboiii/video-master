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
  /** Card width in px (900×1530 art). */
  width: z.number().default(470),
  /**
   * Vertical CENTRE of the card, as a % of frame height. It used to sit in the lower third
   * (on the subtitle line); the QR now goes on the founder's face, so the compositor blurs
   * the footage behind it. ~42 clears the captions and lands the card over the lower face.
   */
  yPct: z.number().default(42),
});

export type InviteCardProps = z.infer<typeof inviteCardSchema>;

/**
 * The original invite card art used directly, patched to cover the
 * "Instagram people welcome!" line (this ships to TikTok / YT / Reels too).
 * Placed over the founder's face at `yPct` (the footage behind it is blurred in the
 * compositor), at full opacity, sized like the other overlay cards.
 */
export const InviteCard: React.FC<InviteCardProps> = ({
  src,
  patchLabel,
  width,
  yPct,
}) => {
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
    <AbsoluteFill style={{opacity}}>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: `${yPct}%`,
          width,
          transform: `translate(-50%, -50%) translateY(${(1 - cardIn) * 70}px)`,
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
