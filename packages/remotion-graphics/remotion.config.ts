import {Config} from '@remotion/cli/config';

// Alpha/ProRes render settings are baked per-composition via calculateMetadata
// (see src/shared.ts) so bare `npx remotion render <id>` does the right thing.
Config.setEntryPoint('src/index.ts');
Config.setOverwriteOutput(true);
// Font loads via @remotion/fonts delayRender can exceed the ~30s default when a
// render page starts under load — give them headroom instead of failing the render.
Config.setDelayRenderTimeoutInMilliseconds(300000);
