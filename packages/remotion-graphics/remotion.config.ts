import {Config} from '@remotion/cli/config';

// Alpha/ProRes render settings are baked per-composition via calculateMetadata
// (see src/shared.ts) so bare `npx remotion render <id>` does the right thing.
Config.setEntryPoint('src/index.ts');
Config.setOverwriteOutput(true);
