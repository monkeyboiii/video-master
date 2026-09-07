import {zTextarea} from '@remotion/zod-types';
import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {FPS, localeSchema, localeScale, overlayMetadata, type Locale} from '../shared';
import {bodyFont} from '../theme/fonts';
import {SAFE_ZONE, spoken} from '../theme/tokens';

/**
 * A caption line that follows the voice, in the two ways the two locales need.
 *
 * THE LOCALE DIFFERENCE IS THE POINT, and it is not a style preference — it follows from how the
 * two scripts are read:
 *
 *   zh-CN  KARAOKE. The whole line is on screen from its first frame, and a highlight streams
 *          across it word by word. Chinese is read by recognising whole characters at a glance,
 *          so a reader takes in the line faster than it is spoken; showing all of it costs
 *          nothing and lets them read ahead, while the highlight keeps them anchored to the
 *          voice.
 *   en-US  STREAMING. Words appear only once spoken; the line is never shown ahead of the
 *          voice. Latin script is read left-to-right at roughly speaking pace, so a fully
 *          revealed line invites the eye to run to the end and then wait — the pause that makes
 *          short-form captions feel slow.
 *
 * Both modes share one band: a near-black rule under the line, crossed by grey slanted dashes,
 * with the spoken span switching to fluorescent yellow-green. The dashes are what make an unlit
 * band read as "not yet" rather than as a design element, so they are drawn even where no word
 * has landed.
 */
export const spokenSubtitleSchema = z.object({
  locale: localeSchema,
  /** One line, as `text|startMs|endMs` per row — the Caption[] shape tools/transcribe.mjs writes. */
  words: zTextarea(),
  durationSec: z.number(),
  fontSize: z.number().optional(),
  /** Light the spoken text as well as its band segment. The reference frames keep text white. */
  litText: z.boolean().optional(),
});

export type SpokenSubtitleProps = z.infer<typeof spokenSubtitleSchema>;

type Word = {text: string; startMs: number; endMs: number};

const parseWords = (raw: string): Word[] =>
  raw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [text, a, b] = l.split('|');
      return {text: text ?? '', startMs: Number(a ?? 0), endMs: Number(b ?? 0)};
    })
    .filter((w) => w.text.length > 0);

/**
 * The hatch. A repeating-linear-gradient rather than an SVG pattern so it costs one paint, and
 * sized FROM the type rather than in fixed pixels — a 40px caption and a 90px one otherwise get
 * dashes of different apparent weight. 20deg leans them the way the reference does.
 */
const hatch = (size: number): string => {
  const dash = Math.max(2, size * 0.05);
  return `repeating-linear-gradient(20deg, ${spoken.hatch} 0 ${dash}px, ${spoken.band} ${dash}px ${dash * 3.4}px)`;
};

export const SpokenSubtitle: React.FC<SpokenSubtitleProps> = ({
  locale,
  words,
  fontSize,
  litText = true,
}) => {
  const frame = useCurrentFrame();
  const {width} = useVideoConfig();
  const ms = (frame / FPS) * 1000;
  const parsed = useMemo(() => parseWords(words), [words]);
  const size = (fontSize ?? 68) * localeScale(locale as Locale);
  const karaoke = locale === 'zh-CN';

  // zh: every word is laid out from frame 0 and only its colour changes.
  // en: a word that has not started is not rendered at all, so the line grows.
  const visible = karaoke ? parsed : parsed.filter((w) => ms >= w.startMs);

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: SAFE_ZONE.bottom,
        paddingLeft: SAFE_ZONE.left,
        paddingRight: SAFE_ZONE.right,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          maxWidth: width - SAFE_ZONE.left - SAFE_ZONE.right,
          fontFamily: bodyFont(locale as Locale),
          fontWeight: 800,
          fontSize: size,
          lineHeight: 1.18,
          // zh has no spaces; Latin needs them between words
          columnGap: karaoke ? 0 : size * 0.26,
        }}
      >
        {visible.map((w, i) => {
          const lit = ms >= w.startMs && ms < w.endMs;
          const done = ms >= w.endMs;
          return (
            <span
              key={`${i}-${w.text}`}
              style={{
                position: 'relative',
                color: lit && litText ? spoken.lit : spoken.text,
                paddingBottom: size * 0.16,
                // the stroke is what keeps white text legible over any footage
                WebkitTextStroke: `${Math.max(2, size * 0.045)}px ${spoken.stroke}`,
                paintOrder: 'stroke fill',
              }}
            >
              {w.text}
              <span
                style={{
                  position: 'absolute',
                  left: karaoke ? 0 : -size * 0.08,
                  right: karaoke ? 0 : -size * 0.08,
                  bottom: 0,
                  // the lit block sits slightly proud of the hatched rule, as it does in the
                  // reference — the eye finds the spoken word by its weight before its colour
                  height: size * (lit ? 0.28 : 0.24),
                  // lit: flat fluorescent. otherwise: black crossed by grey dashes.
                  background: lit ? spoken.lit : hatch(size),
                  // a word already spoken keeps the band but not the light — the line reads as a
                  // progress bar the eye can scan back along
                  opacity: done && !lit ? 0.9 : 1,
                  transform: 'skewX(-12deg)',
                }}
              />
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const spokenSubtitleMetadata = overlayMetadata<SpokenSubtitleProps>(4);
