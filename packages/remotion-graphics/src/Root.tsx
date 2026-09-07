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
import {
  SpokenSubtitle,
  spokenSubtitleSchema,
  type SpokenSubtitleProps,
} from './components/SpokenSubtitle';
import {
  SpokenSubtitleTrack,
  spokenSubtitleTrackSchema,
  type SpokenSubtitleTrackProps,
} from './components/SpokenSubtitleTrack';
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
      {/* The per-episode caption build source. An episode's remotion-props/spoken-captions.<locale>.json
          is passed with --props; nothing about a specific episode is baked in here. */}
      <Composition
        id="spoken-subtitle-track"
        component={SpokenSubtitleTrack}
        schema={spokenSubtitleTrackSchema}
        width={1080}
        height={1920}
        fps={FPS}
        durationInFrames={Math.round(30 * FPS)}
        calculateMetadata={overlayMetadata<SpokenSubtitleTrackProps>(30)}
        defaultProps={{
          locale: 'en-US' as const,
          durationSec: 30,
          script: 'pass|0|600\nthe|600|1200\nepisode|1200|1800|*\nprops|1800|2400',
        }}
      />
      <Composition
        id="burst-intro-captions-zh"
        component={SpokenSubtitleTrack}
        schema={spokenSubtitleTrackSchema}
        width={1920}
        height={1080}
        fps={FPS}
        durationInFrames={1155}
        calculateMetadata={overlayMetadata<SpokenSubtitleTrackProps>(38.5)}
        defaultProps={{
          locale: 'zh-CN' as const,
          durationSec: 38.5,
          fontSize: 62,
          script: '你|667|817\n这台|817|1092\n机器|1092|1592\n是|1592|1692\n可突发|1692|2167\n的|2167|2867|*\n\n4个|4125|4350\n核心|4350|4825|*\n基线|4825|5200\n只给|5200|5475\n12.5%|5475|7150|*\n\n基线|8600|8950\n以下|8950|9250\n你|9250|9350\n在|9350|9475\n攒|9475|9675|*\n额度|9675|10050\n超过|10050|10425\n就是|10425|10675\n在|10675|10800\n花|10800|11650|*\n\n多数|13575|13975\n时候|13975|14400\n它|14400|14550\n安静地|14550|14925\n待在|14925|15275\n线|15275|15425\n的|15425|15500\n下面|15500|16600|*\n\n渲染|18625|18950\n一开始|18950|19550\n占用|19550|19875\n直接|19875|20150\n冲到顶|20150|20675|*\n这时候|20675|21325\n你|21325|21450\n在|21450|21575\n花|21575|21750|*\n额度|21750|22775\n\n只算|25100|25400\n屏幕上|25400|25975\n看得见|25975|26400|*\n的|26400|26475\n那段|26475|26975\n平移|26975|27275\n视图|27275|27625\n数字|27625|27950\n跟着走|27950|29050|*\n\n颗粒|31075|31325\n平移|31325|31650\n宽度|31650|32075\n全都是|32075|32700\n实时|32700|33025|*\n的|33025|33800\n\n7天|35600|35900\n的|35900|36000\n证据|36000|36425|*\n不是|36425|36675\n猜测|36675|37825',
        }}
      />
      <Composition
        id="burst-intro-captions-en"
        component={SpokenSubtitleTrack}
        schema={spokenSubtitleTrackSchema}
        width={1920}
        height={1080}
        fps={FPS}
        durationInFrames={1155}
        calculateMetadata={overlayMetadata<SpokenSubtitleTrackProps>(38.5)}
        defaultProps={{
          locale: 'en-US' as const,
          durationSec: 38.5,
          fontSize: 56,
          script: 'your|592|717\nbox|717|1029\nis|1029|1179\nburstable|1179|1767|*\nnot|1842|2004\nthe|2004|2092\nsame|2092|2329\nas|2329|2479\nfast|2479|3117\n\n4|4050|4300\nOCPUs|4300|5012\non|5012|5150\npaper|5150|5700\nbaseline|5825|6350\n12.5%|6350|7925|*\n\nbelow|8500|8775\nthat|8775|9000\nline|9000|9350\nyou|9350|9475\nare|9475|9625\nearning|9625|9950|*\nallowance|9950|10675\nabove|10812|11175\nit|11175|11325\nyou|11325|11475\nare|11475|11575\nspending|11575|12050|*\nit|12050|12450\n\nmost|13525|13738\nof|13738|13812\nthe|13812|13900\ntime|13900|14225\nthis|14225|14438\nbox|14438|14800\nsits|14800|15050\nquietly|15050|15562\nunder|15562|15738|*\nthe|15738|15850\nline|15850|16425\nbanking|16538|16950\ncredit|16950|17600\n\nthen|18500|18612\na|18612|18700\nrender|18700|19100\nstarts|19100|19700\nevery|19800|20100\ncore|20100|20375\ngoes|20375|20650\nto|20650|20738\nthe|20738|20862\nceiling|20862|21325|*\nand|21375|21500\nnow|21500|21800\nyou|21800|21950\nare|21950|22050\nspending|22050|22875|*\n\nit|25025|25125\ncounts|25125|25450\nonly|25450|25750\nthe|25750|25875\nwindow|25875|26200\non|26200|26412\nscreen|26412|27100|*\nso|27238|27438\npan|27438|27725\naway|27725|28150\nand|28150|28262\nthe|28262|28350\nnumbers|28350|28762\nfollow|28762|29500|*\n\ngrain|31025|31350\npan|31400|31675\nwidth|31725|32150\nall|32250|32412\nof|32412|32488\nit|32488|32625\nlive|32625|32838|*\nwhile|32838|32975\nyou|32975|33125\nwatch|33125|33750\n\n7|35550|35875|*\ndays|35875|36212|*\nof|36212|36338\nevidence|36338|36962|*\ninstead|36962|37288\nof|37288|37362\na|37362|37450\nguess|37450|38125',
        }}
      />
      <Composition
        id="burst-intro-captions-en-plain"
        component={SpokenSubtitleTrack}
        schema={spokenSubtitleTrackSchema}
        width={1920}
        height={1080}
        fps={FPS}
        durationInFrames={1155}
        calculateMetadata={overlayMetadata<SpokenSubtitleTrackProps>(38.5)}
        defaultProps={{
          locale: 'en-US' as const,
          durationSec: 38.5,
          fontSize: 56,
          captionStyle: 'plain' as const,
          script: 'your|592|717\nbox|717|1029\nis|1029|1179\nburstable|1179|1767|*\nnot|1842|2004\nthe|2004|2092\nsame|2092|2329\nas|2329|2479\nfast|2479|3117\n\n4|4050|4300\nOCPUs|4300|5012\non|5012|5150\npaper|5150|5700\nbaseline|5825|6350\n12.5%|6350|7925|*\n\nbelow|8500|8775\nthat|8775|9000\nline|9000|9350\nyou|9350|9475\nare|9475|9625\nearning|9625|9950|*\nallowance|9950|10675\nabove|10812|11175\nit|11175|11325\nyou|11325|11475\nare|11475|11575\nspending|11575|12050|*\nit|12050|12450\n\nmost|13525|13738\nof|13738|13812\nthe|13812|13900\ntime|13900|14225\nthis|14225|14438\nbox|14438|14800\nsits|14800|15050\nquietly|15050|15562\nunder|15562|15738|*\nthe|15738|15850\nline|15850|16425\nbanking|16538|16950\ncredit|16950|17600\n\nthen|18500|18612\na|18612|18700\nrender|18700|19100\nstarts|19100|19700\nevery|19800|20100\ncore|20100|20375\ngoes|20375|20650\nto|20650|20738\nthe|20738|20862\nceiling|20862|21325|*\nand|21375|21500\nnow|21500|21800\nyou|21800|21950\nare|21950|22050\nspending|22050|22875|*\n\nit|25025|25125\ncounts|25125|25450\nonly|25450|25750\nthe|25750|25875\nwindow|25875|26200\non|26200|26412\nscreen|26412|27100|*\nso|27238|27438\npan|27438|27725\naway|27725|28150\nand|28150|28262\nthe|28262|28350\nnumbers|28350|28762\nfollow|28762|29500|*\n\ngrain|31025|31350\npan|31400|31675\nwidth|31725|32150\nall|32250|32412\nof|32412|32488\nit|32488|32625\nlive|32625|32838|*\nwhile|32838|32975\nyou|32975|33125\nwatch|33125|33750\n\n7|35550|35875|*\ndays|35875|36212|*\nof|36212|36338\nevidence|36338|36962|*\ninstead|36962|37288\nof|37288|37362\na|37362|37450\nguess|37450|38125',
        }}
      />
      <Composition
        id="burst-captions-zh"
        component={SpokenSubtitleTrack}
        schema={spokenSubtitleTrackSchema}
        width={1080}
        height={1920}
        fps={FPS}
        durationInFrames={Math.round(19.16 * FPS)}
        calculateMetadata={overlayMetadata<SpokenSubtitleTrackProps>(19.16)}
        defaultProps={{
          locale: 'zh-CN' as const,
          durationSec: 19.16,
          fontSize: 72,
          script: '你的|0|370\n机器|370|740\n是|740|925\n可突发|925|1480|*\n的|1480|1665\n\n4个|2085|2455\n核心|2455|2825|*\n但|2825|3010\n只有|3010|3380\n12.5%|3380|4675|*\n\n线|5095|5280\n下面|5280|5650\n是|5650|5835\n攒|5835|6020|*\n线|6020|6205\n上面|6205|6575\n是|6575|6760\n花|6760|6945|*\n\n多数|7365|7735\n时候|7735|8105\n它|8105|8290\n在|8290|8475\n线|8475|8660\n下面|8660|9030|*\n\n一|9450|9635\n开始|9635|10005\n渲染|10005|10375\n就|10375|10560\n在|10560|10745\n花|10745|10930|*\n了|10930|11115\n\n只算|11535|11905\n屏幕上|11905|12460\n看得见|12460|13015|*\n的|13015|13200\n\n颗粒|13620|13990\n平移|13990|14360\n宽度|14360|14730\n都是|14730|15100\n实时|15100|15470|*\n的|15470|15655\n\n7天|16075|16445\n的|16445|16630\n证据|16630|17000|*\n不是|17000|17370\n猜|17370|17555\n的|17555|17740',
        }}
      />
      <Composition
        id="burst-captions-en"
        component={SpokenSubtitleTrack}
        schema={spokenSubtitleTrackSchema}
        width={1080}
        height={1920}
        fps={FPS}
        durationInFrames={Math.round(23.79 * FPS)}
        calculateMetadata={overlayMetadata<SpokenSubtitleTrackProps>(23.79)}
        defaultProps={{
          locale: 'en-US' as const,
          durationSec: 23.79,
          fontSize: 64,
          script: 'your|0|335\nbox|335|670\nis|670|1005\nburstable|1005|1340|*\n\n4|1760|2095|*\nOCPUs|2095|2430\nand|2430|2765\n12.5%|2765|3435|*\nof|3435|3770\nthem|3770|4105\nsustained|4105|4440\n\nbelow|4860|5195\nthe|5195|5530\nline|5530|5865\nyou|5865|6200\nearn|6200|6535|*\nabove|6535|6870\nit|6870|7205\nyou|7205|7540\nspend|7540|7875|*\n\nmost|8295|8630\nof|8630|8965\nthe|8965|9300\ntime|9300|9635\nthis|9635|9970\nbox|9970|10305\nsits|10305|10640\nunder|10640|10975|*\nit|10975|11310\n\nthen|11730|12065\na|12065|12400\nrender|12400|12735\nstarts|12735|13070\nand|13070|13405\nyou|13405|13740\nare|13740|14075\nspending|14075|14410|*\n\nit|14830|15165\ncounts|15165|15500\nonly|15500|15835\nwhat|15835|16170\nis|16170|16505\non|16505|16840\nscreen|16840|17175|*\n\ngrain|17595|17930\npan|17930|18265\nwidth|18265|18600\nall|18600|18935\nlive|18935|19270|*\n\n7 days|19690|20360|*\nof|20360|20695\nevidence|20695|21030|*\ninstead|21030|21365\nof|21365|21700\na|21700|22035\nguess|22035|22370',
        }}
      />
      <Composition
        id="spoken-subtitle-zh"
        component={SpokenSubtitle}
        schema={spokenSubtitleSchema}
        width={1080}
        height={1920}
        fps={FPS}
        durationInFrames={Math.round(9.0 * FPS)}
        calculateMetadata={overlayMetadata<SpokenSubtitleProps>(9.0)}
        defaultProps={{
          locale: 'zh-CN' as const,
          durationSec: 9.0,
          fontSize: 76,
          words: '你的|0|600\n机器|600|1200\n是|1200|1600\n可突发|1600|2400|*\n的|2400|2800',
        }}
      />
      <Composition
        id="spoken-subtitle-en"
        component={SpokenSubtitle}
        schema={spokenSubtitleSchema}
        width={1080}
        height={1920}
        fps={FPS}
        durationInFrames={Math.round(9.48 * FPS)}
        calculateMetadata={overlayMetadata<SpokenSubtitleProps>(9.48)}
        defaultProps={{
          locale: 'en-US' as const,
          durationSec: 9.48,
          fontSize: 68,
          words: 'when|0|530\nyou|530|1060\nmessage|1060|1590\neach|1590|2120\ntrack|2120|2650\njust|2650|3180\nshare|3180|3710\nit|3710|4240\nstraight|4240|4770\nfrom|4770|5300\nthe|5300|5830\napp|5830|6360\nand|6360|6890\nyou|6890|7420\nare|7420|7950\ndone|7950|8480',
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
          convergeSec: 2.55,
          formSec: 2.90,
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
