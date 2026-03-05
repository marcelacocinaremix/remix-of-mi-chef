import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { usePremium } from '@/hooks/usePremium';

const BANNER_AD_UNIT_ID = 'ca-app-pub-2070932144567614/7836431130';

let admobModule: any = null;
let bannerShowing = false;
// Track if AdMob SDK is ready (initialized in main.tsx)
let sdkReady = false;
let sdkReadyCallbacks: Array<() => void> = [];

// Called from main.tsx after AdMob.initialize() resolves
export function markAdMobReady() {
  sdkReady = true;
  sdkReadyCallbacks.forEach(cb => cb());
  sdkReadyCallbacks = [];
}

function waitForAdMobReady(): Promise<void> {
  if (sdkReady) return Promise.resolve();
  return new Promise(resolve => {
    sdkReadyCallbacks.push(resolve);
    // Safety: if not called within 5s, proceed anyway
    setTimeout(() => resolve(), 5000);
  });
}

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

export function AdBanner() {
  const { isPremium, isLoading } = usePremium();
  const shownRef = useRef(false);

  useEffect(() => {
    // Wait until premium status is resolved
    if (isLoading) return;

    // Only show on native platform and for free users
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
        // Wait for SDK to be fully initialized
        await waitForAdMobReady();

        const AdMob = await getAdMob();
        if (!AdMob) {
          console.warn('[AdBanner] AdMob module not available');
          return;
        }

        await AdMob.showBanner({
          adId: BANNER_AD_UNIT_ID,
          adSize: 'ADAPTIVE_BANNER',
          position: 'BOTTOM_CENTER',
          margin: 0,
          isTesting: false,
        });

        bannerShowing = true;
        shownRef.current = true;
        console.log('[AdBanner] Banner shown successfully');
      } catch (e) {
        console.warn('[AdBanner] Error showing banner:', e);
      }
    }

    showBanner();
  }, [isPremium, isLoading]);

  // On web or premium: render nothing
  if (!Capacitor.isNativePlatform() || isPremium) return null;

  // Reserve space at bottom so content isn't hidden behind the banner (~50px)
  return <div style={{ height: 60 }} aria-hidden="true" />;
}
