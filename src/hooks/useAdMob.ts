import { useCallback, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { waitForAdMobReady } from '@/components/AdBanner';

// AdMob IDs
const INTERSTITIAL_AD_UNIT_ID = 'ca-app-pub-2070193214456761/7336537140'; // PRODUCTION ID

let admobModule: any = null;
// Track whether an interstitial is currently loaded and ready to show
let interstitialReady = false;

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

/**
 * Pre-loads an interstitial so it's ready when the user taps "Dame Recetas".
 * Called once at app startup via useAdMob().
 */
async function prepareInterstitialAd() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await waitForAdMobReady();
    const AdMob = await getAdMob();
    if (!AdMob) return;

    // Listen for ready / fail events
    AdMob.addListener('onInterstitialAdLoaded', () => {
      console.log('[AdMob] ✅ Interstitial loaded and ready');
      interstitialReady = true;
    });
    AdMob.addListener('onInterstitialAdFailedToLoad', (err: any) => {
      console.warn('[AdMob] ❌ Interstitial failed to load:', JSON.stringify(err));
      interstitialReady = false;
    });
    AdMob.addListener('onInterstitialAdDismissed', () => {
      console.log('[AdMob] Interstitial dismissed — pre-loading next one');
      interstitialReady = false;
      // Pre-load next ad for the following request
      prepareInterstitialAd();
    });

    await AdMob.prepareInterstitial({
      adId: INTERSTITIAL_AD_UNIT_ID,
      isTesting: false,
    });
    console.log('[AdMob] prepareInterstitial() called — waiting for onInterstitialAdLoaded');
  } catch (e) {
    console.warn('[AdMob] prepareInterstitial error:', e);
  }
}

export function useAdMob() {
  const loadingRef = useRef(false);

  // Pre-load the interstitial as soon as AdMob is ready
  useEffect(() => {
    prepareInterstitialAd();
  }, []);

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

      // If the ad isn't ready yet, skip gracefully — don't block the user
      if (!interstitialReady) {
        console.warn('[AdMob] Interstitial not ready yet — skipping');
        loadingRef.current = false;
        return true;
      }

      // Show and wait for dismiss or fail, with a 15s safety timeout
      return new Promise<boolean>((resolve) => {
        let resolved = false;
        const done = () => {
          if (resolved) return;
          resolved = true;
          loadingRef.current = false;
          resolve(true);
        };

        const timeout = setTimeout(() => {
          console.warn('[AdMob] Interstitial show timeout — unblocking');
          done();
        }, 15000);

        const failListener = AdMob.addListener(
          'onInterstitialAdFailedToShow',
          (err: any) => {
            console.warn('[AdMob] Interstitial failed to show:', err);
            clearTimeout(timeout);
            failListener?.remove?.();
            done();
          }
        );

        AdMob.showInterstitial()
          .then(() => {
            // Actual dismissal is handled by the persistent listener in prepareInterstitialAd
            clearTimeout(timeout);
            failListener?.remove?.();
            done();
          })
          .catch((err: any) => {
            console.warn('[AdMob] showInterstitial error:', err);
            clearTimeout(timeout);
            failListener?.remove?.();
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
