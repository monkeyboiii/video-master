import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {z} from 'zod';

/**
 * Four corner marks land one per pointing gesture, then collapse into the centre and hand off to
 * the DirtBikeX lockup: the four marks become the four axes of the logo's X, and the wordmark
 * presents and expands out of it.
 *
 * Times are relative to the composition start, so the caller places the whole thing on the
 * timeline with one offset.
 */
const cornerSchema = z.object({
  x: z.number(),
  y: z.number(),
  atSec: z.number(),
});

export const brandFormSchema = z.object({
  durationSec: z.number().default(4.28),
  markSrc: z.string().default('e202/orange-X.svg'),
  logoSrc: z.string().default('e202/DirtBikeX.svg'),

  corners: z.array(cornerSchema).default([
    {x: 200, y: 430, atSec: 0.0},
    {x: 880, y: 430, atSec: 0.68},
    {x: 200, y: 1490, atSec: 1.48},
    {x: 880, y: 1490, atSec: 2.05},
  ]),

  /** Corner mark width. Bigger than a callout: these have to hold against the white sticker border. */
  markWidth: z.number().default(240),
  /** Where the four collapse to, and where the logo's X ends up sitting. */
  centerX: z.number().default(540),
  centerY: z.number().default(980),

  convergeSec: z.number().default(2.55),
  formSec: z.number().default(2.90),
  expandSec: z.number().default(3.68),

  logoWidthSmall: z.number().default(360),
  logoWidthLarge: z.number().default(760),

  /**
   * Where the finished lockup settles, as the centre of the WHOLE wordmark.
   * The X has to own the convergence point at the moment of the handoff — that is where the four
   * marks arrive — but leaving it anchored there would hang "DirtBike" off to the left. So the
   * logo recentres onto this point while it expands.
   */
  finalCenterX: z.number().default(540),
  finalCenterY: z.number().default(980),

  /** Sparks thrown off at the moment the four marks become the X. 0 disables. */
  sparkCount: z.number().default(14),
});

export type BrandFormProps = z.infer<typeof brandFormSchema>;

// Where the X sits inside DirtBikeX.svg (887x423 viewBox, X mark spans 529..860 / 19..383).
const X_CX = 694.5 / 887;
const X_CY = 201 / 423;
const MARK_AR = 377 / 344; // orange-X.svg is 344x377

const TRAIL = [1.6, 3.0, 4.6]; // ghost lookbacks, in frames
const ANTICIPATE = -0.1; // marks pull outward before rushing in

export const BrandForm: React.FC<BrandFormProps> = ({
  markSrc,
  logoSrc,
  corners,
  markWidth,
  centerX,
  centerY,
  convergeSec,
  formSec,
  expandSec,
  logoWidthSmall,
  logoWidthLarge,
  finalCenterX,
  finalCenterY,
  sparkCount,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const convergeF = convergeSec * fps;
  const formF = formSec * fps;
  const expandF = expandSec * fps;
  const anticipF = (formF - convergeF) * 0.34;
  const stagger = 1.6; // marks leave a beat apart but still land together

  const logoXWidth = (logoWidthSmall * (860 - 529)) / 887;
  const targetScale = logoXWidth / markWidth;

  /** Collapse progress for mark i at an arbitrary frame — also used to sample motion-trail ghosts. */
  const collapseAt = (f: number, i: number) => {
    const start = convergeF + i * stagger;
    return interpolate(f, [start, start + anticipF, formF], [0, ANTICIPATE, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.cubic),
    });
  };

  const marksOpacity = interpolate(frame, [formF - 3, formF + 1], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const logoOpacity = interpolate(frame, [formF - 2, formF + 4], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const expand = spring({
    frame: frame - expandF,
    fps,
    durationInFrames: 16,
    config: {damping: 14, mass: 0.7},
  });
  const logoWidth = interpolate(expand, [0, 1], [logoWidthSmall, logoWidthLarge]);
  const logoHeight = (logoWidth * 423) / 887;

  // The lockup lands with a little squash so the handoff has weight.
  const formPunch = spring({
    frame: frame - formF,
    fps,
    durationInFrames: 11,
    config: {damping: 9, mass: 0.5},
  });
  const punchScale = interpolate(formPunch, [0, 1], [1.14, 1]);

  // Impact bloom at the join.
  const bloomT = (frame - formF) / (0.34 * fps);
  const bloomOn = bloomT >= -0.15 && bloomT <= 1;
  const bloomOpacity = interpolate(bloomT, [-0.15, 0.12, 1], [0, 0.85, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const bloomScale = interpolate(bloomT, [-0.15, 1], [0.35, 1.75], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const sparkT = (frame - formF) / (0.42 * fps);
  const sparksOn = sparkT >= 0 && sparkT <= 1 && sparkCount > 0;

  const renderMark = (
    i: number,
    p: number,
    landed: number,
    opacity: number,
    blur: number,
  ) => {
    const x = interpolate(p, [0, 1], [corners[i].x, centerX]);
    const y = interpolate(p, [0, 1], [corners[i].y, centerY]);
    const scale =
      interpolate(landed, [0, 1], [0.35, 1]) *
      interpolate(p, [0, 1], [1, targetScale]);
    const rot = interpolate(p, [0, 1], [i % 2 === 0 ? -18 : 18, 0]);
    const w = markWidth;
    const h = w * MARK_AR;
    return (
      <Img
        key={`${i}-${blur}`}
        src={staticFile(markSrc)}
        style={{
          position: 'absolute',
          left: x - w / 2,
          top: y - h / 2,
          width: w,
          height: h,
          transform: `scale(${scale}) rotate(${rot}deg)`,
          opacity,
          // The rider already carries a white sticker border, so the marks are separated with a
          // dark halo instead — orange on a tan wall has no contrast on its own.
          filter: blur
            ? `blur(${blur}px)`
            : 'drop-shadow(0 0 22px rgba(0,0,0,0.60)) drop-shadow(0 10px 16px rgba(0,0,0,0.45))',
        }}
      />
    );
  };

  return (
    <AbsoluteFill>
      {marksOpacity > 0 &&
        corners.map((c, i) => {
          const atF = c.atSec * fps;
          if (frame < atF) return null;
          const landed = spring({
            frame: frame - atF,
            fps,
            durationInFrames: 13,
            config: {damping: 11, mass: 0.6},
          });
          const p = collapseAt(frame, i);
          const moving = p > 0.02 && p < 0.995;

          return (
            <React.Fragment key={i}>
              {/* Motion trail — only while it is actually travelling. */}
              {moving &&
                TRAIL.map((lb, g) =>
                  renderMark(
                    i,
                    collapseAt(frame - lb, i),
                    landed,
                    marksOpacity * (0.26 - g * 0.07),
                    2 + g * 2,
                  ),
                )}
              {renderMark(i, p, landed, marksOpacity * interpolate(landed, [0, 1], [0, 1]), 0)}
            </React.Fragment>
          );
        })}

      {bloomOn && (
        <div
          style={{
            position: 'absolute',
            left: centerX - 320,
            top: centerY - 320,
            width: 640,
            height: 640,
            transform: `scale(${bloomScale})`,
            opacity: bloomOpacity,
            background:
              'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,122,40,0.55) 28%, rgba(255,58,8,0.18) 48%, rgba(255,58,8,0) 70%)',
          }}
        />
      )}

      {sparksOn &&
        new Array(sparkCount).fill(0).map((_, i) => {
          const a = (i / sparkCount) * Math.PI * 2 + random(`ang-${i}`) * 0.5;
          const reach = 150 + random(`r-${i}`) * 230;
          const d = interpolate(sparkT, [0, 1], [26, reach], {
            easing: Easing.out(Easing.cubic),
          });
          const size = interpolate(sparkT, [0, 1], [11, 2]);
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: centerX + Math.cos(a) * d - size / 2,
                top: centerY + Math.sin(a) * d - size / 2,
                width: size,
                height: size,
                borderRadius: size,
                background: i % 3 === 0 ? '#fff' : '#ff6a20',
                opacity: interpolate(sparkT, [0, 0.25, 1], [0, 0.95, 0]),
                boxShadow: '0 0 10px rgba(255,106,32,0.9)',
              }}
            />
          );
        })}

      {logoOpacity > 0 && (
        <div
          style={{
            position: 'absolute',
            // Hands off anchored on the X (where the marks arrived), then recentres the whole
            // lockup as it expands so the finished wordmark sits centred, not hung off the X.
            left: interpolate(
              expand,
              [0, 1],
              [centerX - X_CX * logoWidth, finalCenterX - logoWidth / 2],
            ),
            top: interpolate(
              expand,
              [0, 1],
              [centerY - X_CY * logoHeight, finalCenterY - logoHeight / 2],
            ),
            width: logoWidth,
            height: logoHeight,
            transform: `scale(${punchScale})`,
            transformOrigin: `${X_CX * 100}% ${X_CY * 100}%`,
            opacity: logoOpacity,
          }}
        >
          <Img
            src={staticFile(logoSrc)}
            style={{
              width: '100%',
              height: '100%',
              filter: 'drop-shadow(0 10px 24px rgba(0,0,0,0.45))',
            }}
          />
        </div>
      )}
    </AbsoluteFill>
  );
};
