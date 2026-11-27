import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.monentreprise.monapp',
  appName: 'ECO FRAIS',
  webDir: 'public',
  server: {
    url: 'https://ecopay-kw04.netlify.app',
    cleartext: true
  }
};

export default config;
