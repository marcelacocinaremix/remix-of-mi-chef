import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SyncResult {
  success: boolean;
  is_premium: boolean;
  expiration_date: string | null;
  subscription_status: string;
  plan_type: string | null;
  cancelled_active?: boolean;
}

// ── Retry helper: retries an async fn up to `maxAttempts` with exponential backoff ──
async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  label = "op"
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const isLast = attempt === maxAttempts;
      console.warn(
        `[sync-sub] ${label} attempt ${attempt}/${maxAttempts} failed:`,
        err instanceof Error ? err.message : String(err),
        isLast ? "(giving up)" : `(retrying in ${attempt * 300}ms)`
      );
      if (!isLast) await new Promise((r) => setTimeout(r, attempt * 300));
    }
  }
  throw lastErr;
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

    const tokenRes = await withRetry(
      () => fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
      }),
      3,
      "oauth-token"
    );

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

      const gpRes = await withRetry(
        () => fetch(gpUrl, { headers: { Authorization: `Bearer ${accessToken}` } }),
        3,
        "google-play-validate"
      );

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

      const newStatus = isCancelled ? "cancelled" : isActive ? "active" : "expired";
      const newIsPremium = isActive;

      console.log(`[sync-sub] GP response: expiryMs=${expiryMs} isActive=${isActive} isCancelled=${isCancelled} paymentState=${gpData.paymentState}`);

      // ── Upsert user_subscriptions (with retry) ────────────────────────────
      const { error: upsertError } = await withRetry(
        () => adminClient.from("user_subscriptions").upsert({
          user_id: user.id,
          is_premium: newIsPremium,
          plan_type: newIsPremium ? "premium" : "free",
          subscription_status: newStatus,
          subscription_end: subscriptionEnd,
          subscription_start: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" }),
        3,
        "upsert-subscription"
      );

      if (upsertError) {
        console.error("[sync-sub] DB upsert error:", upsertError);
        return new Response(JSON.stringify({ error: "Failed to sync subscription" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ── Insert into payments table (idempotent via purchaseToken) ─────────
      // Only record when payment is confirmed (paymentState === 1) or unknown (undefined)
      // paymentState 0 = free trial, 1 = paid, 2 = deferred
      const paymentConfirmed = gpData.paymentState === 1 || gpData.paymentState === undefined;
      if (paymentConfirmed && newIsPremium) {
        // Check if this purchaseToken was already recorded to avoid duplicate rows
        const { data: existingPayment } = await adminClient
          .from("payments")
          .select("id")
          .eq("payment_id", purchaseToken.substring(0, 255))
          .maybeSingle();

        if (!existingPayment) {
          const { error: paymentError } = await withRetry(
            () => adminClient.from("payments").insert({
              user_id: user.id,
              amount: 0,  // Amount not available from subscription API; updated via webhook
              status: "approved",
              description: `Google Play subscription - ${googleSubscriptionId}`,
              preference_id: `gplay_${googleSubscriptionId}`,
              payment_id: purchaseToken.substring(0, 255), // used as idempotency key
              external_reference: `${googlePackageName}/${googleSubscriptionId}`,
              paid_at: new Date().toISOString(),
            }),
            3,
            "insert-payment"
          );

          if (paymentError) {
            // Non-fatal: log but don't fail the whole sync
            console.warn("[sync-sub] Payment insert warning (non-fatal):", paymentError.message);
          } else {
            console.log(`✅ [sync-sub] Payment recorded for user=${user.id}`);
          }
        } else {
          console.log(`[sync-sub] Payment already recorded (token duplicate), skipping insert`);
        }
      }

      console.log(`✅ [sync-sub] Synced user=${user.id} status=${newStatus} expires=${subscriptionEnd}`);

      const result: SyncResult = {
        success: true,
        is_premium: newIsPremium,
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
      .select("is_premium, subscription_status, subscription_end, plan_type")
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

    const gracePeriodActive = sub.subscription_status === "cancelled" && !!rawEnd && rawEnd > now;
    const effectivePremium = sub.is_premium || gracePeriodActive;

    const result: SyncResult = {
      success: true,
      is_premium: effectivePremium,
      expiration_date: rawEnd?.toISOString() ?? null,
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
