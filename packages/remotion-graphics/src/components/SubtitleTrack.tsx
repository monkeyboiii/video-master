import {parseSrt} from '@remotion/captions';
import {zTextarea} from '@remotion/zod-types';
import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {localeSchema, localeScale} from '../shared';
import {bodyFont} from '../theme/fonts';
import {SAFE_ZONE, bone, dirt, scrim} from '../theme/tokens';

export const subtitleTrackSchema = z.object({
  locale: localeSchema,
  srt: zTextarea(),
  emphasis: z.array(z.string()),
  durationSec: z.number(),
});

export type SubtitleTrackProps = z.infer<typeof subtitleTrackSchema>;

const escapeRegExp = (s: string): string =>
  s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Wrap emphasis matches in brand-orange spans (case-insensitive). */
const renderWithEmphasis = (
  text: string,
  emphasis: string[],
): React.ReactNode => {
  const terms = emphasis.map((t) => t.trim()).filter(Boolean);
  if (terms.length === 0) {
    return text;
  }
  const re = new RegExp(`(${terms.map(escapeRegExp).join('|')})`, 'gi');
  // A single capturing group means odd indexes are the matches.
  return text.split(re).map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} style={{color: dirt[500], fontWeight: 800}}>
        {part}
      </span>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    ),
  );
};

/** Timed subtitle cues at the safe-zone bottom; line-level timing from SRT. */
export const SubtitleTrack: React.FC<SubtitleTrackProps> = ({
  locale,
  srt,
  emphasis,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const scale = localeScale(locale);

  const captions = useMemo(() => {
    try {
      return parseSrt({input: srt}).captions;
    } catch (err) {
      console.error('Failed to parse SRT', err);
      return [];
    }
  }, [srt]);

  const tMs = (frame / fps) * 1000;
  const active = captions.find((c) => tMs >= c.startMs && tMs < c.endMs);
  if (!active) {
    return null;
  }

  const cueStartFrame = (active.startMs / 1000) * fps;
  const cueEndFrame = (active.endMs / 1000) * fps;
  const fadeIn = Math.min(1, Math.max(0, (frame - cueStartFrame) / 3));
  const fadeOut = Math.min(1, Math.max(0, (cueEndFrame - frame) / 3));
  const opacity = Math.min(fadeIn, fadeOut);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: SAFE_ZONE.left,
          right: SAFE_ZONE.right,
          bottom: SAFE_ZONE.bottom + 24,
          textAlign: 'center',
          opacity,
          transform: `translateY(${(1 - fadeIn) * 10}px)`,
        }}
      >
        <span
          style={{
            fontFamily: bodyFont(locale),
            fontWeight: 600,
            fontSize: 46 * scale,
            lineHeight: 1.5,
            color: bone[50],
            backgroundColor: scrim(0.82),
            padding: '8px 22px',
            borderRadius: 12,
            boxDecorationBreak: 'clone',
            WebkitBoxDecorationBreak: 'clone',
            whiteSpace: 'pre-wrap',
          }}
        >
          {renderWithEmphasis(active.text, emphasis)}
        </span>
      </div>
    </AbsoluteFill>
  );
};
