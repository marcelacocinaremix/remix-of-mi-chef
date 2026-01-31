import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Plan configurations
const PLANS = {
  '1_month': {
    name: 'Mi Chef Premium - 1 Mes',
    price: 5000,
    frequency: 1,
    frequency_type: 'months',
    trial_days: 7,
  },
  '3_months': {
    name: 'Mi Chef Premium - 3 Meses',
    price: 10000,
    frequency: 3,
    frequency_type: 'months',
    trial_days: 7,
  },
  '6_months': {
    name: 'Mi Chef Premium - 6 Meses',
    price: 18000,
    frequency: 6,
    frequency_type: 'months',
    trial_days: 7,
  },
  '12_months': {
    name: 'Mi Chef Premium - 1 Año',
    price: 30000,
    frequency: 12,
    frequency_type: 'months',
    trial_days: 7,
  },
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!mpAccessToken || !supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables');
      throw new Error('Server configuration error');
    }

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      console.error('Auth error:', userError);
      throw new Error('Usuario no autenticado');
    }

    // Get request body
    const { plan_id, include_trial = true } = await req.json();
    
    if (!plan_id || !PLANS[plan_id as keyof typeof PLANS]) {
      throw new Error('Plan inválido');
    }

    const plan = PLANS[plan_id as keyof typeof PLANS];
    
    // Check if user already used trial
    const { data: existingSub } = await supabaseClient
      .from('user_subscriptions')
      .select('trial_used, subscription_status')
      .eq('user_id', user.id)
      .maybeSingle();

    const hasUsedTrial = existingSub?.trial_used === true;
    const trialDays = (include_trial && !hasUsedTrial) ? plan.trial_days : 0;

    console.log(`Creating subscription for user ${user.id}, plan: ${plan_id}, trial: ${trialDays} days`);

    // Build preapproval URL
    const baseUrl = Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app') || 'https://mi-chef.lovable.app';
    const backUrl = `${baseUrl}/payment-processing`;
    
    // Calculate dates
    const now = new Date();
    const startDate = new Date(now);
    if (trialDays > 0) {
      startDate.setDate(startDate.getDate() + trialDays);
    }

    // Create preapproval (subscription) in Mercado Pago
    const preapprovalData = {
      reason: plan.name,
      auto_recurring: {
        frequency: plan.frequency,
        frequency_type: plan.frequency_type,
        transaction_amount: plan.price,
        currency_id: 'ARS',
        start_date: startDate.toISOString(),
        ...(trialDays > 0 && {
          free_trial: {
            frequency: trialDays,
            frequency_type: 'days',
          },
        }),
      },
      payer_email: user.email,
      back_url: backUrl,
      external_reference: `${user.id}|${plan_id}`,
    };

    console.log('Creating MP preapproval:', JSON.stringify(preapprovalData, null, 2));

    const mpResponse = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mpAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preapprovalData),
    });

    const mpResult = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error('MP Error:', mpResult);
      throw new Error(mpResult.message || 'Error al crear suscripción en Mercado Pago');
    }

    console.log('MP Preapproval created:', mpResult.id);

    // Save pending subscription to database
    const { error: dbError } = await supabaseClient
      .from('user_subscriptions')
      .upsert({
        user_id: user.id,
        mp_preapproval_id: mpResult.id,
        plan_type: plan_id,
        subscription_status: 'pending',
        trial_used: trialDays > 0 ? true : (existingSub?.trial_used || false),
        auto_renew: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (dbError) {
      console.error('DB Error:', dbError);
      // Don't throw, subscription was created in MP
    }

    // Also save to payments table for tracking
    await supabaseClient
      .from('payments')
      .insert({
        user_id: user.id,
        preference_id: mpResult.id,
        amount: plan.price,
        status: 'pending',
        description: plan.name,
        external_reference: `${user.id}|${plan_id}`,
      });

    return new Response(
      JSON.stringify({
        success: true,
        init_point: mpResult.init_point,
        sandbox_init_point: mpResult.sandbox_init_point,
        preapproval_id: mpResult.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in create-subscription:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
