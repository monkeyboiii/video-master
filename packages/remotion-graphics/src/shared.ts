import type {CalculateMetadataFunction} from 'remotion';
import {interpolate} from 'remotion';
import {z} from 'zod';

export const FPS = 30;

export const localeSchema = z.enum(['en-US', 'zh-CN']);
export type Locale = z.infer<typeof localeSchema>;

/** zh-CN display type runs slightly smaller than Latin at the same layout. */
export const localeScale = (locale: Locale): number =>
  locale === 'zh-CN' ? 0.88 : 1;

/**
 * Bakes overlay render defaults into a composition via calculateMetadata:
 * transparent ProRes 4444 (yuva444p10le, PNG frame capture) so a bare
 * `npx remotion render <id> out.mov` produces the Kdenlive-ready alpha master.
 * Also derives durationInFrames from props.durationSec (fps 30).
 */
export const overlayMetadata =
  <T extends {durationSec?: number}>(
    fallbackSec: number,
  ): CalculateMetadataFunction<T> =>
  ({props}) => ({
    durationInFrames: Math.max(
      1,
      Math.round((props.durationSec ?? fallbackSec) * FPS),
    ),
    defaultCodec: 'prores',
    defaultVideoImageFormat: 'png',
    defaultPixelFormat: 'yuva444p10le',
    defaultProResProfile: '4444',
  });

/** Standard overlay exit: fade out over the last `frames` frames. */
export const exitFade = (
  frame: number,
  durationInFrames: number,
  frames = 12,
): number =>
  interpolate(frame, [durationInFrames - frames, durationInFrames - 1], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
