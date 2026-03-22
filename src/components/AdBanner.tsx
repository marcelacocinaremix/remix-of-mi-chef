import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { usePremium } from '@/hooks/usePremium';

// Publisher: ca-app-pub-2070193214456761
// App ID:    ca-app-pub-2070193214456761~5626242502  (must match AndroidManifest)
const BANNER_AD_UNIT_ID = 'ca-app-pub-2070193214456761/7836431130';

let admobModule: any = null;
let bannerShowing = false;
let sdkReady = false;
let sdkReadyCallbacks: Array<() => void> = [];

export function markAdMobReady() {
  sdkReady = true;
  sdkReadyCallbacks.forEach(cb => cb());
  sdkReadyCallbacks = [];
}

export function waitForAdMobReady(): Promise<void> {
  if (sdkReady) return Promise.resolve();
  return new Promise(resolve => {
    sdkReadyCallbacks.push(resolve);
    setTimeout(() => resolve(), 5000);
  });
}

async function getAdMob() {
  if (admobModule) return admobModule;
  try {
    const mod = await import('@capacitor-community/admob');
    admobModule = mod.AdMob;
    return admobModule;
  } catch (e) {
    console.warn('[AdBanner] Failed to import AdMob module:', e);
    return null;
  }
}

export function AdBanner() {
  const { isPremium, isLoading } = usePremium();
  const shownRef = useRef(false);
  const retryRef = useRef(0);

  useEffect(() => {
    if (isLoading) return;

    // Hide banner for premium users
    if (!Capacitor.isNativePlatform() || isPremium) {
      if (bannerShowing) {
        getAdMob().then(AdMob => {
          if (AdMob) {
            AdMob.hideBanner().catch(() => {});
            AdMob.removeBanner().catch(() => {});
            bannerShowing = false;
          }
        });
      }
      return;
    }

    if (shownRef.current) return;

    async function showBanner() {
      try {
        await waitForAdMobReady();

        // Wait for WebView to be fully rendered
        await new Promise(resolve => setTimeout(resolve, 2000));

        const AdMob = await getAdMob();
        if (!AdMob) {
          console.warn('[AdBanner] AdMob module not available');
          return;
        }

        console.log('[AdBanner] Attempting to show banner with adId:', BANNER_AD_UNIT_ID);

        // Remove stale listeners before adding new ones
        AdMob.removeAllListeners().catch(() => {});

        AdMob.addListener('onBannerAdLoaded', () => {
          console.log('[AdBanner] ✅ Banner loaded successfully');
          bannerShowing = true;
          shownRef.current = true;
          retryRef.current = 0;
        });

        AdMob.addListener('onBannerAdFailedToLoad', (err: any) => {
          const errStr = JSON.stringify(err);
          console.warn('[AdBanner] ❌ Banner failed to load:', errStr);
          bannerShowing = false;
          // Retry up to 3 times with exponential backoff
          if (retryRef.current < 3) {
            const delay = Math.pow(2, retryRef.current) * 3000;
            retryRef.current += 1;
            console.log(`[AdBanner] Retrying in ${delay}ms (attempt ${retryRef.current}/3)`);
            shownRef.current = false;
            setTimeout(showBanner, delay);
          }
        });

        AdMob.addListener('onBannerAdOpened', () => {
          console.log('[AdBanner] Banner ad opened');
        });

        await AdMob.showBanner({
          adId: BANNER_AD_UNIT_ID,
          adSize: 'ADAPTIVE_BANNER',
          position: 'BOTTOM_CENTER',
          margin: 56, // above bottom nav bar (~56px)
          isTesting: false,
          marginLayout: true,
        });

        console.log('[AdBanner] showBanner() called — waiting for onBannerAdLoaded event');
      } catch (e: any) {
        console.warn('[AdBanner] Error showing banner:', e?.message || e);
      }
    }

    showBanner();
  }, [isPremium, isLoading]);

  if (!Capacitor.isNativePlatform() || isPremium) return null;

  // Reserve bottom space: nav bar (~56px) + banner (~60px)
  return <div style={{ height: 60 }} aria-hidden="true" />;
}
