import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {z} from 'zod';
import {exitFade} from '../shared';
import {bone, dirt, moto, SAFE_ZONE, scrim} from '../theme/tokens';
import {displayFont} from '../theme/fonts';

const captionWordSchema = z.object({
  t: z.string(), // the word (include trailing punctuation)
  s: z.number(), // start time in seconds, relative to this overlay
  e: z.enum(['brand', 'harsh']).optional(), // emphasis color
});

export const kineticCaptionsSchema = z.object({
  durationSec: z.number(),
  words: z.array(captionWordSchema),
  fontScale: z.number().default(1),
  /** Max words shown at once (older ones scroll off). Kept small = one line. */
  window: z.number().default(6),
});

export type KineticCaptionsProps = z.infer<typeof kineticCaptionsSchema>;

const colorFor = (e?: 'brand' | 'harsh'): string =>
  e === 'brand' ? dirt[400] : e === 'harsh' ? moto.red : bone[50];

/** The caption background is a fixed-width box, so the line must be fitted to it. */
const PANEL_WIDTH = 880;
const PANEL_PAD_X = 26;
const WORD_GAP = 16;
/** Approx advance width of Bricolage Grotesque ExtraBold, in em per character. */
const AVG_CHAR_EM = 0.55;
/** CJK/full-width glyphs are square — a full em each, not 0.55. */
const CJK_CHAR_EM = 1;

/** True for codepoints drawn on a full-width (square) advance. */
const isFullWidth = (cp: number): boolean =>
  (cp >= 0x3000 && cp <= 0x303f) || // CJK symbols and punctuation
  (cp >= 0x3040 && cp <= 0x30ff) || // Hiragana + Katakana
  (cp >= 0x3400 && cp <= 0x4dbf) || // CJK Unified Ideographs Extension A
  (cp >= 0x4e00 && cp <= 0x9fff) || // CJK Unified Ideographs
  (cp >= 0xf900 && cp <= 0xfaff) || // CJK Compatibility Ideographs
  (cp >= 0xff00 && cp <= 0xffef); // Halfwidth and Fullwidth Forms

/**
 * Estimated advance width of `t`, in em. Latin is unchanged — an all-Latin
 * string returns exactly `t.length * AVG_CHAR_EM` — while CJK/full-width
 * codepoints count a whole em, so zh-CN lines are not under-measured by ~half.
 */
const estWidthEm = (t: string): number => {
  let narrow = 0;
  let wide = 0;
  for (const ch of t) {
    if (isFullWidth(ch.codePointAt(0) ?? 0)) wide++;
    else narrow++;
  }
  return narrow * AVG_CHAR_EM + wide * CJK_CHAR_EM;
};

/**
 * Streaming captions: words appear one-by-one as spoken (like a message typing
 * out), accumulate in a rolling window, keyword-colored. Bottom-anchored above
 * the platform safe zone. Rendered as a ProRes 4444 alpha overlay for Kdenlive.
 */
export const KineticCaptions: React.FC<KineticCaptionsProps> = ({
  words,
  fontScale,
  window: win,
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const t = frame / fps;

  const opacity =
    interpolate(frame, [0, 3], [0, 1], {extrapolateRight: 'clamp'}) *
    exitFade(frame, durationInFrames);
  const fontSize = 60 * fontScale;

  const revealedIdx: number[] = [];
  words.forEach((w, i) => {
    if (t >= w.s) revealedIdx.push(i);
  });

  // The panel is a fixed-width box, so pick the newest words by a WIDTH budget rather than
  // a fixed count — otherwise long words (e.g. "DirtBikeX.", "reminded") get clipped at the
  // edges, and the clipped one is always the word just spoken. `window` is an upper bound.
  const usable = PANEL_WIDTH - PANEL_PAD_X * 2;
  const shown: number[] = [];
  let used = 0;
  for (let k = revealedIdx.length - 1; k >= 0 && shown.length < win; k--) {
    const idx = revealedIdx[k];
    const wPx =
      estWidthEm(words[idx].t) * fontSize + (shown.length ? WORD_GAP : 0);
    if (shown.length > 0 && used + wPx > usable) break;
    used += wPx;
    shown.unshift(idx);
  }
  const scrolledOff = shown.length < revealedIdx.length;

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: SAFE_ZONE.bottom + 24,
        paddingLeft: 40,
        paddingRight: 40,
        opacity,
      }}
    >
      <div
        style={{
          background: scrim(0.6),
          borderRadius: 22,
          padding: '14px 26px',
          display: 'flex',
          flexWrap: 'nowrap',
          whiteSpace: 'nowrap',
          justifyContent: 'center',
          alignItems: 'baseline',
          gap: `0 ${WORD_GAP}px`,
          width: PANEL_WIDTH,
          overflow: 'hidden',
        }}
      >
        {shown.map((i, k) => {
          const w = words[i];
          const wf = frame - w.s * fps;
          const appear = interpolate(wf, [0, 6], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const pop = interpolate(wf, [0, 4, 9], [0.62, 1.12, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const isLatest = i === shown[shown.length - 1];
          const ageFade = k === 0 && scrolledOff ? 0.4 : 1;
          return (
            <span
              key={i}
              style={{
                fontFamily: displayFont('en-US'),
                fontWeight: 800,
                fontSize,
                lineHeight: 1.18,
                color: colorFor(w.e),
                opacity: appear * ageFade,
                transform: `translateY(${(1 - appear) * 18}px) scale(${
                  isLatest ? pop : 1
                })`,
                textShadow: '0 2px 10px rgba(0,0,0,0.55)',
                display: 'inline-block',
              }}
            >
              {w.t}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
