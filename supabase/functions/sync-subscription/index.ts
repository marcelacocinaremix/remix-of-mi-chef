import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function getGoogleAccessToken(serviceAccountKey: string): Promise<string | null> {
  try {
    const key = JSON.parse(serviceAccountKey);
    const header = { alg: "RS256", typ: "JWT" };
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: key.client_email,
      scope: "https://www.googleapis.com/auth/androidpublisher",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    };

    const encoder = new TextEncoder();
    const headerB64 = btoa(String.fromCharCode(...encoder.encode(JSON.stringify(header))))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const payloadB64 = btoa(String.fromCharCode(...encoder.encode(JSON.stringify(payload))))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const signInput = `${headerB64}.${payloadB64}`;

    const pemContent = key.private_key
      .replace("-----BEGIN PRIVATE KEY-----", "")
      .replace("-----END PRIVATE KEY-----", "")
      .replace(/\n/g, "");
    const binaryKey = Uint8Array.from(atob(pemContent), (c) => c.charCodeAt(0));
    const cryptoKey = await crypto.subtle.importKey(
      "pkcs8", binaryKey,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false, ["sign"]
    );
    const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, encoder.encode(signInput));
    const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const jwt = `${signInput}.${signatureB64}`;

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });
    if (!tokenResponse.ok) return null;
    const tokenData = await tokenResponse.json();
    return tokenData.access_token;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const googleServiceAccountKey = Deno.env.get("GOOGLE_PLAY_SERVICE_ACCOUNT_KEY");
    const googlePackageName = Deno.env.get("GOOGLE_PLAY_PACKAGE_NAME");
    const googleSubscriptionId = Deno.env.get("GOOGLE_PLAY_SUBSCRIPTION_ID");

    // Authenticate user
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

    // ── Case 1: purchaseToken provided → validate against Google Play ──────
    console.log(`[sync-sub] purchaseToken present: ${!!purchaseToken}, hasServiceKey: ${!!googleServiceAccountKey}, packageName: ${googlePackageName}, subscriptionId: ${googleSubscriptionId}`);

    if (purchaseToken && googleServiceAccountKey && googlePackageName && googleSubscriptionId) {
      console.log(`[sync-sub] Attempting Google access token for package: ${googlePackageName}`);
      const accessToken = await getGoogleAccessToken(googleServiceAccountKey);
      if (!accessToken) {
        console.error("[sync-sub] Failed to get Google access token — check GOOGLE_PLAY_SERVICE_ACCOUNT_KEY format");
        return new Response(JSON.stringify({ error: "Could not obtain Google access token" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.log("[sync-sub] Got Google access token ✅");

      const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${googlePackageName}/purchases/subscriptions/${googleSubscriptionId}/tokens/${purchaseToken.trim()}`;
      console.log(`[sync-sub] Calling Google Play API: ${url.substring(0, 120)}...`);
      const gpResponse = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!gpResponse.ok) {
        const errText = await gpResponse.text();
        console.error(`[sync-sub] Google Play API error ${gpResponse.status}:`, errText);
        return new Response(JSON.stringify({ error: "Google Play validation failed", details: errText }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const gpData = await gpResponse.json();
      const expiryMs = parseInt(gpData.expiryTimeMillis, 10);
      const subscriptionEnd = new Date(expiryMs).toISOString();
      const now = Date.now();
      const isActive = expiryMs > now;

      // cancelReason: 0=user, 1=system, 2=replaced, 3=developer
      const isCancelled = gpData.cancelReason !== undefined;
      const newStatus = isCancelled ? 'cancelled' : (isActive ? 'active' : 'expired');
      const newIsPremium = isActive; // true while within subscription_end, even if cancelled

      const { data: existingSub } = await adminClient
        .from("user_subscriptions")
        .select("trial_used, trial_start_date, trial_end_date")
        .eq("user_id", user.id)
        .maybeSingle();

      const { error: updateError } = await adminClient
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

      if (updateError) {
        console.error("Error syncing subscription:", updateError);
        return new Response(JSON.stringify({ error: "Failed to sync subscription" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`✅ Synced Google Play subscription for user ${user.id}: status=${newStatus}, expires=${subscriptionEnd}`);
      return new Response(JSON.stringify({
        success: true,
        is_premium: newIsPremium,
        subscription_status: newStatus,
        subscription_end: subscriptionEnd,
        cancelled: isCancelled,
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── Case 2: No purchaseToken → just return current DB state ───────────
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
      return new Response(JSON.stringify({ is_premium: false, subscription_status: 'none' }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Apply grace period logic: cancelled + future end date = still premium
    const rawEnd = sub.subscription_end ? new Date(sub.subscription_end) : null;
    const gracePeriodActive = sub.subscription_status === 'cancelled' && rawEnd && rawEnd > new Date();
    const effectivePremium = sub.is_premium || gracePeriodActive;

    return new Response(JSON.stringify({
      success: true,
      is_premium: effectivePremium,
      subscription_status: sub.subscription_status,
      subscription_end: sub.subscription_end,
      plan_type: sub.plan_type,
      cancelled_active: gracePeriodActive,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("Error in sync-subscription:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
