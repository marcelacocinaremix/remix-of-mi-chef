import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.marcelacocina.michef',
  appName: 'Mi Chef - Marcela Cocina',
  webDir: 'dist',
  android: {
    backgroundColor: '#000000'
  },
  ios: {
    backgroundColor: '#000000'
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '985393750270-1rj9jjo9at4t798dski3vg56ujhv4hs0.apps.googleusercontent.com',
      forceCodeForRefreshToken: true
    },
    AdMob: {
      appId: {
        android: 'ca-app-pub-2070193214456761~5626242502',
        ios: 'ca-app-pub-2070193214456761~5626242502'
      }
    }
  }
  // NOTE: Do NOT add server.url here for production builds.
  // That config is only for local development and prevents
  // native plugins (AdMob, etc.) from working correctly.
};

export default config;
