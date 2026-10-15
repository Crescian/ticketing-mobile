/// <reference types="node" />
import { existsSync } from 'node:fs';
import type { ConfigContext, ExpoConfig } from 'expo/config';

// Extends app.json. Android push needs Firebase's google-services.json: it's
// picked up from the project root when present, or from the
// GOOGLE_SERVICES_JSON EAS file variable on cloud builds, so the app still
// builds (without push) before Firebase is set up.
export default ({ config }: ConfigContext): ExpoConfig => {
  const googleServicesFile =
    process.env.GOOGLE_SERVICES_JSON ?? (existsSync('./google-services.json') ? './google-services.json' : undefined);

  return {
    ...config,
    name: config.name ?? 'ICT Support',
    slug: config.slug ?? 'ticketing-mobile',
    android: {
      ...config.android,
      ...(googleServicesFile ? { googleServicesFile } : {}),
    },
  };
};
