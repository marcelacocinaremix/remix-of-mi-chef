import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { usePremium } from '@/hooks/usePremium';

// ── Ad Unit IDs (Production — Publisher: ca-app-pub-2070193214456761) ────────
// App ID in AndroidManifest: ca-app-pub-2070193214456761~5626242502
const BANNER_AD_UNIT_ID = 'ca-app-pub-2070193214456761/7836431130';

let admobModule: any = null;
let bannerShowing = false;
let sdkReady = false;
let sdkInitialized = false; // tracks if AdMob.initialize() was already called
let sdkReadyCallbacks: Array<() => void> = [];

// Called by native bridge (Java) after MobileAds.initialize() completes
export function markAdMobReady() {
  sdkReady = true;
  console.log('[AdBanner] ✅ AdMob SDK marked ready — notifying', sdkReadyCallbacks.length, 'listeners');
  sdkReadyCallbacks.forEach(cb => cb());
  sdkReadyCallbacks = [];
}

export function waitForAdMobReady(): Promise<void> {
  if (sdkReady) return Promise.resolve();
  return new Promise(resolve => {
    sdkReadyCallbacks.push(resolve);
    // Fallback: if native bridge never calls markAdMobReady, unblock after 5s
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

// ── AdMob.initialize() — must be called once before any ad ───────────────────
async function ensureAdMobInitialized() {
  if (sdkInitialized) return;
  const AdMob = await getAdMob();
  if (!AdMob) return;
  try {
    await AdMob.initialize({
      requestTrackingAuthorization: false, // iOS only; not needed on Android
      testingDevices: [], // empty = production ads
      initializeForTesting: false,
    });
    sdkInitialized = true;
    console.log('[AdBanner] ✅ AdMob.initialize() called successfully');
    // Mark SDK ready immediately after initialize() resolves
    markAdMobReady();
  } catch (e: any) {
    // initialize() may throw if already called — that's fine
    console.warn('[AdBanner] AdMob.initialize() warning (may already be initialized):', e?.message || e);
    sdkInitialized = true;
    markAdMobReady();
  }
}

export function AdBanner() {
  const { isPremium, isLoading } = usePremium();
  const shownRef = useRef(false);
  const retryRef = useRef(0);

  // Kick off SDK initialization as early as possible on native
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      ensureAdMobInitialized();
    }
  }, []);

  useEffect(() => {
    if (isLoading) return;

    // Remove banner for premium users
    if (!Capacitor.isNativePlatform() || isPremium) {
      if (bannerShowing) {
        getAdMob().then(AdMob => {
          if (AdMob) {
            AdMob.hideBanner().catch(() => {});
            AdMob.removeBanner().catch(() => {});
            bannerShowing = false;
            console.log('[AdBanner] Banner removed for premium user');
          }
        });
      }
      return;
    }

    if (shownRef.current) return;

    async function showBanner() {
      try {
        // Make sure SDK is initialized before showing any ad
        await ensureAdMobInitialized();
        await waitForAdMobReady();

        // Give WebView time to finish rendering (avoids layout issues)
        await new Promise(resolve => setTimeout(resolve, 800));

        const AdMob = await getAdMob();
        if (!AdMob) {
          console.warn('[AdBanner] AdMob module not available — cannot show banner');
          return;
        }

        console.log('[AdBanner] Attempting to show banner | adId:', BANNER_AD_UNIT_ID, '| isPremium:', isPremium);

        // Remove stale listeners
        AdMob.removeAllListeners().catch(() => {});

        AdMob.addListener('onBannerAdLoaded', () => {
          console.log('[AdBanner] ✅ Banner loaded successfully');
          bannerShowing = true;
          shownRef.current = true;
          retryRef.current = 0;
        });

        AdMob.addListener('onBannerAdFailedToLoad', (err: any) => {
          console.warn('[AdBanner] ❌ Banner failed to load:', JSON.stringify(err));
          console.warn('[AdBanner] Error code:', err?.code, '| message:', err?.message);
          bannerShowing = false;
          // Retry up to 3 times with exponential backoff
          if (retryRef.current < 3) {
            const delay = Math.pow(2, retryRef.current) * 3000;
            retryRef.current += 1;
            console.log(`[AdBanner] Retrying banner in ${delay}ms (attempt ${retryRef.current}/3)`);
            shownRef.current = false;
            setTimeout(showBanner, delay);
          } else {
            console.warn('[AdBanner] Max retries reached — giving up on banner');
          }
        });

        AdMob.addListener('onBannerAdOpened', () => {
          console.log('[AdBanner] Banner ad opened by user');
        });

        AdMob.addListener('onBannerAdClosed', () => {
          console.log('[AdBanner] Banner ad closed');
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

  // Reserve space: nav bar (~56px) + banner (~60px)
  return <div style={{ height: 60, minHeight: 50, minWidth: 320 }} aria-hidden="true" />;
}
