import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { usePremium } from '@/hooks/usePremium';

const BANNER_AD_UNIT_ID = 'ca-app-pub-2070932144567614/7836431130';

let admobModule: any = null;
let bannerShowing = false;

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
  const { isPremium } = usePremium();
  const shownRef = useRef(false);

  useEffect(() => {
    // Only show on native platform and for free users
    if (!Capacitor.isNativePlatform() || isPremium) {
      // If banner was showing and user upgraded, hide it
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
        const AdMob = await getAdMob();
        if (!AdMob) return;

        // Initialize if needed
        try {
          await AdMob.initialize({ initializeForTesting: false });
        } catch {
          // Already initialized, ignore
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
      } catch (e) {
        console.warn('Banner ad error:', e);
      }
    }

    showBanner();

    return () => {
      // Don't remove on every re-render, keep it persistent
    };
  }, [isPremium]);

  // On web or premium: render nothing
  if (!Capacitor.isNativePlatform() || isPremium) return null;

  // Reserve space at bottom so content isn't hidden behind the banner (~50px)
  return <div style={{ height: 60 }} aria-hidden="true" />;
}
