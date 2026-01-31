import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature, x-request-id',
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
    // Extract signature parts (format: ts=123456,v1=abc123)
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
    
    // Construct manifest according to Mercado Pago docs
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
    
    // Calculate expected signature
    const hmac = createHmac('sha256', mpWebhookSecret);
    hmac.update(manifest);
    const expectedHash = hmac.digest('hex');
    
    // Timing-safe comparison to prevent timing attacks
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
    
    // Check timestamp to prevent replay attacks (reject if older than 5 minutes)
    const timestampMs = parseInt(ts) * 1000;
    const now = Date.now();
    if (Math.abs(now - timestampMs) > 5 * 60 * 1000) {
      console.error('Webhook timestamp too old, possible replay attack');
      return false;
    }
    
    console.log('Webhook signature verified successfully');
    return true;
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN')!;

    // Also check query params for IPN-style notifications
    const url = new URL(req.url);
    const queryTopic = url.searchParams.get('topic') || url.searchParams.get('type');
    const queryPaymentId = url.searchParams.get('data.id') || url.searchParams.get('id');

    // Log request details for auditing
    console.log('Webhook received from IP:', req.headers.get('x-forwarded-for') || 'unknown');
    console.log('Query params:', { topic: queryTopic, id: queryPaymentId });

    // Parse the webhook notification from body (Mercado Pago sends JSON POST)
    let body: any = {};
    let rawBody = '';
    try {
      rawBody = await req.text();
      console.log('Raw webhook body:', rawBody);
      if (rawBody) {
        body = JSON.parse(rawBody);
      }
    } catch (e) {
      console.log('Error parsing body:', e);
    }

    // Mercado Pago webhook format: { action: "payment.created", type: "payment", data: { id: "123" } }
    const actualTopic = body.action || body.type || queryTopic;
    const actualPaymentId = body.data?.id || body.id || queryPaymentId;

    console.log('Webhook received:', { 
      topic: actualTopic, 
      paymentId: actualPaymentId, 
      action: body.action,
      type: body.type
    });

    // Verify webhook signature for security
    if (actualPaymentId) {
      const isValidSignature = verifyMercadoPagoSignature(req, actualPaymentId.toString());
      if (!isValidSignature) {
        console.error('SECURITY: Webhook signature verification failed - rejecting request');
        return new Response(
          JSON.stringify({ error: 'Invalid webhook signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      console.log('No payment ID to verify signature against');
    }

    // Only process payment notifications
    if (actualTopic !== 'payment' && actualTopic !== 'payment.created' && actualTopic !== 'payment.updated') {
      console.log('Ignoring non-payment notification:', actualTopic);
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    if (!actualPaymentId) {
      console.log('No payment ID in notification');
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    // Get payment details from Mercado Pago
    console.log('Fetching payment details from MP:', actualPaymentId);
    
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${actualPaymentId}`, {
      headers: {
        'Authorization': `Bearer ${mpAccessToken}`
      }
    });

    if (!mpResponse.ok) {
      const errorText = await mpResponse.text();
      console.error('Error fetching payment from MP:', errorText);
      return new Response('Error', { status: 500, headers: corsHeaders });
    }

    const payment = await mpResponse.json();
    console.log('Payment details:', {
      id: payment.id,
      status: payment.status,
      external_reference: payment.external_reference
    });

    // Get the external reference to find the user
    const externalReference = payment.external_reference;
    if (!externalReference) {
      console.error('No external reference in payment');
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    // Create Supabase admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the payment record
    const { data: paymentRecord, error: findError } = await supabase
      .from('payments')
      .select('*')
      .eq('external_reference', externalReference)
      .maybeSingle();

    if (findError) {
      console.error('Error finding payment record:', findError);
      return new Response('Error', { status: 500, headers: corsHeaders });
    }

    if (!paymentRecord) {
      console.error('Payment record not found for:', externalReference);
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    console.log('Found payment record:', paymentRecord.id, 'for user:', paymentRecord.user_id);

    // Idempotency check - don't process already approved payments
    if (paymentRecord.status === 'approved' && paymentRecord.paid_at) {
      console.log('Payment already processed (idempotency check), skipping:', paymentRecord.id);
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    // Update payment record
    const updateData: any = {
      payment_id: payment.id.toString(),
      status: payment.status,
      updated_at: new Date().toISOString()
    };

    if (payment.status === 'approved') {
      updateData.paid_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', paymentRecord.id);

    if (updateError) {
      console.error('Error updating payment record:', updateError);
    }

    // If payment is approved, activate premium
    if (payment.status === 'approved') {
      console.log('Payment approved! Activating premium for user:', paymentRecord.user_id);

      const { error: premiumError } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: paymentRecord.user_id,
          is_premium: true,
          unlocked_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (premiumError) {
        console.error('Error activating premium:', premiumError);
        return new Response('Error', { status: 500, headers: corsHeaders });
      }

      console.log('Premium activated successfully!');
    } else {
      console.log('Payment status is:', payment.status, '- Premium NOT activated');
    }

    return new Response('OK', { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Error in mp-webhook:', error);
    return new Response('Error', { status: 500, headers: corsHeaders });
  }
});
