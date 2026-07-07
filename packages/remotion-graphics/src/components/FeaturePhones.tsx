import React from 'react';
import {
  AbsoluteFill,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {z} from 'zod';
import {exitFade} from '../shared';
import {bone, dirt} from '../theme/tokens';
import {monoFont} from '../theme/fonts';

const segmentSchema = z.object({
  src: z.string(), // file in public/_feat/ (.mp4 plays, .png holds as a freeze)
  trimSec: z.number().default(0),
  seconds: z.number(),
});

const phoneSchema = z.object({
  label: z.string().default(''),
  segments: z.array(segmentSchema),
});

export const featurePhonesSchema = z.object({
  durationSec: z.number().default(4),
  phones: z.array(phoneSchema),
});

export type FeaturePhonesProps = z.infer<typeof featurePhonesSchema>;

const isStill = (src: string): boolean => /\.(png|jpe?g)$/i.test(src);

const PhoneSegments: React.FC<{
  segments: z.infer<typeof segmentSchema>[];
  fps: number;
}> = ({segments, fps}) => {
  let acc = 0;
  return (
    <>
      {segments.map((s, i) => {
        const from = Math.round(acc * fps);
        const dur = Math.max(1, Math.round(s.seconds * fps));
        acc += s.seconds;
        return (
          <Sequence key={i} from={from} durationInFrames={dur}>
            {isStill(s.src) ? (
              <Img
                src={staticFile(`_feat/${s.src}`)}
                style={{width: '100%', height: '100%', objectFit: 'cover'}}
              />
            ) : (
              <OffthreadVideo
                src={staticFile(`_feat/${s.src}`)}
                trimBefore={Math.round((s.trimSec ?? 0) * fps)}
                muted
                style={{width: '100%', height: '100%', objectFit: 'cover'}}
              />
            )}
          </Sequence>
        );
      })}
    </>
  );
};

/**
 * E1 app screen-recordings laid out side by side in the lower third — shown while
 * the founder explains features. Each phone plays its clip then freezes on its last
 * frame (a .png segment) so it can hold past the line. Covers the caption line.
 */
export const FeaturePhones: React.FC<FeaturePhonesProps> = ({phones}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const opacity =
    interpolate(frame, [0, 5], [0, 1], {extrapolateRight: 'clamp'}) *
    exitFade(frame, durationInFrames);

  const n = phones.length;
  const phoneW = n >= 2 ? 396 : 452;
  const phoneH = Math.round(phoneW * 1.92);

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 130,
        opacity,
      }}
    >
      <div style={{display: 'flex', gap: 30, alignItems: 'flex-end'}}>
        {phones.map((p, i) => {
          const inn = spring({
            frame: frame - i * 4,
            fps,
            config: {damping: 14, mass: 0.7},
            durationInFrames: 18,
          });
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
                transform: `translateY(${(1 - inn) * 70}px) scale(${0.9 + inn * 0.1})`,
              }}
            >
              <div
                style={{
                  position: 'relative',
                  width: phoneW,
                  height: phoneH,
                  borderRadius: 42,
                  overflow: 'hidden',
                  border: '5px solid #0b0b0b',
                  boxShadow: '0 22px 55px rgba(0,0,0,0.62)',
                  background: '#000',
                }}
              >
                <PhoneSegments segments={p.segments} fps={fps} />
              </div>
              {p.label ? (
                <div
                  style={{
                    fontFamily: monoFont('en-US'),
                    fontSize: 27,
                    fontWeight: 700,
                    letterSpacing: '0.03em',
                    color: bone[50],
                    background: dirt[500],
                    padding: '8px 18px',
                    borderRadius: 10,
                  }}
                >
                  {p.label}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
