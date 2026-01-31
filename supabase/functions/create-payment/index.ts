import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create supabase client with user's token to get user info
    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      console.error('User auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'User not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Creating payment preference for user:', user.id);

    // Generate unique external reference
    const externalReference = `premium_${user.id}_${Date.now()}`;

    // Get the origin for success/failure URLs
    const origin = req.headers.get('origin') || 'https://lovable.dev';

    // Create Mercado Pago preference
    const preferenceData = {
      items: [
        {
          id: 'mi-chef-premium',
          title: 'Mi Chef Premium - Acceso de por vida',
          description: 'Desbloquea todas las funciones de Mi Chef: recetas ilimitadas, plan semanal, historial y más.',
          quantity: 1,
          currency_id: 'ARS',
          unit_price: 7000 // Price in ARS - $7000
        }
      ],
      payer: {
        email: user.email
      },
      external_reference: externalReference,
      back_urls: {
        success: `${origin}/payment-processing`,
        failure: `${origin}/payment-failed`,
        pending: `${origin}/payment-processing`
      },
      auto_return: 'approved',
      notification_url: `${supabaseUrl}/functions/v1/mp-webhook`,
      statement_descriptor: 'MI CHEF PREMIUM'
    };

    console.log('Creating MP preference with data:', JSON.stringify(preferenceData));

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mpAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preferenceData)
    });

    if (!mpResponse.ok) {
      const errorText = await mpResponse.text();
      console.error('Mercado Pago error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to create payment preference', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const preference = await mpResponse.json();
    console.log('MP preference created:', preference.id);

    // Save payment record in database using service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { error: insertError } = await supabaseAdmin
      .from('payments')
      .insert({
        user_id: user.id,
        preference_id: preference.id,
        external_reference: externalReference,
        amount: 7000,
        description: 'Mi Chef Premium - Acceso de por vida',
        status: 'pending'
      });

    if (insertError) {
      console.error('Error saving payment:', insertError);
      // Don't fail the request, the preference is already created
    }

    return new Response(
      JSON.stringify({
        preference_id: preference.id,
        init_point: preference.init_point,
        sandbox_init_point: preference.sandbox_init_point
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-payment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});