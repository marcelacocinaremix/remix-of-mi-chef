import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";

// Fallback only used when Capacitor is not available (web preview)
const FALLBACK_VERSION = "99.99.99";

function parseVersion(v: string): number[] {
  return v.split(".").map((n) => parseInt(n, 10) || 0);
}

function isVersionLessThan(current: string, minimum: string): boolean {
  const cur = parseVersion(current);
  const min = parseVersion(minimum);
  const len = Math.max(cur.length, min.length);
  for (let i = 0; i < len; i++) {
    const c = cur[i] ?? 0;
    const m = min[i] ?? 0;
    if (c < m) return true;
    if (c > m) return false;
  }
  return false;
}

async function getAppVersion(): Promise<string> {
  try {
    if (Capacitor.isNativePlatform()) {
      const info = await App.getInfo();
      return info.version; // versionName from AndroidManifest / Info.plist
    }
  } catch {
    // Capacitor not available — fail safe
  }
  return FALLBACK_VERSION;
}

export function useForceUpdate() {
  const [updateRequired, setUpdateRequired] = useState(false);
  const [storeUrl, setStoreUrl] = useState(
    "https://play.google.com/store/apps/details?id=app.marcelacocina.michef"
  );
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const currentVersion = await getAppVersion();

        const { data, error } = await supabase
          .from("app_config")
          .select("min_version, store_url")
          .eq("id", 1)
          .single();

        if (cancelled) return;

        if (error || !data) {
          setUpdateRequired(false);
          return;
        }

        if (data.store_url) setStoreUrl(data.store_url);

        if (isVersionLessThan(currentVersion, data.min_version)) {
          setUpdateRequired(true);
        } else {
          setUpdateRequired(false);
        }
      } catch {
        if (!cancelled) setUpdateRequired(false);
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    check();
    return () => { cancelled = true; };
  }, []);

  return { updateRequired, storeUrl, checking };
}
