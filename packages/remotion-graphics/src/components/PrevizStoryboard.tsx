/**
 * PrevizStoryboard — a cuttable placeholder edit built from an episode's storyboard.
 *
 * WHAT IT IS FOR. The footage does not exist yet. This renders every cut at its real length,
 * with its real camera move and its real overlay motion, so the rhythm can be judged and the
 * edit can be laid out against something before a single frame is shot. It is a placeholder on
 * purpose: nothing here pretends to be the picture.
 *
 * WHERE THE NUMBERS COME FROM. `tools/previz-props.mjs`, which takes cut timing from
 * `tools/storyboard-check.mjs`'s `timeline()` — a cut's length is its `share` of its beat, and a
 * beat's length lives only in manifest.yml. Nothing is recomputed here, so the previz cannot
 * disagree with the checker about where a cut falls.
 *
 * SFX ARE DRAWN, NOT PLAYED. The storyboard's sfx names are cues for the edit; this marks them
 * on screen so the cut points are visible, and loads no audio.
 */
import React from 'react';
import {
  AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig, random,
} from 'remotion';
import {z} from 'zod';
import {FPS, localeSchema, type Locale} from '../shared';
import {bone, dirt, moto, track as trackColor} from '../theme/tokens';
import {SpokenSubtitleTrack} from './SpokenSubtitleTrack';
import {PhotoRevealFrame} from './PhotoReveal';

export const previzCutSchema = z.object({
  beat: z.string(),
  atSec: z.number(),
  durSec: z.number(),
  shot: z.string(),
  camera: z.string(),
  bg: z.string(),
  motion: z.string(),
  sfx: z.string().optional(),
  subject: z.string().optional(),
  text: z.string().optional(),
  // A published image under public/. When present the cut renders the photo-reveal look — sharp
  // band, blurred top and bottom — instead of a generated field. storyboard-check verifies it
  // exists, because Remotion renders a missing src as an empty box and reports nothing.
  src: z.string().optional(),
});

export const previzStoryboardSchema = z.object({
  locale: localeSchema,
  durationSec: z.number(),
  cuts: z.array(previzCutSchema),
  script: z.string(),
  // Passed through to the caption track. See tools/previz-props.mjs for why an episode declares it.
  captionStyle: z.enum(['band', 'plain']).optional(),
});
export type PrevizStoryboardProps = z.infer<typeof previzStoryboardSchema>;

/**
 * Each background is a two-stop field plus a moving light — enough to read as a place.
 *
 * `dark` is not decoration. Two of these fields are LIGHT (sky, mall), and the first version
 * hardcoded pale ink and a white glow for every one of them: on the sky beat the slate was grey
 * on light blue and the 希望别摔 title ghosted into its own white halo — both unreadable in the
 * render, and neither visible in any exit code. A previz nobody can read is not a previz.
 */
const BG: Record<string, {from: string; to: string; light: string; dark: boolean}> = {
  dirt:    {from: '#3A2415', to: '#120B06', light: dirt[500],       dark: true},
  night:   {from: '#0B1030', to: '#05060F', light: moto.blue,       dark: true},
  sky:     {from: '#1E5F9E', to: '#8FC7EE', light: '#FFFFFF',       dark: false},
  asphalt: {from: '#2A2A2E', to: '#0E0E10', light: moto.yellow,     dark: true},
  crowd:   {from: '#2B1830', to: '#0C0710', light: moto.pink,       dark: true},
  grade:   {from: '#20211C', to: '#0A0B08', light: trackColor[300], dark: true},
  neutral: {from: bone[900], to: bone[950], light: bone[300],       dark: true},
  mall:    {from: '#B9BCC2', to: '#E6E8EC', light: '#FFFFFF',       dark: false},
};

/**
 * A camera move is a transform on the whole frame; `t` is 0..1 across the cut.
 *
 * There is no `whip` and no `whip-cut`/`fade-through` motion: the piece cuts straight, so a
 * transition between two shots is not in the vocabulary storyboard-check accepts. The branches
 * were removed rather than left unreachable.
 */
const cameraTransform = (camera: string, t: number, frame: number): string => {
  const jitter = (seed: string, amp: number) =>
    (random(seed + Math.floor(frame / 2)) - 0.5) * amp;
  switch (camera) {
    case 'push':      return `scale(${1.04 + t * 0.10})`;
    case 'pull':      return `scale(${1.18 - t * 0.12})`;
    // A snap zoom is nearly all of its travel in the first fifth, then it sits.
    case 'snap-zoom': return `scale(${interpolate(t, [0, 0.18, 1], [1.0, 1.22, 1.26], {extrapolateRight: 'clamp'})})`;
    case 'pan-l':     return `scale(1.14) translateX(${interpolate(t, [0, 1], [4, -4])}%)`;
    case 'pan-r':     return `scale(1.14) translateX(${interpolate(t, [0, 1], [-4, 4])}%)`;
    case 'tilt-up':   return `scale(1.14) translateY(${interpolate(t, [0, 1], [4, -4])}%)`;
    case 'tilt-down': return `scale(1.14) translateY(${interpolate(t, [0, 1], [-4, 4])}%)`;
    case 'handheld':  return `scale(1.08) translate(${jitter('x', 1.6)}%, ${jitter('y', 1.6)}%) rotate(${jitter('r', 0.7)}deg)`;
    case 'orbit':     return `scale(1.16) translateX(${Math.sin(t * Math.PI) * 5}%) rotate(${Math.sin(t * Math.PI) * 1.6}deg)`;
    case 'ramp':      return `scale(${1.02 + Math.pow(t, 2.2) * 0.20})`;
    case 'freeze':    return 'scale(1.12)';
    default:          return 'scale(1.02)';
  }
};

/** An overlay motion drives the slate card: opacity, transform and any flash. */
const motionStyle = (motion: string, frame: number, dur: number, fps: number): React.CSSProperties => {
  const t = dur <= 1 ? 1 : frame / (dur - 1);
  const s = spring({frame, fps, config: {damping: 14, stiffness: 190, mass: 0.5}});
  const out = interpolate(frame, [dur - 5, dur - 1], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  switch (motion) {
    case 'punch-in':     return {opacity: out * interpolate(frame, [0, 6], [0, 1], {extrapolateRight: 'clamp'}), transform: `scale(${0.94 + s * 0.06})`};
    case 'zoom-punch':   return {opacity: out, transform: `scale(${interpolate(frame, [0, 3, 7], [1.5, 0.97, 1], {extrapolateRight: 'clamp'})})`};
    case 'slide-up':     return {opacity: out, transform: `translateY(${(1 - s) * 90}px)`};
    case 'drop-in':      return {opacity: out, transform: `translateY(${(1 - s) * -110}px) rotate(${(1 - s) * -3}deg)`};
    case 'pop':          return {opacity: out, transform: `scale(${0.7 + s * 0.3})`};
    case 'rise':         return {opacity: out * interpolate(t, [0, 0.3], [0, 1], {extrapolateRight: 'clamp'}), transform: `translateY(${(1 - t) * 40}px) scale(${0.98 + t * 0.02})`};
    case 'freeze-flash': return {opacity: out, transform: `scale(${interpolate(frame, [0, 2, 5], [1.1, 1.02, 1], {extrapolateRight: 'clamp'})})`};
    case 'text-pop':     return {opacity: out, transform: `scale(${0.86 + s * 0.14})`};
    case 'shake':        return {opacity: out, transform: `translate(${(random('sx' + frame) - 0.5) * 14}px, ${(random('sy' + frame) - 0.5) * 14}px)`};
    case 'glitch':       return {opacity: out * (random('g' + Math.floor(frame / 2)) > 0.15 ? 1 : 0.35), transform: `translateX(${(random('gx' + Math.floor(frame / 3)) - 0.5) * 18}px)`};
    default:             return {opacity: out};
  }
};

const Cut: React.FC<{cut: PrevizStoryboardProps['cuts'][number]; index: number}> = ({cut, index}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const dur = Math.max(1, Math.round(cut.durSec * fps));
  const t = dur <= 1 ? 0 : frame / (dur - 1);
  const bg = BG[cut.bg] ?? BG.neutral;
  // Ink follows the field, not the component. See BG above.
  const ink = bg.dark ? bone[50] : bone[950];
  const inkDim = bg.dark ? bone[300] : '#4A453F';
  const shadow = bg.dark ? '0 2px 12px #000A' : '0 1px 8px #FFFFFFAA';

  // A white flash on the first two frames of a freeze — the beat the edit will actually cut on.
  const flash = cut.motion === 'freeze-flash' ? interpolate(frame, [0, 3], [0.85, 0], {extrapolateRight: 'clamp'}) : 0;

  // A cut carrying a published image is a PANEL: the S01E002 photo-reveal look, sharp in the
  // middle with a blurred copy of itself top and bottom. The zoom is deliberately small — 7%, and
  // alternating direction by cut so a run of panels does not pulse in unison — because the subject
  // here is a technical diagram the viewer is reading, and photo-reveal's own 32% zoom-out drags
  // the lines around while they are trying to follow an arrow.
  if (cut.src) {
    // The storyboard's own `camera` drives it, so the direction is an editorial choice in the
    // file rather than a function of the cut's index: push = in, pull = out, static = hold.
    // Anything else alternates, so a run of panels does not pulse in unison.
    const Z = 0.07;
    const range: [number, number] =
      cut.camera === 'push' ? [1, 1 + Z] :
      cut.camera === 'pull' ? [1 + Z, 1] :
      cut.camera === 'static' ? [1, 1] :
      index % 2 === 1 ? [1, 1 + Z] : [1 + Z, 1];
    const s = interpolate(t, [0, 1], range, {extrapolateRight: 'clamp'});
    const op =
      interpolate(frame, [0, 4], [0, 1], {extrapolateRight: 'clamp'}) *
      interpolate(frame, [dur - 4, dur - 1], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    return (
      <AbsoluteFill style={{backgroundColor: '#0A0A0C'}}>
        {/*
          * `contain`, not `cover`: at a 1.24:1 panel in the default band, cover crops a quarter of
          * the width — on a technical diagram that is arrows, not margin.
          *
          * The bands are asymmetric and the bottom one is deep, because the CAPTIONS live in it.
          * A caption is bottom-anchored at safeZoneFor().bottom, which puts its top around 71% of
          * the frame; a 20% bottom band ends at 80% and the line lands on the picture. 0.30 ends
          * the sharp box at 70%, above the caption, so the type sits on blur instead of on the
          * drawing.
          *
          * bandDim 0.55, not photo-reveal's 0.22, and that is about THIS art: a blurred copy of
          * WHITE line work is light grey, so the default dimming leaves white type on a near-white
          * ground. 0.55 takes the bands to about 45% brightness, which is what lets the title and
          * the captions read without changing the shared caption palette.
          */}
        <PhotoRevealFrame src={cut.src} scale={s} opacity={op}
          objectPositionX={50} objectPositionY={50} bandFrac={0.2}
          bandTopFrac={0.22} bandBottomFrac={0.30} fit="contain"
          blurPx={40} bandDim={0.55} />
        {/* Screen text goes in the TOP blurred band, not over the diagram. That band exists
            precisely so there is somewhere to put type without covering the picture, and on this
            episode the picture is the thing being explained. */}
        {cut.text ? (
          <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: '20%',
                       display: 'flex', alignItems: 'center', justifyContent: 'center',
                       padding: `0 ${width * 0.07}px`, opacity: op}}>
            <div style={{color: '#fff', fontWeight: 900, fontSize: width * 0.052, textAlign: 'center',
                         lineHeight: 1.15, textShadow: '0 2px 18px #000C'}}>{cut.text}</div>
          </div>
        ) : null}
        <div style={{position: 'absolute', left: width * 0.05, bottom: height * 0.035, opacity: 0.8 * op,
                     color: bone[300], fontSize: width * 0.024, fontWeight: 600}}>
          #{index + 1} · {cut.beat} · {String(cut.shot)} {String(cut.camera)} · {cut.atSec.toFixed(2)}s
        </div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{overflow: 'hidden', backgroundColor: bg.to}}>
      <AbsoluteFill style={{transform: cameraTransform(cut.camera, t, frame), transformOrigin: '50% 45%'}}>
        <AbsoluteFill style={{background: `linear-gradient(${150 + index * 7}deg, ${bg.from} 0%, ${bg.to} 78%)`}} />
        {/* the moving light — what stops a flat gradient reading as a dead frame */}
        <AbsoluteFill
          style={{
            background: `radial-gradient(60% 42% at ${28 + Math.sin(t * Math.PI * 1.2 + index) * 26}% ${34 + Math.cos(t * Math.PI + index) * 14}%, ${bg.light}44 0%, transparent 62%)`,
            mixBlendMode: 'screen',
          }}
        />
        {/* horizon rule: a placeholder needs a sense of ground or every shot reads the same */}
        <AbsoluteFill style={{opacity: 0.5}}>
          <div style={{position: 'absolute', left: 0, right: 0, top: `${58 + Math.sin(index) * 6}%`, height: 2, background: `linear-gradient(90deg, transparent, ${bg.light}77, transparent)`}} />
        </AbsoluteFill>
        {/* grain, seeded per frame so it moves */}
        <AbsoluteFill style={{opacity: 0.07, backgroundImage: `repeating-conic-gradient(#fff 0% 25%, #000 0% 50%)`, backgroundSize: `${3 + (index % 3)}px ${3 + (index % 3)}px`, transform: `translate(${random('gr' + frame) * 3}px, ${random('gr2' + frame) * 3}px)`}} />
      </AbsoluteFill>

      {flash > 0 && <AbsoluteFill style={{background: '#fff', opacity: flash}} />}

      {/* the slate — this is a placeholder, and it says so plainly */}
      <AbsoluteFill style={{padding: width * 0.07, justifyContent: 'flex-start', ...motionStyle(cut.motion, frame, dur, fps)}}>
        <div style={{display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap'}}>
          <span style={{background: dirt[500], color: '#fff', fontWeight: 800, fontSize: width * 0.052, padding: '4px 14px', borderRadius: 6, letterSpacing: 1}}>{cut.shot}</span>
          <span style={{background: bg.dark ? '#ffffff18' : '#00000012', color: ink, fontWeight: 600, fontSize: width * 0.034, padding: '5px 12px', borderRadius: 6, border: `1px solid ${inkDim}55`}}>{cut.camera}</span>
          <span style={{background: bg.dark ? '#ffffff10' : '#0000000D', color: inkDim, fontWeight: 600, fontSize: width * 0.029, padding: '5px 12px', borderRadius: 6}}>{cut.motion}</span>
        </div>
        <div style={{marginTop: 14, color: ink, fontSize: width * 0.040, fontWeight: 700, lineHeight: 1.25, textShadow: shadow, maxWidth: '86%'}}>
          {cut.subject ?? ''}
        </div>
        <div style={{marginTop: 8, color: inkDim, fontSize: width * 0.026, fontWeight: 500, opacity: 0.95}}>
          #{index + 1}/{' '}{cut.beat} · {cut.atSec.toFixed(2)}s +{cut.durSec.toFixed(2)}s
        </div>
      </AbsoluteFill>

      {/* an on-screen title the storyboard asked for, in the middle third where it will really sit */}
      {cut.text ? (
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', ...motionStyle(cut.motion === 'none' ? 'text-pop' : cut.motion, frame, dur, fps)}}>
          <div style={{
            color: bg.dark ? '#fff' : bone[950],
            fontWeight: 900, fontSize: width * 0.15, letterSpacing: 2,
            textShadow: bg.dark ? `0 0 40px ${bg.light}, 0 6px 24px #000C` : '0 4px 18px #FFFFFFCC',
            WebkitTextStroke: `${Math.max(2, width * 0.004)}px ${bg.dark ? '#0008' : '#FFFFFFAA'}`,
            paintOrder: 'stroke fill',
          }}>
            {cut.text}
          </div>
        </AbsoluteFill>
      ) : null}

      {/* the sfx cue, marked where the edit should place it */}
      {cut.sfx && cut.sfx !== 'none' ? (
        <div style={{position: 'absolute', right: width * 0.06, bottom: height * 0.30, display: 'flex', alignItems: 'center', gap: 8,
                     opacity: interpolate(frame, [0, 2, 9, 14], [0, 1, 1, 0.45], {extrapolateRight: 'clamp'})}}>
          <div style={{width: width * 0.022, height: width * 0.022, borderRadius: '50%', background: moto.yellow, boxShadow: `0 0 ${width * 0.04}px ${moto.yellow}`}} />
          <span style={{color: moto.yellow, fontWeight: 800, fontSize: width * 0.028, letterSpacing: 1}}>{cut.sfx}</span>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const PrevizStoryboard: React.FC<PrevizStoryboardProps> = ({locale, durationSec, cuts, script, captionStyle}) => {
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: bone[950], fontFamily: 'Inter, "Noto Sans SC", system-ui, sans-serif'}}>
      {cuts.map((c, i) => (
        <Sequence key={`${c.beat}-${i}`} from={Math.round(c.atSec * fps)} durationInFrames={Math.max(1, Math.round(c.durSec * fps))}>
          <Cut cut={c} index={i} />
        </Sequence>
      ))}
      {/* the real caption track, over the placeholder picture — the point is to cut against both */}
      {script ? <SpokenSubtitleTrack locale={locale as Locale} script={script} durationSec={durationSec}
        {...(captionStyle ? {captionStyle} : {})} /> : null}
    </AbsoluteFill>
  );
};
