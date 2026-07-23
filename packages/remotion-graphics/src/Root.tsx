import './theme/fonts';
import React from 'react';
import {Composition} from 'remotion';
import {ChecklistCard, checklistCardSchema} from './components/ChecklistCard';
import type {ChecklistCardProps} from './components/ChecklistCard';
import {Cover, coverSchema} from './components/Cover';
import {CtaCard, ctaCardSchema} from './components/CtaCard';
import type {CtaCardProps} from './components/CtaCard';
import {BrandDrop, brandDropSchema} from './components/BrandDrop';
import {BrandForm, brandFormSchema} from './components/BrandForm';
import type {BrandFormProps} from './components/BrandForm';
import {MarkPop, markPopSchema} from './components/MarkPop';
import type {MarkPopProps} from './components/MarkPop';
import type {BrandDropProps} from './components/BrandDrop';
import {BrandTitle, brandTitleSchema} from './components/BrandTitle';
import type {BrandTitleProps} from './components/BrandTitle';
import {FeatureFan, featureFanSchema} from './components/FeatureFan';
import type {FeatureFanProps} from './components/FeatureFan';
import {FeaturePhones, featurePhonesSchema} from './components/FeaturePhones';
import type {FeaturePhonesProps} from './components/FeaturePhones';
import {HookTitle, hookTitleSchema} from './components/HookTitle';
import type {HookTitleProps} from './components/HookTitle';
import {InviteCard, inviteCardSchema} from './components/InviteCard';
import type {InviteCardProps} from './components/InviteCard';
import {KineticCaptions, kineticCaptionsSchema} from './components/KineticCaptions';
import type {KineticCaptionsProps} from './components/KineticCaptions';
import {PhotoReveal, photoRevealSchema} from './components/PhotoReveal';
import type {PhotoRevealProps} from './components/PhotoReveal';
import {ProfileCard, profileCardSchema} from './components/ProfileCard';
import type {ProfileCardProps} from './components/ProfileCard';
import {SideScreen, sideScreenSchema} from './components/SideScreen';
import type {SideScreenProps} from './components/SideScreen';
import {LowerThird, lowerThirdSchema} from './components/LowerThird';
import type {LowerThirdProps} from './components/LowerThird';
import {PhoneFeature, phoneFeatureSchema} from './components/PhoneFeature';
import type {PhoneFeatureProps} from './components/PhoneFeature';
import {SafeZoneGuide} from './components/SafeZoneGuide';
import {StageCards, stageCardsSchema} from './components/StageCards';
import type {StageCardsProps} from './components/StageCards';
import {SubtitleTrack, subtitleTrackSchema} from './components/SubtitleTrack';
import type {SubtitleTrackProps} from './components/SubtitleTrack';
import {FPS, overlayMetadata} from './shared';
import {stageColors} from './theme/tokens';

const STAGE_CARDS_DEFAULTS = {
  locale: 'zh-CN' as const,
  items: ['选题', '封面', '脚本', '拍摄', '剪辑', '复盘'],
  colors: [...stageColors],
  scatterDelaySec: 1.6,
  background: true,
  durationSec: 6,
};

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

      {/* ── E002 branded overlays (DirtBikeX logo, founder identity, invite) ── */}
      <Composition
        id="brand-title"
        component={BrandTitle}
        schema={brandTitleSchema}
        width={1080}
        height={1920}
        fps={FPS}
        durationInFrames={Math.round(2 * FPS)}
        calculateMetadata={overlayMetadata<BrandTitleProps>(2)}
        defaultProps={{
          durationSec: 2,
          tagline: 'built by a rider',
          // no bgSrc in Studio: the baked backdrop is opted into per-episode via props
          bgTrimSec: 0,
          bgBlurPx: 8,
          bgDim: 0.14,
        }}
      />
      <Composition
        id="brand-drop"
        component={BrandDrop}
        schema={brandDropSchema}
        width={1080}
        height={1920}
        fps={FPS}
        durationInFrames={Math.round(5 * FPS)}
        calculateMetadata={overlayMetadata<BrandDropProps>(5)}
        defaultProps={{
          durationSec: 5.0,
          lockupSrc: 'brand/logo-lockup.svg',
          markSrc: 'brand/logo-mark.svg',
          lockupWidth: 620,
          iconSize: 128,
          restX: 540,
          restY: 330,
          cornerTop: 84,
          dropSec: 0.55,
          holdSec: 1.2,
          flySec: 0.8,
          iconHoldSec: 1.8,
          fadeSec: 0.65,
        }}
      />
      <Composition
        id="feature-fan"
        component={FeatureFan}
        schema={featureFanSchema}
        width={1080}
        height={1920}
        fps={FPS}
        durationInFrames={Math.round(4 * FPS)}
        calculateMetadata={overlayMetadata<FeatureFanProps>(4)}
        defaultProps={{
          durationSec: 4,
          riseSec: 0.45,
          risePx: 70,
          items: [
            {
              src: 'e005/f1_flair.png',
              x: 120, y: 300, w: 260, h: 260, atSec: 0,
              label: 'Custom flair', labelSize: 24, plate: true, plateColor: '#FFFFFF',
              platePad: 34, freezeSrc: '', videoSec: 0,
            },
          ],
        }}
      />
      <Composition
        id="profile-card"
        component={ProfileCard}
        schema={profileCardSchema}
        width={1080}
        height={1920}
        fps={FPS}
        durationInFrames={Math.round(3 * FPS)}
        calculateMetadata={overlayMetadata<ProfileCardProps>(3)}
        defaultProps={{
          durationSec: 3,
          src: 'e002/rubio-profile.jpg',
          handle: '@rubio',
          bottomInset: 190,
        }}
      />
      <Composition
        id="invite-card"
        component={InviteCard}
        schema={inviteCardSchema}
        width={1080}
        height={1920}
        fps={FPS}
        durationInFrames={Math.round(4 * FPS)}
        calculateMetadata={overlayMetadata<InviteCardProps>(4)}
        defaultProps={{
          durationSec: 4,
          src: 'e002/invite-card.png',
          patchLabel: 'New riders welcome',
          width: 470,
          yPct: 42,
        }}
      />
      <Composition
        id="side-screen"
        component={SideScreen}
        schema={sideScreenSchema}
        width={1080}
        height={1920}
        fps={FPS}
        durationInFrames={Math.round(6 * FPS)}
        calculateMetadata={overlayMetadata<SideScreenProps>(6)}
        defaultProps={{
          durationSec: 6,
          src: 'e003/flair_cut.mp4',
          x: 24,
          y: 96,
          w: 391,
          h: 852,
          markers: [],
          label: '',
          labelSize: 27,
        }}
      />
      <Composition
        id="photo-reveal"
        component={PhotoReveal}
        schema={photoRevealSchema}
        width={1080}
        height={1920}
        fps={FPS}
        durationInFrames={Math.round(4.2 * FPS)}
        calculateMetadata={overlayMetadata<PhotoRevealProps>(4.2)}
        defaultProps={{
          durationSec: 4.2,
          src: 'e002/first-ride.jpg',
          startScale: 1.32,
          objectPositionX: 62,
          objectPositionY: 92,
          endScale: 1.0,
          bandFrac: 0.2,
          blurPx: 40,
          bandDim: 0.22,
        }}
      />
      <Composition
        id="feature-phones"
        component={FeaturePhones}
        schema={featurePhonesSchema}
        width={1080}
        height={1920}
        fps={FPS}
        durationInFrames={Math.round(6 * FPS)}
        calculateMetadata={overlayMetadata<FeaturePhonesProps>(6)}
        defaultProps={{
          durationSec: 6,
          phones: [
            {
              label: '21 languages',
              segments: [
                {src: 'lang-pick.mp4', trimSec: 0, seconds: 2.5},
                {src: 'lang-refresh.mp4', trimSec: 0, seconds: 2.5},
                {src: 'lang-refresh-freeze.png', trimSec: 0, seconds: 1.0},
              ],
            },
            {
              label: 'Post once',
              segments: [
                {src: 'embed.mp4', trimSec: 0, seconds: 3.5},
                {src: 'embed-freeze.png', trimSec: 0, seconds: 2.5},
              ],
            },
          ],
        }}
      />
      <Composition
        id="kinetic-captions"
        component={KineticCaptions}
        schema={kineticCaptionsSchema}
        width={1080}
        height={1920}
        fps={FPS}
        durationInFrames={Math.round(8 * FPS)}
        calculateMetadata={overlayMetadata<KineticCaptionsProps>(8)}
        defaultProps={{
          durationSec: 8,
          fontScale: 1,
          window: 12,
          words: [
            {t: 'Nobody', s: 0.0, e: 'harsh'},
            {t: 'tells', s: 0.4},
            {t: 'you', s: 0.62},
            {t: 'this', s: 0.85},
            {t: 'when', s: 1.15},
            {t: 'you', s: 1.35},
            {t: 'first', s: 1.6},
            {t: 'start', s: 1.9},
            {t: 'dirt', s: 2.2},
            {t: 'biking.', s: 2.5},
            {t: 'The', s: 3.1},
            {t: 'hard', s: 3.35},
            {t: 'part', s: 3.6},
            {t: 'is', s: 3.85},
            {t: 'finding', s: 4.1},
            {t: 'somebody', s: 4.45},
            {t: 'who', s: 4.8},
            {t: 'gets', s: 5.05, e: 'brand'},
            {t: 'it.', s: 5.35, e: 'brand'},
          ],
        }}
      />

      <Composition
        id="stage-cards"
        component={StageCards}
        schema={stageCardsSchema}
        width={1080}
        height={1920}
        fps={FPS}
        durationInFrames={6 * FPS}
        calculateMetadata={overlayMetadata<StageCardsProps>(6)}
        defaultProps={STAGE_CARDS_DEFAULTS}
      />
      <Composition
        id="stage-cards-wide"
        component={StageCards}
        schema={stageCardsSchema}
        width={1920}
        height={1080}
        fps={FPS}
        durationInFrames={6 * FPS}
        calculateMetadata={overlayMetadata<StageCardsProps>(6)}
        defaultProps={STAGE_CARDS_DEFAULTS}
      />

      {/* ── Phone-overlay feature clips (transparent; composite over founder) ── */}
      <Composition
        id="phone-language"
        component={PhoneFeature}
        schema={phoneFeatureSchema}
        width={1080}
        height={1920}
        fps={FPS}
        durationInFrames={Math.round(6.5 * FPS)}
        calculateMetadata={overlayMetadata<PhoneFeatureProps>(6.5)}
        defaultProps={{
          locale: 'en-US' as const,
          segments: [
            {src: 'lang-full.mp4', trimSec: 4.0, seconds: 2.6}, // language picker (20+ langs)
            {src: 'lang-full.mp4', trimSec: 17.0, seconds: 2.4}, // localized feed + pull-to-refresh
            {src: 'lang-refresh-freeze.png', trimSec: 0, seconds: 1.5}, // freeze: refreshed, fully localized
          ],
          stampTop: 'Speaks your',
          stampBottom: 'Language',
          durationSec: 6.5,
        }}
      />
      <Composition
        id="phone-embed"
        component={PhoneFeature}
        schema={phoneFeatureSchema}
        width={1080}
        height={1920}
        fps={FPS}
        durationInFrames={Math.round(3.0 * FPS)}
        calculateMetadata={overlayMetadata<PhoneFeatureProps>(3.0)}
        defaultProps={{
          locale: 'en-US' as const,
          segments: [{src: 'embed.mp4', trimSec: 0, seconds: 3.0}],
          stampTop: 'Drop',
          stampBottom: 'One link',
          durationSec: 3.0,
        }}
      />
      <Composition
        id="phone-sponsor"
        component={PhoneFeature}
        schema={phoneFeatureSchema}
        width={1080}
        height={1920}
        fps={FPS}
        durationInFrames={Math.round(3.7 * FPS)}
        calculateMetadata={overlayMetadata<PhoneFeatureProps>(3.7)}
        defaultProps={{
          locale: 'en-US' as const,
          segments: [{src: 'sponsor.mp4', trimSec: 0, seconds: 3.7}],
          stampTop: 'Get',
          stampBottom: 'Sponsored',
          durationSec: 3.7,
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
      <Composition
        id="brand-form"
        component={BrandForm}
        schema={brandFormSchema}
        width={1080}
        height={1920}
        fps={FPS}
        durationInFrames={Math.round(4.28 * FPS)}
        calculateMetadata={overlayMetadata<BrandFormProps>(4.28)}
        defaultProps={{
          durationSec: 4.28,
          markSrc: 'e202/orange-X.svg',
          logoSrc: 'e202/DirtBikeX.svg',
          corners: [
            {x: 200, y: 430, atSec: 0.0},
            {x: 880, y: 430, atSec: 0.68},
            {x: 200, y: 1490, atSec: 1.48},
            {x: 880, y: 1490, atSec: 2.05},
          ],
          markWidth: 240,
          centerX: 540,
          centerY: 980,
          convergeSec: 2.93,
          formSec: 3.38,
          expandSec: 3.68,
          logoWidthSmall: 360,
          logoWidthLarge: 760,
          finalCenterX: 540,
          finalCenterY: 980,
          sparkCount: 14,
        }}
      />
      <Composition
        id="mark-pop"
        component={MarkPop}
        schema={markPopSchema}
        width={1080}
        height={1920}
        fps={FPS}
        durationInFrames={Math.round(1.5 * FPS)}
        calculateMetadata={overlayMetadata<MarkPopProps>(1.5)}
        defaultProps={{
          durationSec: 1.5,
          src: 'e202/orange-X.svg',
          x: 540,
          y: 960,
          width: 240,
          aspect: 377 / 344,
          popSec: 0.45,
          fromScale: 0.55,
          shadow: true,
        }}
      />
    </>
  );
};
