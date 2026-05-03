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

  const { email = '' } = data;

  if (!EMAIL_RE.test(email)) {
    return json({ ok: false, error: 'Valid email is required' }, 400);
  }

  const webhookUrl = import.meta.env.MAKE_EXIT_WEBHOOK as string | undefined;
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          source:       data.source || 'Exit Intent Popup',
          submitted_at: new Date().toISOString(),
        }),
      });
    } catch {
      // Fail silently
    }
  }

  return json({ ok: true });
};
