import React from 'react';
import {
  AbsoluteFill,
  OffthreadVideo,
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

const phoneSchema = z.object({
  src: z.string(), // file in public/_feat/
  trimSec: z.number().default(0),
  label: z.string().default(''),
});

export const featurePhonesSchema = z.object({
  durationSec: z.number().default(3),
  phones: z.array(phoneSchema),
});

export type FeaturePhonesProps = z.infer<typeof featurePhonesSchema>;

/**
 * E1 app screen-recordings laid out side by side in the lower third — shown while
 * the founder explains features (21 languages, post once, seen by real riders).
 * Sits over the caption line so it covers the subtitles during the demo.
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
                  width: phoneW,
                  height: phoneH,
                  borderRadius: 42,
                  overflow: 'hidden',
                  border: '5px solid #0b0b0b',
                  boxShadow: '0 22px 55px rgba(0,0,0,0.62)',
                  background: '#000',
                }}
              >
                <OffthreadVideo
                  src={staticFile(`_feat/${p.src}`)}
                  trimBefore={Math.round((p.trimSec ?? 0) * fps)}
                  muted
                  style={{width: '100%', height: '100%', objectFit: 'cover'}}
                />
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
