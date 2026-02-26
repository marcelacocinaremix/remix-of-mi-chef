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
      // On web, just skip the ad
      return true;
    }

    if (loadingRef.current) return true;
    loadingRef.current = true;

    try {
      await initialize();
      const AdMob = await getAdMob();
      if (!AdMob) {
        loadingRef.current = false;
        return true; // No AdMob available, continue
      }

      // Prepare the interstitial
      await AdMob.prepareInterstitial({
        adId: INTERSTITIAL_AD_UNIT_ID,
        isTesting: false,
      });

      // Show and wait for it to close
      return new Promise<boolean>((resolve) => {
        // Listen for dismiss event
        const dismissListener = AdMob.addListener(
          'onInterstitialAdDismissed',
          () => {
            dismissListener?.remove?.();
            failListener?.remove?.();
            loadingRef.current = false;
            resolve(true);
          }
        );

        const failListener = AdMob.addListener(
          'onInterstitialAdFailedToShow',
          () => {
            dismissListener?.remove?.();
            failListener?.remove?.();
            loadingRef.current = false;
            resolve(true); // Continue even if ad fails
          }
        );

        AdMob.showInterstitial().catch(() => {
          dismissListener?.remove?.();
          failListener?.remove?.();
          loadingRef.current = false;
          resolve(true);
        });
      });
    } catch (e) {
      console.warn('Interstitial error:', e);
      loadingRef.current = false;
      return true; // On error, let the user continue
    }
  }, [initialize]);

  return { showInterstitial, initialize };
}
