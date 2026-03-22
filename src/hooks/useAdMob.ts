import { useCallback, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { waitForAdMobReady } from '@/components/AdBanner';
import { usePremium } from '@/hooks/usePremium';

// Publisher: ca-app-pub-2070193214456761
// App ID:    ca-app-pub-2070193214456761~5626242502
const INTERSTITIAL_AD_UNIT_ID = 'ca-app-pub-2070193214456761/7133653740';

let admobModule: any = null;
let interstitialReady = false;
let isPreloading = false;

async function getAdMob() {
  if (admobModule) return admobModule;
  try {
    const mod = await import('@capacitor-community/admob');
    admobModule = mod.AdMob;
    return admobModule;
  } catch (e) {
    console.warn('[AdMob] Failed to import AdMob module:', e);
    return null;
  }
}

async function prepareInterstitialAd() {
  if (!Capacitor.isNativePlatform()) return;
  if (isPreloading) return;
  isPreloading = true;

  try {
    await waitForAdMobReady();
    const AdMob = await getAdMob();
    if (!AdMob) {
      isPreloading = false;
      return;
    }

    console.log('[AdMob] Preloading interstitial adId:', INTERSTITIAL_AD_UNIT_ID);

    AdMob.addListener('onInterstitialAdLoaded', () => {
      console.log('[AdMob] ✅ Interstitial loaded and ready');
      interstitialReady = true;
      isPreloading = false;
    });

    AdMob.addListener('onInterstitialAdFailedToLoad', (err: any) => {
      console.warn('[AdMob] ❌ Interstitial failed to load:', JSON.stringify(err));
      interstitialReady = false;
      isPreloading = false;
      // Retry after 30s
      setTimeout(() => prepareInterstitialAd(), 30000);
    });

    AdMob.addListener('onInterstitialAdDismissed', () => {
      console.log('[AdMob] Interstitial dismissed — preloading next');
      interstitialReady = false;
      isPreloading = false;
      prepareInterstitialAd();
    });

    AdMob.addListener('onInterstitialAdFailedToShow', (err: any) => {
      console.warn('[AdMob] Interstitial failed to show:', JSON.stringify(err));
      interstitialReady = false;
      isPreloading = false;
      prepareInterstitialAd();
    });

    await AdMob.prepareInterstitial({
      adId: INTERSTITIAL_AD_UNIT_ID,
      isTesting: false,
    });

    console.log('[AdMob] prepareInterstitial() called — waiting for onInterstitialAdLoaded');
  } catch (e: any) {
    console.warn('[AdMob] prepareInterstitial error:', e?.message || e);
    isPreloading = false;
  }
}

export function useAdMob() {
  const { isPremium } = usePremium();
  const loadingRef = useRef(false);

  useEffect(() => {
    // Only preload for free users on native
    if (!isPremium && Capacitor.isNativePlatform()) {
      prepareInterstitialAd();
    }
  }, [isPremium]);

  const showInterstitial = useCallback(async (): Promise<boolean> => {
    // Always unblock for premium users or non-native
    if (!Capacitor.isNativePlatform() || isPremium) return true;
    if (loadingRef.current) return true;
    loadingRef.current = true;

    try {
      const AdMob = await getAdMob();
      if (!AdMob) {
        loadingRef.current = false;
        return true;
      }

      if (!interstitialReady) {
        console.warn('[AdMob] Interstitial not ready — skipping ad, unblocking UX');
        loadingRef.current = false;
        return true;
      }

      console.log('[AdMob] Showing interstitial...');

      const adPromise = new Promise<boolean>((resolve) => {
        let resolved = false;
        const done = (reason: string) => {
          if (resolved) return;
          resolved = true;
          loadingRef.current = false;
          console.log(`[AdMob] Interstitial resolved: ${reason}`);
          resolve(true);
        };

        AdMob.addListener('onInterstitialAdFailedToShow', (err: any) => {
          console.warn('[AdMob] Failed to show:', JSON.stringify(err));
          done('failedToShow');
        });

        AdMob.showInterstitial()
          .then(() => done('shown'))
          .catch((err: any) => {
            console.warn('[AdMob] showInterstitial() error:', err?.message || err);
            done('showError');
          });
      });

      // Hard timeout: never block UX more than 3s
      const timeoutPromise = new Promise<boolean>((resolve) =>
        setTimeout(() => {
          console.warn('[AdMob] 3s timeout — unblocking UX');
          loadingRef.current = false;
          resolve(true);
        }, 3000)
      );

      return Promise.race([adPromise, timeoutPromise]);
    } catch (e: any) {
      console.warn('[AdMob] Interstitial error:', e?.message || e);
      loadingRef.current = false;
      return true;
    }
  }, [isPremium]);

  return { showInterstitial };
}
