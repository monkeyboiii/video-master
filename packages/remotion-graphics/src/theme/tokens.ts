/**
 * DirtBikeX brand tokens for video.
 * Source: DirtBikeX web design system. The video system standardizes on the
 * web brand orange #ED6B00 (dirt-500), NOT the iOS tint #F3760B.
 */

export const dirt = {
  50: '#FFF6EA',
  300: '#FBAB3C',
  400: '#F88E14',
  500: '#ED6B00',
  600: '#CF5300',
  700: '#A23D04',
  900: '#5A240B',
} as const;

export const bone = {
  50: '#FAF8F4',
  300: '#CDC2AD',
  800: '#3D3833',
  900: '#25221F',
  950: '#16140F',
} as const;

export const track = {
  300: '#B7B3AD',
  500: '#6E6C69',
  700: '#3C3B3A',
} as const;

export const moto = {
  blue: '#2A5CFF',
  green: '#2FA84F',
  red: '#D23A2D',
  yellow: '#FACC15',
  purple: '#7C6CFF',
  pink: '#EF5DA8',
} as const;

/**
 * Canonical accent colors for the six production stages
 * (选题 topic · 封面 cover · 脚本 script · 拍摄 shoot · 剪辑 edit · 复盘 review).
 */
export const stageColors = [
  moto.blue,
  dirt[500],
  moto.green,
  moto.red,
  moto.purple,
  moto.pink,
] as const;

/** The logo X gradient — reserve for the sharpest accents. */
export const xGradient = ['#DF2100', '#FF3A08', '#FF4A16'] as const;

export const xGradientCss = `linear-gradient(135deg, ${xGradient[0]} 0%, ${xGradient[1]} 55%, ${xGradient[2]} 100%)`;

/**
 * Platform-safe zone for 1080x1920 vertical video (docs/platforms.md).
 * All text and critical content stays inside these insets.
 */
export const SAFE_ZONE = {
  top: 150,
  bottom: 430,
  left: 55,
  right: 145,
} as const;

/** Derive proportional safe-zone insets for other canvas sizes (e.g. 1080x1440). */
export const safeZoneFor = (
  width: number,
  height: number,
): {top: number; bottom: number; left: number; right: number} => ({
  top: Math.round(SAFE_ZONE.top * (height / 1920)),
  bottom: Math.round(SAFE_ZONE.bottom * (height / 1920)),
  left: Math.round(SAFE_ZONE.left * (width / 1080)),
  right: Math.round(SAFE_ZONE.right * (width / 1080)),
});

/**
 * Warm dark scrim (bone-950) for panels behind text — overlays must read on
 * top of unknown footage; use panels, not text-shadows.
 */
export const scrim = (alpha = 0.85): string => `rgba(22, 20, 15, ${alpha})`;

/**
 * Spoken-caption band. Sampled from the reference frames in the harness
 * (word-underline / phrase-highlight / end-of-sentence), not chosen:
 * the highlight reads #D6EC4B–#DCEE56 at the centre of a clean block and the
 * band base reads #060507 between the dashes.
 */
export const spoken = {
  band: '#06050A',      // the black rule under the line
  hatch: '#54545E',     // the grey slanted dashes across it
  lit: '#D8EE4A',       // fluorescent yellow-green: the word being spoken
  text: '#FFFFFF',      // unspoken text
  stroke: '#06050A',    // the outline that keeps white legible on any footage
} as const;
