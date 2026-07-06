import React from 'react';
import {
  AbsoluteFill,
  Img,
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

// One thing shown inside the phone: a video segment (src, optional in-source trim,
// how long to show) or a still image (held for `seconds` — e.g. a freeze frame).
const segmentSchema = z.object({
  src: z.string(), // file in public/_feat/
  trimSec: z.number().default(0), // start offset within the source (video only)
  seconds: z.number(), // how long to show it inside the phone
});

export const phoneFeatureSchema = z.object({
  locale: localeSchema,
  segments: z.array(segmentSchema),
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
          {(() => {
            const cover = {width: '100%', height: '100%', objectFit: 'cover'} as const;
            let acc = 0;
            return segments.map((s, i) => {
              const from = Math.round(acc * fps);
              const dur = Math.round(s.seconds * fps);
              acc += s.seconds;
              const isImg = /\.(png|jpe?g)$/i.test(s.src);
              return (
                <Sequence key={i} from={from} durationInFrames={dur}>
                  {isImg ? (
                    <Img src={staticFile(`_feat/${s.src}`)} style={cover} />
                  ) : (
                    <OffthreadVideo
                      src={staticFile(`_feat/${s.src}`)}
                      trimBefore={Math.round((s.trimSec ?? 0) * fps)}
                      style={cover}
                      muted
                    />
                  )}
                </Sequence>
              );
            });
          })()}
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
