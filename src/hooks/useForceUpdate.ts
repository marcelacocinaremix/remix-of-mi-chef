import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// Current app version — bump this on every release
export const APP_VERSION = "1.0.0";

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
        const { data, error } = await supabase
          .from("app_config")
          .select("min_version, store_url")
          .eq("id", 1)
          .single();

        if (cancelled) return;

        if (error || !data) {
          // If fetch fails, allow access (fail open)
          setUpdateRequired(false);
          return;
        }

        if (data.store_url) setStoreUrl(data.store_url);

        if (isVersionLessThan(APP_VERSION, data.min_version)) {
          setUpdateRequired(true);
        } else {
          setUpdateRequired(false);
        }
      } catch {
        // Network error → fail open
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
