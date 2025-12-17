import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// CORS + existing send-event-ticket logic
const allowedOrigin = 'https://thanksgivingdinner.vercel.app';
const allowCredentials = false; // set to true only if you need credentialed requests

function corsHeaders(origin = allowedOrigin) {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Expose-Headers': 'Content-Length, X-Kuma-Revision',
  };
  if (allowCredentials) headers['Access-Control-Allow-Credentials'] = 'true';
  return headers;
}

Deno.serve(async (req: Request) => {
  // Determine origin to echo back. For stricter security, only allow exact origin.
  const requestOrigin = req.headers.get('origin') ?? '';
  // If you want to accept only allowedOrigin, keep this check; otherwise set to '*'.
  const originToAllow = requestOrigin === allowedOrigin ? allowedOrigin : allowedOrigin;

  // Preflight response
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(originToAllow),
    });
  }

  try {
    const { firstName, lastName, email } = await req.json();
    console.log('Invoking send-event-ticket for', email);

    const apiKey = Deno.env.get('RESEND_API_KEY') || Deno.env.get('VITE_RESEND_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'missing api key' }), {
        status: 500,
        headers: {
          ...corsHeaders(originToAllow),
          'Content-Type': 'application/json',
        },
      });
    }

    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 't-dinner@resend.dev',
        to: email,
        subject: `Your ticket, ${firstName}`,
        html: `<p>Hello ${firstName} ${lastName},</p><p>Here is your ticket.</p>`,
      }),
    });

    const data = await resp.json().catch(() => null);
    console.log('Resend response', data);

    return new Response(JSON.stringify({ status: resp.status, data }), {
      status: resp.status,
      headers: {
        ...corsHeaders(originToAllow),
        'Content-Type': 'application/json',
      },
    });
  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: err?.message ?? String(err) }), {
      status: 500,
      headers: {
        ...corsHeaders(originToAllow),
        'Content-Type': 'application/json',
      },
    });
  }
});
