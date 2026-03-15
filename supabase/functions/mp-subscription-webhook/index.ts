import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature, x-request-id',
};

// Plan durations in months
const PLAN_DURATIONS: Record<string, number> = {
  '1_month': 1,
  '3_months': 3,
  '6_months': 6,
  '12_months': 12,
};

// Verify Mercado Pago webhook signature
const verifyMercadoPagoSignature = (req: Request, dataId: string): boolean => {
  const xSignature = req.headers.get('x-signature');
  const xRequestId = req.headers.get('x-request-id');
  
  if (!xSignature || !xRequestId) {
    console.error('Missing Mercado Pago signature headers');
    return false;
  }
  
  const mpWebhookSecret = Deno.env.get('MP_WEBHOOK_SECRET');
  if (!mpWebhookSecret) {
    console.error('MP_WEBHOOK_SECRET not configured - rejecting webhook for security');
    return false;
  }
  
  try {
    const signatureParts: Record<string, string> = {};
    xSignature.split(',').forEach(part => {
      const [key, value] = part.split('=');
      if (key && value) {
        signatureParts[key.trim()] = value.trim();
      }
    });
    
    const ts = signatureParts['ts'];
    const hash = signatureParts['v1'];
    
    if (!ts || !hash) {
      console.error('Invalid signature format - missing ts or v1');
      return false;
    }
    
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
    const hmac = createHmac('sha256', mpWebhookSecret);
    hmac.update(manifest);
    const expectedHash = hmac.digest('hex');
    
    if (hash.length !== expectedHash.length) {
      console.error('Signature length mismatch');
      return false;
    }
    
    let isValid = true;
    for (let i = 0; i < hash.length; i++) {
      if (hash[i] !== expectedHash[i]) {
        isValid = false;
      }
    }
    
    if (!isValid) {
      console.error('Invalid webhook signature - hash mismatch');
      return false;
    }
    
    const timestampMs = parseInt(ts) * 1000;
    const now = Date.now();
    if (Math.abs(now - timestampMs) > 5 * 60 * 1000) {
      console.error('Webhook timestamp too old, possible replay attack');
      return false;
    }
    
    console.log('Subscription webhook signature verified successfully');
    return true;
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!mpAccessToken || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables');
    }

    console.log('Subscription webhook received from IP:', req.headers.get('x-forwarded-for') || 'unknown');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json();

    console.log('Webhook received:', JSON.stringify(body, null, 2));

    const { type, data } = body;
    const dataId = data?.id?.toString();

    if (dataId) {
      const isValidSignature = verifyMercadoPagoSignature(req, dataId);
      if (!isValidSignature) {
        console.error('SECURITY: Subscription webhook signature verification failed - rejecting request');
        return new Response(
          JSON.stringify({ error: 'Invalid webhook signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      console.error('No data ID in webhook payload - rejecting for security');
      return new Response(
        JSON.stringify({ error: 'Missing data ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (type === 'subscription_preapproval') {
      const preapprovalId = data.id;
      
      const mpResponse = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
        headers: { 'Authorization': `Bearer ${mpAccessToken}` },
      });

      if (!mpResponse.ok) {
        console.error('Failed to fetch preapproval from MP');
        throw new Error('Failed to fetch preapproval');
      }

      const preapproval = await mpResponse.json();
      console.log('Preapproval status:', preapproval.status, 'external_reference:', preapproval.external_reference);

      const externalReference = preapproval.external_reference || '';
      const [userId, planId] = externalReference.split('|');

      if (!userId) {
        console.error('No user ID in external reference');
        throw new Error('Invalid external reference');
      }

      const status = preapproval.status;
      const planDuration = PLAN_DURATIONS[planId] || 1;
      
      const now = new Date();
      let subscriptionEnd = new Date(now);
      subscriptionEnd.setMonth(subscriptionEnd.getMonth() + planDuration);

      // Map MP status to our internal status
      let subscriptionStatus = 'pending';
      let isPremium = false;

      switch (status) {
        case 'authorized':
        case 'active':
          subscriptionStatus = 'active';
          isPremium = true;
          break;
        case 'paused':
          subscriptionStatus = 'paused';
          isPremium = true; // Still premium while paused
          break;
        case 'cancelled':
          // IMPORTANT: On cancellation, keep is_premium = true until subscription_end.
          // The client-side usePremium hook checks subscription_end to determine access.
          subscriptionStatus = 'cancelled';
          isPremium = true; // Access continues until subscription_end date
          break;
        case 'pending':
          subscriptionStatus = 'pending';
          isPremium = false;
          break;
        default:
          subscriptionStatus = status;
      }

      console.log(`Updating subscription for user ${userId}: MP status=${status}, internal status=${subscriptionStatus}, premium=${isPremium}`);

      // FIRST: check existing subscription to preserve trial fields
      const { data: existingSub } = await supabase
        .from('user_subscriptions')
        .select('trial_used, trial_start_date, trial_end_date, subscription_end, is_premium')
        .eq('user_id', userId)
        .maybeSingle();

      // For cancelled: keep the existing subscription_end if it's in the future
      // (don't shorten the paid period the user already paid for)
      let finalSubscriptionEnd: string | null = null;
      if (isPremium) {
        if (status === 'cancelled' && existingSub?.subscription_end) {
          // Keep existing end date (don't cut short a paid period)
          finalSubscriptionEnd = existingSub.subscription_end;
        } else if (status === 'cancelled') {
          // No existing end date but cancelling — keep current period
          finalSubscriptionEnd = subscriptionEnd.toISOString();
        } else {
          // Active/authorized: set new end date
          finalSubscriptionEnd = subscriptionEnd.toISOString();
        }
      }

      // Build update object — PRESERVE trial fields (never overwrite them)
      // plan_type is always 'premium' when the user has a paid subscription
      const updateData: Record<string, unknown> = {
        mp_preapproval_id: preapprovalId,
        mp_subscription_id: preapproval.id,
        plan_type: isPremium ? 'premium' : 'free',
        subscription_status: subscriptionStatus,
        subscription_start: isPremium && status !== 'cancelled'
          ? now.toISOString()
          : existingSub?.subscription_end ?? null,
        subscription_end: finalSubscriptionEnd,
        is_premium: isPremium,
        unlocked_at: isPremium ? (existingSub?.subscription_end ? undefined : now.toISOString()) : null,
        updated_at: now.toISOString(),
        // CRITICAL: preserve trial fields — NEVER overwrite them
        ...(existingSub?.trial_used !== undefined && { trial_used: existingSub.trial_used }),
        ...(existingSub?.trial_start_date !== undefined && { trial_start_date: existingSub.trial_start_date }),
        ...(existingSub?.trial_end_date !== undefined && { trial_end_date: existingSub.trial_end_date }),
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) delete updateData[key];
      });

      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: userId,
          ...updateData,
        }, {
          onConflict: 'user_id',
        });

      if (updateError) {
        console.error('Failed to update subscription:', updateError);
        throw updateError;
      }

      // Update payment record
      await supabase
        .from('payments')
        .update({
          status: isPremium ? 'approved' : status,
          payment_id: preapprovalId,
          paid_at: isPremium ? now.toISOString() : null,
          updated_at: now.toISOString(),
        })
        .eq('preference_id', preapprovalId);

      console.log(`✅ Subscription updated for user ${userId}: status=${subscriptionStatus}, premium=${isPremium}, end=${finalSubscriptionEnd}`);

    } else if (type === 'subscription_authorized_payment') {
      const paymentId = data.id;
      
      console.log('Subscription payment received:', paymentId);

      const mpResponse = await fetch(`https://api.mercadopago.com/authorized_payments/${paymentId}`, {
        headers: { 'Authorization': `Bearer ${mpAccessToken}` },
      });

      if (mpResponse.ok) {
        const payment = await mpResponse.json();
        console.log('Payment status:', payment.status, 'preapproval_id:', payment.preapproval_id);

        if (payment.status === 'approved' && payment.preapproval_id) {
          const { data: subData } = await supabase
            .from('user_subscriptions')
            .select('*')
            .eq('mp_preapproval_id', payment.preapproval_id)
            .maybeSingle();

          if (subData) {
            const planDuration = PLAN_DURATIONS[subData.plan_type] || 1;
            const currentEnd = subData.subscription_end ? new Date(subData.subscription_end) : new Date();
            const newEnd = new Date(Math.max(currentEnd.getTime(), Date.now()));
            newEnd.setMonth(newEnd.getMonth() + planDuration);

            await supabase
              .from('user_subscriptions')
              .update({
                subscription_end: newEnd.toISOString(),
                is_premium: true,
                subscription_status: 'active',
                updated_at: new Date().toISOString(),
                // Preserve trial fields — never overwrite them
                trial_used: subData.trial_used,
                trial_start_date: subData.trial_start_date,
                trial_end_date: subData.trial_end_date,
              })
              .eq('user_id', subData.user_id);

            console.log(`✅ Extended subscription for user ${subData.user_id} until ${newEnd.toISOString()}`);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
