import { useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';

// AdMob IDs
const ADMOB_APP_ID = 'ca-app-pub-2070932144567614~2284749809';
const INTERSTITIAL_AD_UNIT_ID = 'ca-app-pub-2070932144567614/7133653740';
const BANNER_AD_UNIT_ID = 'ca-app-pub-2070932144567614/7836431130';

let admobModule: any = null;
let initialized = false;

async function getAdMob() {
  if (admobModule) return admobModule;
  try {
    const mod = await import('@capacitor-community/admob');
    admobModule = mod.AdMob;
    return admobModule;
  } catch {
    return null;
  }
}

export function useAdMob() {
  const loadingRef = useRef(false);

  const initialize = useCallback(async () => {
    if (initialized || !Capacitor.isNativePlatform()) return;
    try {
      const AdMob = await getAdMob();
      if (!AdMob) return;
      await AdMob.initialize({
        initializeForTesting: false,
      });
      initialized = true;
      console.log('AdMob initialized');
    } catch (e) {
      console.warn('AdMob init failed:', e);
    }
  }, []);

  const showInterstitial = useCallback(async (): Promise<boolean> => {
    if (!Capacitor.isNativePlatform()) {
      return true;
    }

    if (loadingRef.current) return true;
    loadingRef.current = true;

    try {
      await initialize();
      const AdMob = await getAdMob();
      if (!AdMob) {
        loadingRef.current = false;
        return true;
      }

      // Prepare the interstitial
      try {
        await AdMob.prepareInterstitial({
          adId: INTERSTITIAL_AD_UNIT_ID,
          isTesting: false,
        });
      } catch (prepareErr) {
        console.warn('Interstitial prepare failed:', prepareErr);
        loadingRef.current = false;
        return true; // Continue without ad
      }

      // Show and wait for it to close, with a 15s safety timeout
      return new Promise<boolean>((resolve) => {
        let resolved = false;
        const done = () => {
          if (resolved) return;
          resolved = true;
          dismissListener?.remove?.();
          failListener?.remove?.();
          loadingRef.current = false;
          resolve(true);
        };

        // Safety timeout: if ad never fires events, unblock after 15s
        const timeout = setTimeout(() => {
          console.warn('Interstitial timeout — unblocking');
          done();
        }, 15000);

        const dismissListener = AdMob.addListener(
          'onInterstitialAdDismissed',
          () => { clearTimeout(timeout); done(); }
        );

        const failListener = AdMob.addListener(
          'onInterstitialAdFailedToShow',
          () => { clearTimeout(timeout); done(); }
        );

        AdMob.showInterstitial().catch(() => {
          clearTimeout(timeout);
          done();
        });
      });
    } catch (e) {
      console.warn('Interstitial error:', e);
      loadingRef.current = false;
      return true;
    }
  }, [initialize]);

  return { showInterstitial, initialize };
}
