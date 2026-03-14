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
    if (!Capacitor.isNativePlatform()) return true;
    if (loadingRef.current) return true;
    loadingRef.current = true;

    try {
      const AdMob = await getAdMob();
      if (!AdMob) { loadingRef.current = false; return true; }

      if (!interstitialReady) {
        console.warn('[AdMob] Interstitial not ready — skipping');
        loadingRef.current = false;
        return true;
      }

      // Promise.race: 2500ms hard timeout wins if ad stalls (Error 3 / No Fill)
      const adPromise = new Promise<boolean>((resolve) => {
        let resolved = false;
        const done = (reason?: string) => {
          if (resolved) return;
          resolved = true;
          loadingRef.current = false;
          if (reason) console.warn(`[AdMob] Interstitial resolved: ${reason}`);
          resolve(true);
        };

        const failListener = AdMob.addListener('onInterstitialAdFailedToShow', (err: any) => {
          console.warn('[AdMob] Interstitial failed to show:', err);
          failListener?.remove?.();
          done('failedToShow');
        });

        AdMob.showInterstitial()
          .then(() => { failListener?.remove?.(); done('shown'); })
          .catch((err: any) => {
            console.warn('[AdMob] showInterstitial error:', err);
            failListener?.remove?.();
            done('showError');
          });
      });

      const timeoutPromise = new Promise<boolean>((resolve) =>
        setTimeout(() => {
          console.warn('[AdMob] Interstitial 2500ms timeout — unblocking recipe generation');
          loadingRef.current = false;
          resolve(true);
        }, 2500)
      );

      return Promise.race([adPromise, timeoutPromise]);
    } catch (e) {
      console.warn('[AdMob] Interstitial error:', e);
      loadingRef.current = false;
      return true;
    }
  }, []);

  return { showInterstitial };
}
