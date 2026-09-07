import {zTextarea} from '@remotion/zod-types';
import {fitText} from '@remotion/layout-utils';
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
 *
 * ONE LINE, ALWAYS. A caption that wraps puts half the sentence above the other half and the
 * reader's eye has to travel back; in short form it also eats the frame. The type is sized to the
 * WHOLE sentence with fitText and never wraps — so a sentence too long to fit gets small rather
 * than tall, and that is the signal to split it. `SpokenSubtitleTrack` is what splits.
 *
 * The fit is computed from the complete sentence even in streaming mode, where only some words are
 * drawn. Fitting what is currently visible would resize the type on every word.
 *
 * WHAT LIGHTS, PER LOCALE. zh lights only the BAND under the spoken word; the characters stay in
 * the unspoken colour. en lights the text as well. That is not a style split for its own sake:
 * Chinese characters carry their meaning in dense strokes, and recolouring them mid-line costs
 * legibility for a cue the band already gives. Latin words are simple enough shapes to survive it,
 * and in streaming mode the newest word needs to be findable the instant it appears.
 *
 * A WORD IS WHATEVER A ROW IS. whisper.cpp emits zh timings per CHARACTER, and highlighting per
 * character is wrong — 核心 is one word and lights as one. The component does not segment; it
 * highlights exactly the units it is given, so grouping happens upstream where the script's own
 * word boundaries are known. `tools/group-words.mjs` does it.
 */
export const spokenSubtitleSchema = z.object({
  locale: localeSchema,
  /** One line, as `text|startMs|endMs` per row — the Caption[] shape tools/transcribe.mjs writes. */
  words: zTextarea(),
  durationSec: z.number(),
  fontSize: z.number().optional(),
  /**
   * Light the spoken text as well as its band. Defaults per locale and should rarely be set:
   * zh lights ONLY the band, en lights both. See the note in the component header.
   */
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
const stripes = (size: number, line: string, ground: string): string => {
  const dash = Math.max(2, size * 0.055);
  return `repeating-linear-gradient(45deg, ${line} 0 ${dash}px, ${ground} ${dash}px ${dash * 2.6}px)`;
};

export const SpokenSubtitle: React.FC<SpokenSubtitleProps> = ({
  locale,
  words,
  fontSize,
  litText,
}) => {
  const frame = useCurrentFrame();
  const {width} = useVideoConfig();
  const ms = (frame / FPS) * 1000;
  const parsed = useMemo(() => parseWords(words), [words]);
  const karaoke = locale === 'zh-CN';
  // zh: band only. en: text too. An explicit prop still wins.
  const lightText = litText ?? !karaoke;
  const family = bodyFont(locale as Locale);
  const asked = (fontSize ?? 68) * localeScale(locale as Locale);
  const room = width - SAFE_ZONE.left - SAFE_ZONE.right;

  // the whole sentence, spaced as it will be drawn, so the fit holds for every frame
  const full = useMemo(
    () => parsed.map((w) => w.text).join(karaoke ? '' : ' '),
    [parsed, karaoke],
  );
  const size = useMemo(() => {
    if (!full) return asked;
    const {fontSize: fits} = fitText({
      text: full,
      withinWidth: room,
      fontFamily: family,
      fontWeight: '800',
    });
    return Math.min(asked, fits);
  }, [full, room, family, asked]);

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
          flexWrap: 'nowrap',
          whiteSpace: 'nowrap',
          justifyContent: 'center',
          maxWidth: room,
          fontFamily: family,
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
                zIndex: 0,
                // zh (lightText false) holds ONE text colour throughout — the band alone
                // carries the state. Recolouring spoken characters is still highlighting them,
                // and dense strokes lose legibility for a cue the band already gives.
                color: !lightText
                  ? spoken.text
                  : lit
                    ? spoken.litSoft
                    : done
                      ? spoken.textSpent
                      : spoken.text,
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
                  // the lit block is much taller and rises BEHIND the character; the unlit rule
                  // sits at the baseline. Both are bottom-aligned so the block grows upward.
                  height: size * (lit ? 0.40 : 0.26),
                  // behind the text, or a tall block hides the glyph it is marking
                  zIndex: -1,
                  // lit: flat fluorescent. otherwise: black crossed by grey dashes.
                  // BOTH states carry the stripes — the highlight is not a flat fill. Lit is the
                  // fluorescent ground under its own darker stripes; unlit is near-black under
                  // grey ones. A flat highlight next to a striped band reads as two unrelated
                  // objects rather than one rule lighting up.
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
