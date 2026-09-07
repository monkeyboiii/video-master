import {zTextarea} from '@remotion/zod-types';
import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
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
 *
 * THE BAND LIGHTS; THE TEXT DOES NOT. In both locales the spoken word is marked by its rule
 * alone. Recolouring the glyphs on every word makes the whole line flicker, and the band already
 * says where the voice is. A word carrying the point of the sentence is the exception — mark it
 * `*` in its row and its text lights too, which is why the lit text still means something when
 * you see it.
 *
 * ONE LINE, ALWAYS, AT A FIXED SIZE. The type does not shrink to fit. A caption that resizes per
 * sentence makes the frame twitch, and a sentence that shrank far enough to fit is one nobody
 * reads. The size is chosen per locale up front, so the line width the screen allows is known
 * before a word is drawn, and a sentence too wide for it is CUT rather than compressed —
 * `SpokenSubtitleTrack` does the cutting.
 *
 * EN LEFT, ZH CENTRED. Streaming text cannot be centred: every new word re-centres the line and
 * drags the words already read sideways, so the reader re-finds their place on every word. Left
 * alignment nails the start of the line down and lets the growth happen only at the end. zh has
 * the whole sentence from frame one and never moves, so it centres.
 *
 * A WORD IS WHATEVER A ROW IS. whisper.cpp emits zh timings per CHARACTER, and highlighting per
 * character is wrong — 核心 is one word and lights as one. The component does not segment; it
 * highlights exactly the units it is given, so grouping happens upstream where the script's own
 * word boundaries are known. `tools/group-words.mjs` does it.
 */
export const spokenSubtitleSchema = z.object({
  locale: localeSchema,
  /**
   * One line, as `text|startMs|endMs` per row — the Caption[] shape tools/transcribe.mjs writes.
   * A fourth field of `*` marks the word as important, which is the only thing that lights text.
   */
  words: zTextarea(),
  durationSec: z.number(),
  fontSize: z.number().optional(),
});

export type SpokenSubtitleProps = z.infer<typeof spokenSubtitleSchema>;

export type Word = {
  text: string;
  startMs: number;
  endMs: number;
  important: boolean;
};

export const parseWords = (raw: string): Word[] =>
  raw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [text, a, b, flag] = l.split('|');
      return {
        text: text ?? '',
        startMs: Number(a ?? 0),
        endMs: Number(b ?? 0),
        important: (flag ?? '').trim() === '*',
      };
    })
    .filter((w) => w.text.length > 0);

/** The one size for this locale. Fixed by definition — nothing measures its way out of it. */
export const captionSize = (locale: Locale, fontSize?: number): number =>
  (fontSize ?? 68) * localeScale(locale);

/** Gap between Latin words, as a fraction of the size. zh sets no gap. */
export const wordGap = (locale: Locale, size: number): number =>
  locale === 'zh-CN' ? 0 : size * 0.26;

/** How wide the line may be before the track has to cut it. */
export const captionRoom = (width: number): number =>
  width - SAFE_ZONE.left - SAFE_ZONE.right;

/**
 * The hatch. A repeating-linear-gradient rather than an SVG pattern so it costs one paint, and
 * sized FROM the type rather than in fixed pixels — a 40px caption and a 90px one otherwise get
 * dashes of different apparent weight.
 */
const stripes = (size: number, line: string, ground: string): string => {
  const dash = Math.max(2, size * 0.055);
  return `repeating-linear-gradient(45deg, ${line} 0 ${dash}px, ${ground} ${dash}px ${dash * 2.6}px)`;
};

export const SpokenSubtitle: React.FC<SpokenSubtitleProps> = ({
  locale,
  words,
  fontSize,
}) => {
  const frame = useCurrentFrame();
  const ms = (frame / FPS) * 1000;
  const parsed = useMemo(() => parseWords(words), [words]);
  const karaoke = locale === 'zh-CN';
  const family = bodyFont(locale as Locale);
  const size = captionSize(locale as Locale, fontSize);

  // zh: every word is laid out from frame 0 and only its band changes.
  // en: a word that has not started is not rendered at all, so the line grows to the right.
  const visible = karaoke ? parsed : parsed.filter((w) => ms >= w.startMs);

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: karaoke ? 'center' : 'flex-start',
        paddingBottom: SAFE_ZONE.bottom,
        paddingLeft: SAFE_ZONE.left,
        paddingRight: SAFE_ZONE.right,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'nowrap',
          whiteSpace: 'nowrap',
          fontFamily: family,
          fontWeight: 800,
          fontSize: size,
          lineHeight: 1.18,
          columnGap: wordGap(locale as Locale, size),
        }}
      >
        {visible.map((w, i) => {
          const lit = ms >= w.startMs && ms < w.endMs;
          return (
            <span
              key={`${i}-${w.text}`}
              style={{
                position: 'relative',
                zIndex: 0,
                // ONE text colour throughout — the band alone carries the state. The exception
                // is a word marked important, and only while it is being spoken.
                color: w.important && lit ? spoken.lit : spoken.text,
                paddingBottom: size * 0.16,
                // the stroke is what keeps the text legible over any footage
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
                  // the lit block is much taller and rises BEHIND the character; the unlit rule
                  // sits at the baseline. Both are bottom-aligned so the block grows upward.
                  height: size * (lit ? 0.4 : 0.26),
                  // behind the text, or a tall block hides the glyph it is marking
                  zIndex: -1,
                  // BOTH states carry the stripes — the highlight is not a flat fill. Lit is the
                  // fluorescent ground under its own darker stripes; unlit is near-black under
                  // grey ones. A flat highlight next to a striped band reads as two unrelated
                  // objects rather than as one rule lighting up.
                  background: lit
                    ? stripes(size, spoken.litHatch, spoken.lit)
                    : stripes(size, spoken.hatch, spoken.band),
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
