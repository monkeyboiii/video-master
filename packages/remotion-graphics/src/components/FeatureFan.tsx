import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {z} from 'zod';
import {exitFade} from '../shared';
import {monoFont} from '../theme/fonts';
import {bone, dirt} from '../theme/tokens';

const itemSchema = z.object({
  /** Asset in public/ — a `.png`/`.jpg` holds as a still, anything else plays as video. */
  src: z.string(),
  /** Box in the 1080x1920 frame. Carry the asset's own aspect ratio: stills are `contain`,
   *  but a video is stretched to fill and a mismatched box distorts it. */
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  /** Seconds into this overlay at which the item enters. Anchor it to the spoken word. */
  atSec: z.number(),
  /** Chip under the item. Same treatment as S01E002's feature-phone labels. */
  label: z.string().default(''),
  labelSize: z.number().default(24),
  /** Draw a rounded plate behind the asset. Transparent icons need one to survive whatever is
   *  behind them; a screenshot that is already a card does not. */
  plate: z.boolean().default(false),
  /** Plate fill. White reads as a sticker and keeps a blue glyph legible over blurred footage;
   *  a dark plate makes a blue glyph muddy. The orange border carries the brand either way. */
  plateColor: z.string().default('#FFFFFF'),
  /** Padding between the plate edge and the asset, in px. */
  platePad: z.number().default(34),
  /**
   * Video only. A recording that is shorter than its time on screen must FREEZE, not vanish:
   * `OffthreadVideo` renders nothing past its own end. Extract the last frame
   * (`ffmpeg -sseof -0.15 -i clip.mov -frames:v 1 clip-freeze.png`) and give it here, with
   * `videoSec` = how long the clip really plays. Same trick as `FeaturePhones`. Empty = no freeze.
   */
  freezeSrc: z.string().default(''),
  videoSec: z.number().default(0),
});

export const featureFanSchema = z.object({
  durationSec: z.number().default(4),
  items: z.array(itemSchema),
  /** Entrance: rise this far, over this long. Matches SideScreen / BrandDrop. */
  riseSec: z.number().default(0.45),
  risePx: z.number().default(70),
});

export type FeatureFanProps = z.infer<typeof featureFanSchema>;

const isStill = (src: string): boolean => /\.(png|jpe?g|webp)$/i.test(src);

const Item: React.FC<{item: z.infer<typeof itemSchema>; riseSec: number; risePx: number}> = ({
  item,
  riseSec,
  risePx,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  // `frame` is already relative to this item's Sequence, so 0 is its entrance.
  const inn = interpolate(frame, [0, riseSec * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const opacity = interpolate(frame, [0, 0.35 * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const frozen =
    item.freezeSrc !== '' && item.videoSec > 0 && frame >= Math.round(item.videoSec * fps);
  const media = isStill(item.src) ? (
    <Img
      src={staticFile(item.src)}
      style={{width: '100%', height: '100%', objectFit: 'contain'}}
    />
  ) : frozen ? (
    <Img
      src={staticFile(item.freezeSrc)}
      style={{width: '100%', height: '100%', objectFit: 'fill'}}
    />
  ) : (
    <OffthreadVideo
      src={staticFile(item.src)}
      muted
      style={{width: '100%', height: '100%', objectFit: 'fill'}}
    />
  );

  return (
    <div
      style={{
        position: 'absolute',
        left: item.x,
        top: item.y,
        width: item.w,
        opacity,
        transform: `translateY(${(1 - inn) * risePx}px) scale(${0.92 + inn * 0.08})`,
        transformOrigin: 'center bottom',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: item.w,
          height: item.h,
          ...(item.plate
            ? {
                padding: item.platePad,
                boxSizing: 'border-box' as const,
                borderRadius: 34,
                background: item.plateColor,
                border: `4px solid ${dirt[500]}`,
                boxShadow: '0 22px 55px rgba(0,0,0,0.55)',
              }
            : {
                borderRadius: 22,
                overflow: 'hidden',
                border: '5px solid #0b0b0b',
                boxShadow: '0 22px 55px rgba(0,0,0,0.62)',
                background: '#000',
              }),
        }}
      >
        {media}
      </div>
      {item.label ? (
        <div style={{display: 'flex', justifyContent: 'center', marginTop: 14}}>
          <div
            style={{
              fontFamily: monoFont('en-US'),
              fontSize: item.labelSize,
              fontWeight: 700,
              letterSpacing: '0.03em',
              color: bone[50],
              background: dirt[500],
              padding: `${Math.round(item.labelSize * 0.3)}px ${Math.round(item.labelSize * 0.67)}px`,
              borderRadius: 10,
              whiteSpace: 'nowrap',
            }}
          >
            {item.label}
          </div>
        </div>
      ) : null}
    </div>
  );
};

/**
 * Feature badges that fan out one at a time, each landing on the word that names it, and all
 * clearing together. S01E005's "the flair, the stats, the custom invites, and the insider hacks":
 * three transparent icons on dark plates, then the members-only post — a real screen recording,
 * placed over his face — arriving last. The compositor blurs V1 behind them (Route B, blur only,
 * never dim); this overlay stays transparent.
 */
export const FeatureFan: React.FC<FeatureFanProps> = ({items, riseSec, risePx}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const opacity = exitFade(frame, durationInFrames);

  return (
    <AbsoluteFill style={{opacity}}>
      {items.map((item, i) => {
        const from = Math.round(item.atSec * fps);
        return (
          <Sequence key={i} from={from} durationInFrames={Math.max(1, durationInFrames - from)}>
            <Item item={item} riseSec={riseSec} risePx={risePx} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
