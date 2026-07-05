import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';
import type {Locale} from '../shared';

const load = (family: string, file: string, weight: string): void => {
  loadFont({
    family,
    url: staticFile(`fonts/${file}`),
    weight,
  }).catch((err: unknown) => {
    console.error(`Failed to load font ${family} from ${file}`, err);
  });
};

// Display: Bricolage Grotesque (variable 400-800)
load('Bricolage Grotesque', 'bricolage-grotesque-variable.woff2', '400 800');
// Body: Geist (variable)
load('Geist', 'geist-variable.woff2', '100 900');
// Labels / eyebrows: Geist Mono (variable)
load('Geist Mono', 'geist-mono-variable.woff2', '100 900');
// CJK: Noto Sans SC (static weights)
load('Noto Sans SC', 'noto-sans-sc-400.woff2', '400');
load('Noto Sans SC', 'noto-sans-sc-600.woff2', '600');
load('Noto Sans SC', 'noto-sans-sc-800.woff2', '800');

/** Display stack: Bricolage for en-US, Noto Sans SC (weight 800) for zh-CN. */
export const displayFont = (locale: Locale): string =>
  locale === 'zh-CN'
    ? `'Noto Sans SC', 'Bricolage Grotesque', sans-serif`
    : `'Bricolage Grotesque', 'Noto Sans SC', sans-serif`;

/** Body stack: Geist for en-US, Noto Sans SC for zh-CN. */
export const bodyFont = (locale: Locale): string =>
  locale === 'zh-CN'
    ? `'Noto Sans SC', 'Geist', sans-serif`
    : `'Geist', 'Noto Sans SC', sans-serif`;

/** Label/eyebrow stack: Geist Mono with Noto fallback for CJK glyphs. */
export const monoFont = (_locale: Locale): string =>
  `'Geist Mono', 'Noto Sans SC', monospace`;
