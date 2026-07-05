import './theme/fonts';
import React from 'react';
import {Composition} from 'remotion';
import {ChecklistCard, checklistCardSchema} from './components/ChecklistCard';
import type {ChecklistCardProps} from './components/ChecklistCard';
import {Cover, coverSchema} from './components/Cover';
import {CtaCard, ctaCardSchema} from './components/CtaCard';
import type {CtaCardProps} from './components/CtaCard';
import {HookTitle, hookTitleSchema} from './components/HookTitle';
import type {HookTitleProps} from './components/HookTitle';
import {LowerThird, lowerThirdSchema} from './components/LowerThird';
import type {LowerThirdProps} from './components/LowerThird';
import {SafeZoneGuide} from './components/SafeZoneGuide';
import {SubtitleTrack, subtitleTrackSchema} from './components/SubtitleTrack';
import type {SubtitleTrackProps} from './components/SubtitleTrack';
import {FPS, overlayMetadata} from './shared';

const SAMPLE_SRT = `1
00:00:00,000 --> 00:00:02,400
Two fingers on the clutch, always.

2
00:00:02,400 --> 00:00:05,000
Smooth is fast. Fast is smooth.
`;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* ── Transparent overlays (ProRes 4444 defaults baked in) ── */}
      <Composition
        id="hook-title"
        component={HookTitle}
        schema={hookTitleSchema}
        width={1080}
        height={1920}
        fps={FPS}
        durationInFrames={Math.round(3.5 * FPS)}
        calculateMetadata={overlayMetadata<HookTitleProps>(3.5)}
        defaultProps={{
          locale: 'en-US' as const,
          kicker: 'DIRTBIKEX',
          title: 'Stop buying the wrong first bike',
          durationSec: 3.5,
        }}
      />
      <Composition
        id="checklist-card"
        component={ChecklistCard}
        schema={checklistCardSchema}
        width={1080}
        height={1920}
        fps={FPS}
        durationInFrames={8 * FPS}
        calculateMetadata={overlayMetadata<ChecklistCardProps>(8)}
        defaultProps={{
          locale: 'en-US' as const,
          title: 'Before every ride',
          items: ['Tire pressure', 'Chain slack', 'Brake lever feel'],
          durationSec: 8,
        }}
      />
      <Composition
        id="cta-card"
        component={CtaCard}
        schema={ctaCardSchema}
        width={1080}
        height={1920}
        fps={FPS}
        durationInFrames={4 * FPS}
        calculateMetadata={overlayMetadata<CtaCardProps>(4)}
        defaultProps={{
          locale: 'en-US' as const,
          action: 'save' as const,
          line: 'Save this for your next ride',
          handle: '@dirtbikex',
          durationSec: 4,
        }}
      />
      <Composition
        id="lower-third"
        component={LowerThird}
        schema={lowerThirdSchema}
        width={1080}
        height={1920}
        fps={FPS}
        durationInFrames={4 * FPS}
        calculateMetadata={overlayMetadata<LowerThirdProps>(4)}
        defaultProps={{
          locale: 'en-US' as const,
          name: 'Calvin',
          label: 'DirtBikeX Founder',
          durationSec: 4,
        }}
      />
      <Composition
        id="subtitle-track"
        component={SubtitleTrack}
        schema={subtitleTrackSchema}
        width={1080}
        height={1920}
        fps={FPS}
        durationInFrames={30 * FPS}
        calculateMetadata={overlayMetadata<SubtitleTrackProps>(30)}
        defaultProps={{
          locale: 'en-US' as const,
          srt: SAMPLE_SRT,
          emphasis: ['clutch'],
          durationSec: 30,
        }}
      />

      {/* ── Cover stills (opaque background allowed) ── */}
      <Composition
        id="cover-9x16"
        component={Cover}
        schema={coverSchema}
        width={1080}
        height={1920}
        fps={FPS}
        durationInFrames={30}
        defaultProps={{
          locale: 'en-US' as const,
          title: 'Your first dirt bike, done right',
          subtitle: 'Three checks before you pay',
          backgroundSrc: null,
        }}
      />
      <Composition
        id="cover-3x4"
        component={Cover}
        schema={coverSchema}
        width={1080}
        height={1440}
        fps={FPS}
        durationInFrames={30}
        defaultProps={{
          locale: 'en-US' as const,
          title: 'Your first dirt bike, done right',
          subtitle: 'Three checks before you pay',
          backgroundSrc: null,
        }}
      />

      {/* ── Debug (Studio preview only) ── */}
      <Composition
        id="safe-zone-guide"
        component={SafeZoneGuide}
        width={1080}
        height={1920}
        fps={FPS}
        durationInFrames={150}
      />
    </>
  );
};
