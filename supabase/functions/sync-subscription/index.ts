import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Unified response shape consumed by the frontend ───────────────────────────
interface SyncResult {
  success: boolean;
  is_premium: boolean;
  trial_active: boolean;
  expiration_date: string | null; // ISO string — covers both paid end & trial end
  subscription_status: string;
  plan_type: string | null;
  cancelled_active?: boolean;
}

async function getGoogleAccessToken(serviceAccountKey: string): Promise<string | null> {
  try {
    let key: any;
    try { key = JSON.parse(serviceAccountKey); } catch {
      console.error("[sync-sub] First JSON.parse failed");
      return null;
    }
    if (typeof key === "string") {
      try { key = JSON.parse(key); } catch {
        console.error("[sync-sub] Second JSON.parse failed");
        return null;
      }
    }
    if (!key?.private_key || !key?.client_email) {
      console.error("[sync-sub] Missing private_key or client_email. Keys:", Object.keys(key || {}));
      return null;
    }
    console.log(`[sync-sub] Service account: ${key.client_email}`);

    const encoder = new TextEncoder();
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: "RS256", typ: "JWT" };
    const payload = {
      iss: key.client_email,
      scope: "https://www.googleapis.com/auth/androidpublisher",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    };

    const toB64 = (obj: object) =>
      btoa(String.fromCharCode(...encoder.encode(JSON.stringify(obj))))
        .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

    const signInput = `${toB64(header)}.${toB64(payload)}`;
    const pemContent = key.private_key
      .replace("-----BEGIN PRIVATE KEY-----", "")
      .replace("-----END PRIVATE KEY-----", "")
      .replace(/\n/g, "");
    const binaryKey = Uint8Array.from(atob(pemContent), (c) => c.charCodeAt(0));
    const cryptoKey = await crypto.subtle.importKey(
      "pkcs8", binaryKey, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]
    );
    const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, encoder.encode(signInput));
    const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const jwt = `${signInput}.${sigB64}`;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });
    if (!tokenRes.ok) {
      console.error(`[sync-sub] OAuth token failed (${tokenRes.status}):`, await tokenRes.text());
      return null;
    }
    return (await tokenRes.json()).access_token;
  } catch (e) {
    console.error("[sync-sub] Exception in getGoogleAccessToken:", e instanceof Error ? e.message : String(e));
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const googleServiceAccountKey = Deno.env.get("GOOGLE_PLAY_SERVICE_ACCOUNT_KEY");
    const googlePackageName = Deno.env.get("GOOGLE_PLAY_PACKAGE_NAME");
    const googleSubscriptionId = Deno.env.get("GOOGLE_PLAY_SUBSCRIPTION_ID");

    // ── Auth ──────────────────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid user" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json().catch(() => ({}));
    const purchaseToken = body.purchaseToken as string | undefined;

    console.log(`[sync-sub] user=${user.id} token=${!!purchaseToken} pkg=${googlePackageName} subId=${googleSubscriptionId}`);

    // ── Case 1: Validate purchaseToken with Google Play ───────────────────────
    if (purchaseToken && googleServiceAccountKey && googlePackageName && googleSubscriptionId) {
      const accessToken = await getGoogleAccessToken(googleServiceAccountKey);
      if (!accessToken) {
        return new Response(JSON.stringify({ error: "Could not obtain Google access token" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const gpUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${googlePackageName}/purchases/subscriptions/${googleSubscriptionId}/tokens/${purchaseToken.trim()}`;
      const gpRes = await fetch(gpUrl, { headers: { Authorization: `Bearer ${accessToken}` } });

      if (!gpRes.ok) {
        const errText = await gpRes.text();
        console.error(`[sync-sub] Google Play error ${gpRes.status}:`, errText);
        return new Response(JSON.stringify({ error: "Google Play validation failed", details: errText }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const gpData = await gpRes.json();
      const expiryMs = parseInt(gpData.expiryTimeMillis, 10);
      const subscriptionEnd = new Date(expiryMs).toISOString();
      const isActive = expiryMs > Date.now();
      const isCancelled = gpData.cancelReason !== undefined;

      // Cancelled-but-within-period = still premium (grace period)
      const newStatus = isCancelled ? "cancelled" : isActive ? "active" : "expired";
      const newIsPremium = isActive; // true while within paid window, even if cancelled

      // Preserve trial data
      const { data: existingSub } = await adminClient
        .from("user_subscriptions")
        .select("trial_used, trial_start_date, trial_end_date")
        .eq("user_id", user.id)
        .maybeSingle();

      const { error: upsertError } = await adminClient
        .from("user_subscriptions")
        .upsert({
          user_id: user.id,
          is_premium: newIsPremium,
          plan_type: newIsPremium ? "premium" : "free",
          subscription_status: newStatus,
          subscription_end: subscriptionEnd,
          updated_at: new Date().toISOString(),
          ...(existingSub?.trial_used !== undefined && { trial_used: existingSub.trial_used }),
          ...(existingSub?.trial_start_date && { trial_start_date: existingSub.trial_start_date }),
          ...(existingSub?.trial_end_date && { trial_end_date: existingSub.trial_end_date }),
        }, { onConflict: "user_id" });

      if (upsertError) {
        console.error("[sync-sub] DB upsert error:", upsertError);
        return new Response(JSON.stringify({ error: "Failed to sync subscription" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`✅ [sync-sub] Synced user=${user.id} status=${newStatus} expires=${subscriptionEnd}`);

      const result: SyncResult = {
        success: true,
        is_premium: newIsPremium,
        trial_active: false,
        expiration_date: subscriptionEnd,
        subscription_status: newStatus,
        plan_type: newIsPremium ? "premium" : "free",
        cancelled_active: isCancelled && isActive,
      };
      return new Response(JSON.stringify(result), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Case 2: No token → return current DB state ────────────────────────────
    const { data: sub, error: fetchError } = await adminClient
      .from("user_subscriptions")
      .select("is_premium, subscription_status, subscription_end, trial_used, trial_end_date, plan_type")
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchError) {
      return new Response(JSON.stringify({ error: "Failed to fetch subscription" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!sub) {
      const result: SyncResult = {
        success: true,
        is_premium: false,
        trial_active: false,
        expiration_date: null,
        subscription_status: "none",
        plan_type: "free",
      };
      return new Response(JSON.stringify(result), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const rawEnd = sub.subscription_end ? new Date(sub.subscription_end) : null;
    const rawTrialEnd = sub.trial_end_date ? new Date(sub.trial_end_date) : null;

    // Grace period: cancelled + future end = still premium
    const gracePeriodActive = sub.subscription_status === "cancelled" && !!rawEnd && rawEnd > now;
    const effectivePremium = sub.is_premium || gracePeriodActive;

    // Trial active: no paid plan, but trial hasn't expired
    const trialActive = !effectivePremium && sub.trial_used === true && !!rawTrialEnd && rawTrialEnd > now;

    // expiration_date = most relevant date for the frontend (paid end > trial end)
    const expirationDate = rawEnd?.toISOString() ?? rawTrialEnd?.toISOString() ?? null;

    const result: SyncResult = {
      success: true,
      is_premium: effectivePremium,
      trial_active: trialActive,
      expiration_date: expirationDate,
      subscription_status: sub.subscription_status ?? "none",
      plan_type: sub.plan_type,
      cancelled_active: gracePeriodActive,
    };
    return new Response(JSON.stringify(result), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("[sync-sub] Unhandled error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
