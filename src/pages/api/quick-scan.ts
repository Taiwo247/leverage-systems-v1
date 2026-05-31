export const prerender = false;

import type { APIRoute } from 'astro';
import Anthropic from '@anthropic-ai/sdk';

function json(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request }) => {
  let rawUrl: string;
  try {
    ({ url: rawUrl } = await request.json());
  } catch {
    return json({ ok: false, error: 'Invalid request' }, 400);
  }

  if (!rawUrl?.trim()) return json({ ok: false, error: 'URL is required' }, 400);

  let url = rawUrl.trim();
  if (!url.startsWith('http')) url = 'https://' + url;

  let domain = url;
  try { domain = new URL(url).hostname.replace(/^www\./, ''); } catch {}

  try {
    // Screenshot via thum.io (same service used by the main recon pipeline)
    const screenshotUrl =
      `https://image.thum.io/get/width/1280/crop/800/noanimate/${encodeURIComponent(url)}`;
    const imgResp = await fetch(screenshotUrl, { signal: AbortSignal.timeout(14000) });
    if (!imgResp.ok) throw new Error(`thum.io ${imgResp.status}`);

    const imgBuffer = await imgResp.arrayBuffer();
    const base64    = Buffer.from(imgBuffer).toString('base64');

    const client = new Anthropic({
      apiKey: import.meta.env.ANTHROPIC_API_KEY as string,
    });

    const message = await client.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 320,
      system:
        'You are a revenue forensics analyst. Analyze website screenshots for conversion failures and revenue leaks. ' +
        'Respond with valid JSON only — no markdown, no extra text.',
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/jpeg', data: base64 },
          },
          {
            type: 'text',
            text: `Score this website 0–100 on revenue health.
Rubric: tracking pixels (0–25), page speed signals (0–35), visual conversion quality (0–40).
Use the full range — do not cluster around 50.

Return exactly this JSON:
{
  "score": <integer>,
  "findings": [
    "<specific revenue leak with a concrete number or impact — max 14 words>",
    "<specific conversion blocker — what element is broken and why — max 14 words>",
    "<specific infrastructure gap costing leads daily — max 14 words>"
  ]
}`,
          },
        ],
      }],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text : '';
    const result = JSON.parse(raw.replace(/```json|```/g, '').trim());

    return json({ ok: true, score: result.score, findings: result.findings, domain });

  } catch (err) {
    console.error('[quick-scan]', err);
    return json({ ok: false, error: 'Scan failed — check the URL and try again' }, 500);
  }
};
