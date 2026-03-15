import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Validates a Google Play purchase token against the Android Publisher API.
 * Returns the subscription details if valid, or null if invalid.
 */
async function validateGooglePlayPurchase(
  packageName: string,
  subscriptionId: string,
  purchaseToken: string,
  accessToken: string
): Promise<{ expiryTimeMillis: string; paymentState: number; acknowledgementState: number } | null> {
  try {
    const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/subscriptions/${subscriptionId}/tokens/${purchaseToken}`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google Play validation failed:", response.status, errorText);
      return null;
    }

    const data = await response.json();
    return {
      expiryTimeMillis: data.expiryTimeMillis,
      paymentState: data.paymentState,
      acknowledgementState: data.acknowledgementState ?? 0,
    };
  } catch (err) {
    console.error("Error calling Google Play API:", err);
    return null;
  }
}

/**
 * Acknowledges a Google Play subscription purchase.
 * REQUIRED by Google Play: purchases must be acknowledged within 3 days
 * or they are automatically cancelled and refunded.
 */
async function acknowledgeGooglePlayPurchase(
  packageName: string,
  subscriptionId: string,
  purchaseToken: string,
  accessToken: string
): Promise<boolean> {
  try {
    const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/subscriptions/${subscriptionId}/tokens/${purchaseToken}:acknowledge`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ developerPayload: "" }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google Play acknowledge failed:", response.status, errorText);
      return false;
    }

    // 204 No Content = success
    console.log("✅ Purchase acknowledged successfully");
    return true;
  } catch (err) {
    console.error("Error acknowledging Google Play purchase:", err);
    return false;
  }
}

/**
 * Gets an OAuth2 access token from a Google service account key.
 */
async function getGoogleAccessToken(serviceAccountKey: string): Promise<string | null> {
  try {
    const key = JSON.parse(serviceAccountKey);

    // Build JWT
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

    // Import the RSA private key
    const pemContent = key.private_key
      .replace("-----BEGIN PRIVATE KEY-----", "")
      .replace("-----END PRIVATE KEY-----", "")
      .replace(/\n/g, "");
    const binaryKey = Uint8Array.from(atob(pemContent), (c) => c.charCodeAt(0));

    const cryptoKey = await crypto.subtle.importKey(
      "pkcs8",
      binaryKey,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      cryptoKey,
      encoder.encode(signInput)
    );

    const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

    const jwt = `${signInput}.${signatureB64}`;

    // Exchange JWT for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Failed to get Google access token:", errorText);
      return null;
    }

    const tokenData = await tokenResponse.json();
    return tokenData.access_token;
  } catch (err) {
    console.error("Error getting Google access token:", err);
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

    // Verify the user is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create client with user's token to get their ID
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid user" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const purchaseToken = body.purchaseToken;

    // SECURITY: purchaseToken is REQUIRED — no token means no purchase to validate
    if (!purchaseToken || typeof purchaseToken !== "string" || purchaseToken.trim().length === 0) {
      console.error(`❌ Missing purchaseToken for user ${user.id}`);
      return new Response(JSON.stringify({ error: "Purchase token is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // SECURITY: Validate against Google Play API
    if (!googleServiceAccountKey || !googlePackageName || !googleSubscriptionId) {
      console.error("❌ Missing Google Play configuration secrets");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accessToken = await getGoogleAccessToken(googleServiceAccountKey);
    if (!accessToken) {
      console.error("❌ Failed to obtain Google API access token");
      return new Response(JSON.stringify({ error: "Purchase validation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const purchaseData = await validateGooglePlayPurchase(
      googlePackageName,
      googleSubscriptionId,
      purchaseToken.trim(),
      accessToken
    );

    if (!purchaseData) {
      console.error(`❌ Invalid purchase token for user ${user.id}`);
      return new Response(JSON.stringify({ error: "Invalid or expired purchase" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // SECURITY: Derive subscription end date ONLY from Google Play response
    const subscriptionEnd = new Date(parseInt(purchaseData.expiryTimeMillis, 10)).toISOString();

    // REQUIRED by Google Play: acknowledge the purchase within 3 days or it gets
    // automatically cancelled and refunded. Only acknowledge if not already acknowledged.
    if (purchaseData.acknowledgementState === 0) {
      console.log(`Acknowledging purchase for user ${user.id}...`);
      const acknowledged = await acknowledgeGooglePlayPurchase(
        googlePackageName,
        googleSubscriptionId,
        purchaseToken.trim(),
        accessToken
      );
      if (!acknowledged) {
        // Log the error but don't block — activation still proceeds.
        // Google Play gives 3 days; next call will retry.
        console.error("⚠️ Purchase acknowledgement failed — will retry on next confirm call");
      }
    } else {
      console.log("Purchase already acknowledged, skipping acknowledgement");
    }

    // Use service role to bypass RLS
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Preserve existing trial fields when activating premium
    const { data: existingSub } = await adminClient
      .from("user_subscriptions")
      .select("trial_used, trial_start_date, trial_end_date")
      .eq("user_id", user.id)
      .maybeSingle();

    const { error: updateError } = await adminClient
      .from("user_subscriptions")
      .upsert({
        user_id: user.id,
        is_premium: true,
        plan_type: "premium",
        subscription_status: "active",
        subscription_start: new Date().toISOString(),
        subscription_end: subscriptionEnd,
        updated_at: new Date().toISOString(),
        // CRITICAL: preserve trial fields — never overwrite them
        ...(existingSub?.trial_used !== undefined && { trial_used: existingSub.trial_used }),
        ...(existingSub?.trial_start_date && { trial_start_date: existingSub.trial_start_date }),
        ...(existingSub?.trial_end_date && { trial_end_date: existingSub.trial_end_date }),
      }, { onConflict: "user_id" });

    if (updateError) {
      console.error("Error updating subscription:", updateError);
      return new Response(JSON.stringify({ error: "Failed to update subscription" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`✅ Premium activated for user ${user.id}, expires: ${subscriptionEnd}`);

    return new Response(JSON.stringify({ success: true, is_premium: true, subscription_end: subscriptionEnd }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error in confirm-purchase:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
