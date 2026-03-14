import { useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';

// AdMob IDs
const INTERSTITIAL_AD_UNIT_ID = 'ca-app-pub-2070932144567614/7133653740';

let admobModule: any = null;

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

  const showInterstitial = useCallback(async (): Promise<boolean> => {
    if (!Capacitor.isNativePlatform()) {
      return true;
    }

    if (loadingRef.current) return true;
    loadingRef.current = true;

    try {
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
        console.log('[AdMob] Interstitial prepared');
      } catch (prepareErr) {
        console.warn('[AdMob] Interstitial prepare failed:', prepareErr);
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
          console.warn('[AdMob] Interstitial timeout — unblocking');
          done();
        }, 15000);

        const dismissListener = AdMob.addListener(
          'onInterstitialAdDismissed',
          () => { clearTimeout(timeout); done(); }
        );

        const failListener = AdMob.addListener(
          'onInterstitialAdFailedToShow',
          (err: any) => {
            console.warn('[AdMob] Interstitial failed to show:', err);
            clearTimeout(timeout);
            done();
          }
        );

        AdMob.showInterstitial().catch((err: any) => {
          console.warn('[AdMob] showInterstitial error:', err);
          clearTimeout(timeout);
          done();
        });
      });
    } catch (e) {
      console.warn('[AdMob] Interstitial error:', e);
      loadingRef.current = false;
      return true;
    }
  }, []);

  return { showInterstitial };
}
