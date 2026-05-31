export const prerender = false;

import type { APIRoute } from 'astro';

function json(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POST: APIRoute = async ({ request }) => {
  let url: string, email: string;
  try {
    ({ url, email } = await request.json());
  } catch {
    return json({ ok: false, error: 'Invalid request' }, 400);
  }

  if (!EMAIL_RE.test(email)) return json({ ok: false, error: 'Valid email required' }, 400);
  if (!url?.trim())           return json({ ok: false, error: 'URL required' }, 400);

  if (!url.startsWith('http')) url = 'https://' + url;

  let domain = url;
  try { domain = new URL(url).hostname.replace(/^www\./, ''); } catch {}

  // Fire-and-forget: log to Airtable exit-capture table
  const atKey   = import.meta.env.AIRTABLE_API_KEY   as string | undefined;
  const atBase  = import.meta.env.AIRTABLE_BASE_ID   as string | undefined;
  const atTable = import.meta.env.AIRTABLE_EXIT_TABLE_ID as string | undefined;
  if (atKey && atBase && atTable) {
    fetch(`https://api.airtable.com/v0/${atBase}/${atTable}`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${atKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          Email:         email,
          'Date Captured': new Date().toISOString().split('T')[0],
          Status:        'Score Tool Lead',
          Website:       url,
        },
      }),
    }).catch(e => console.error('[score-submit] airtable:', e));
  }

  // Trigger the full recon pipeline (PDF + email sequence)
  const reconAbort = new AbortController();
  const t = setTimeout(() => reconAbort.abort(), 4000);
  try {
    await fetch('https://leverageengine.vercel.app/api/recon', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_name:  domain,
        url,
        email,
        business_type: 'Score Tool Submission',
        ad_spend:      'Unknown',
        lead_volume:   '',
        crm:           '',
      }),
      signal: reconAbort.signal,
    });
  } catch { /* expected on 4s abort — recon continues independently */ }
  finally { clearTimeout(t); }

  return json({ ok: true });
};
