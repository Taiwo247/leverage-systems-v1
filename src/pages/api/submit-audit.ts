export const prerender = false;

import type { APIRoute } from 'astro';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request }) => {
  // Only accept POST with JSON body
  const ct = request.headers.get('content-type') ?? '';
  if (!ct.includes('application/json')) {
    return json({ ok: false, error: 'Unsupported content type' }, 415);
  }

  let data: Record<string, string>;
  try {
    data = await request.json();
  } catch {
    return json({ ok: false, error: 'Invalid JSON' }, 400);
  }

  const { email = '', name = '' } = data;

  if (!name.trim()) {
    return json({ ok: false, error: 'name is required' }, 400);
  }
  if (!EMAIL_RE.test(email)) {
    return json({ ok: false, error: 'Valid email is required' }, 400);
  }

  // Forward to Zapier (server-side — URL never exposed to the browser)
  const webhookUrl = import.meta.env.MAKE_AUDIT_WEBHOOK as string | undefined;
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone:         data.phone         || '',
          website:       data.website       || '',
          business_type: data.business_type || '',
          ad_spend:      data.ad_spend      || '',
          lead_volume:   data.lead_volume   || '',
          crm:           data.crm           || '',
          source:        'Revenue Audit Form',
          submitted_at:  new Date().toISOString(),
        }),
      });
    } catch {
      // Webhook failure must never break the user-facing confirmation
    }
  }

  return json({ ok: true });
};
