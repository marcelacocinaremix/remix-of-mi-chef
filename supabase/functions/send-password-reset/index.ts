import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PasswordResetRequest {
  email: string;
  redirectUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, redirectUrl }: PasswordResetRequest = await req.json();

    // Validate required fields
    if (!email || !redirectUrl) {
      throw new Error("Email y redirectUrl son requeridos");
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Generate recovery link using admin API with native app scheme
    const nativeRedirectUrl = "app.marcelacocina.michef://reset-password";

    const { data, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: email,
      options: {
        redirectTo: nativeRedirectUrl,
      },
    });

    if (linkError) {
      console.error("Error generating recovery link:", linkError);
      // Don't reveal if email exists or not for security
      return new Response(
        JSON.stringify({
          success: true,
          message: "Si el email existe, recibirás un link de recuperación",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    // Extract the recovery token hash and build links.
    const tokenHash = data.properties?.hashed_token;

    if (!tokenHash) {
      throw new Error("No se pudo generar el token de recuperación");
    }

    // 1) Deep link directo (ideal cuando el cliente de email lo permite)
    const deepLink = `app.marcelacocina.michef://reset-password#type=recovery&token_hash=${encodeURIComponent(tokenHash)}`;

    // 2) Link https puente (Gmail suele bloquear esquemas custom y abre un https intermedio)
    const webBridgeLink = `https://marcelacocinamichef.lovable.app/open-reset-password?type=recovery&token_hash=${encodeURIComponent(tokenHash)}`;

    // Send email via Resend with verified domain
    const emailResponse = await resend.emails.send({
      from: "Mi Chef Personal <noreply@marcelacocina.com>",
      to: [email],
      subject: "Restablecé tu contraseña",
      html: `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Restablecer contraseña</title></head><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: white; border-radius: 12px; padding: 40px;"><tr><td style="text-align: center; padding-bottom: 24px;"><span style="font-size: 32px;">🍳</span><br><span style="color: #1f2937; font-size: 20px; font-weight: 600;">Mi Chef Personal</span></td></tr><tr><td style="color: #374151; font-size: 18px; font-weight: 600; padding-bottom: 16px;">Restablecer contraseña</td></tr><tr><td style="color: #6b7280; font-size: 16px; line-height: 1.6; padding-bottom: 24px;">Recibimos una solicitud para restablecer tu contraseña. Tocá el botón de abajo para abrir la app y crear una nueva:</td></tr><tr><td style="text-align: center; padding: 24px 0;"><a href="${webBridgeLink}" style="background-color: #10b981; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">Restablecer contraseña</a></td></tr><tr><td style="color: #9ca3af; font-size: 13px; line-height: 1.6; padding-top: 16px;">Si el botón no funciona, copiá y pegá este link en tu navegador:<br><a href="${webBridgeLink}" style="color: #10b981; word-break: break-all;">${webBridgeLink}</a></td></tr><tr><td style="color: #9ca3af; font-size: 13px; line-height: 1.6; padding-top: 16px;">Si no solicitaste este cambio, podés ignorar este email. El link expira en 1 hora.</td></tr><tr><td style="border-top: 1px solid #e5e7eb; margin-top: 24px; padding-top: 24px; color: #9ca3af; font-size: 12px; text-align: center;">Mi Chef Personal</td></tr></table></body></html>`,
    });

    console.log("Password reset email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Email de recuperación enviado" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    console.error("Error in send-password-reset function:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
