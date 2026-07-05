import React from 'react';
import {AbsoluteFill, Img, staticFile, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {localeSchema, localeScale} from '../shared';
import {bodyFont, displayFont} from '../theme/fonts';
import {bone, safeZoneFor, xGradientCss} from '../theme/tokens';

export const coverSchema = z.object({
  locale: localeSchema,
  title: z.string(),
  subtitle: z.string().optional(),
  backgroundSrc: z.string().nullable().optional(),
});

export type CoverProps = z.infer<typeof coverSchema>;

/**
 * Text-forward cover still. Opaque: photo background (path under public/)
 * with a dark scrim, or the dark brand background when backgroundSrc is null.
 * Shared by cover-9x16 (1080x1920) and cover-3x4 (1080x1440); sizes and the
 * safe zone derive from the composition dimensions.
 */
export const Cover: React.FC<CoverProps> = ({
  locale,
  title,
  subtitle,
  backgroundSrc,
}) => {
  const {width, height} = useVideoConfig();
  const safe = safeZoneFor(width, height);
  const scale = localeScale(locale);

  return (
    <AbsoluteFill style={{backgroundColor: bone[950]}}>
      {backgroundSrc ? (
        <>
          <Img
            src={staticFile(backgroundSrc)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          <AbsoluteFill
            style={{
              background:
                'linear-gradient(180deg, rgba(22,20,15,0.55) 0%, rgba(22,20,15,0.2) 38%, rgba(22,20,15,0.94) 80%)',
            }}
          />
        </>
      ) : (
        <AbsoluteFill
          style={{
            background:
              'radial-gradient(120% 70% at 85% 8%, rgba(90,36,11,0.55) 0%, rgba(22,20,15,0) 60%)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: height * 0.3,
              left: -width * 0.2,
              width: width * 1.4,
              height: 20,
              background: xGradientCss,
              opacity: 0.28,
              transform: 'rotate(-24deg)',
            }}
          />
        </AbsoluteFill>
      )}
      <AbsoluteFill
        style={{
          paddingTop: safe.top,
          paddingBottom: safe.bottom,
          paddingLeft: safe.left,
          paddingRight: safe.right,
          justifyContent: 'space-between',
        }}
      >
        <Img
          src={staticFile('brand/logo-lockup.svg')}
          style={{height: height * 0.03, alignSelf: 'flex-start'}}
        />
        <div>
          <div
            style={{
              width: 90,
              height: 14,
              borderRadius: 3,
              background: xGradientCss,
              marginBottom: height * 0.022,
            }}
          />
          <div
            style={{
              fontFamily: displayFont(locale),
              fontWeight: 800,
              fontSize: height * 0.062 * scale,
              lineHeight: 1.06,
              letterSpacing: locale === 'zh-CN' ? '0' : '-0.02em',
              color: bone[50],
            }}
          >
            {title}
          </div>
          {subtitle ? (
            <div
              style={{
                fontFamily: bodyFont(locale),
                fontWeight: 600,
                fontSize: height * 0.026 * scale,
                lineHeight: 1.3,
                color: bone[300],
                marginTop: height * 0.02,
              }}
            >
              {subtitle}
            </div>
          ) : null}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
