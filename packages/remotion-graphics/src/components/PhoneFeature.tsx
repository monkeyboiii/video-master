import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {z} from 'zod';
import {localeSchema} from '../shared';
import {displayFont} from '../theme/fonts';
import {bone, dirt} from '../theme/tokens';

export const phoneFeatureSchema = z.object({
  locale: localeSchema,
  // filenames living in public/_feat/, shown in sequence inside the phone
  segments: z.array(z.string()),
  stampTop: z.string(),
  stampBottom: z.string(),
  durationSec: z.number(),
});

export type PhoneFeatureProps = z.infer<typeof phoneFeatureSchema>;

// Phone frame geometry on the 1080x1920 canvas (left side; founder shows on the right).
const PHONE = {x: 62, y: 300, w: 486, h: 1040, radius: 66, bezel: 13};

export const PhoneFeature: React.FC<PhoneFeatureProps> = ({
  locale,
  segments,
  stampTop,
  stampBottom,
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const enter = spring({frame, fps, config: {damping: 200}, durationInFrames: 16});
  const px = interpolate(enter, [0, 1], [-(PHONE.w + 160), PHONE.x]);
  const scale = interpolate(enter, [0, 1], [0.92, 1]);
  const exit = interpolate(
    frame,
    [durationInFrames - 8, durationInFrames - 1],
    [1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  const per = Math.max(1, Math.floor(durationInFrames / Math.max(1, segments.length)));

  // stamp animates in just after the phone lands
  const stampIn = spring({
    frame: frame - 12,
    fps,
    config: {damping: 200},
    durationInFrames: 12,
  });

  return (
    <AbsoluteFill style={{opacity: exit}}>
      {/* Phone */}
      <div
        style={{
          position: 'absolute',
          left: px,
          top: PHONE.y,
          width: PHONE.w,
          height: PHONE.h,
          transform: `scale(${scale})`,
          transformOrigin: 'left center',
          borderRadius: PHONE.radius,
          background: '#0b0a08',
          padding: PHONE.bezel,
          boxShadow: '0 55px 110px rgba(0,0,0,0.55), 0 0 0 2px rgba(255,255,255,0.05)',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            borderRadius: PHONE.radius - PHONE.bezel,
            overflow: 'hidden',
            backgroundColor: '#000',
          }}
        >
          {segments.map((s, i) => (
            <Sequence key={i} from={i * per} durationInFrames={per}>
              <OffthreadVideo
                src={staticFile(`_feat/${s}`)}
                style={{width: '100%', height: '100%', objectFit: 'cover'}}
                muted
              />
            </Sequence>
          ))}
        </div>
      </div>

      {/* Stamp — lower right, clear of the founder's face */}
      <div
        style={{
          position: 'absolute',
          right: 150,
          top: 1150,
          width: 470,
          textAlign: 'right',
          opacity: stampIn,
          transform: `translateY(${(1 - stampIn) * 40}px)`,
        }}
      >
        <div
          style={{
            display: 'inline-block',
            width: 96,
            height: 12,
            borderRadius: 4,
            background: dirt[500],
            marginBottom: 22,
          }}
        />
        <div
          style={{
            fontFamily: displayFont(locale),
            fontWeight: 800,
            fontSize: 58,
            lineHeight: 1.02,
            letterSpacing: '-0.02em',
            color: dirt[500],
            textTransform: 'uppercase',
            textShadow: '0 4px 30px rgba(0,0,0,0.6)',
          }}
        >
          {stampTop}
        </div>
        <div
          style={{
            fontFamily: displayFont(locale),
            fontWeight: 800,
            fontSize: 82,
            lineHeight: 1.0,
            letterSpacing: '-0.03em',
            color: bone[50],
            textTransform: 'uppercase',
            textShadow: '0 4px 30px rgba(0,0,0,0.7)',
          }}
        >
          {stampBottom}
        </div>
      </div>
    </AbsoluteFill>
  );
};
