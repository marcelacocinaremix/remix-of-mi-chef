import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.marcelacocina.michef',
  appName: 'Mi Chef - Marcela Cocina',
  webDir: 'dist',
  android: {
    backgroundColor: '#FDF6F0'
  },
  ios: {
    backgroundColor: '#FDF6F0'
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '917075133002-au4d.apps.googleusercontent.com',
      forceCodeForRefreshToken: true
    }
  }
};

export default config;
