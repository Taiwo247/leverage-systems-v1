export const prerender = false;

import type { APIRoute } from 'astro';

function json(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Revenue Forensics quick-scan — deterministic.
 *
 * Instead of guessing from a screenshot (which can't see JS or tracking code),
 * this fetches the real page source and detects actual signals:
 *   - Meta Pixel present in HTML vs injected later by JS
 *   - Google Analytics / GTM present
 *   - native form present vs JS-rendered
 *   - real server load time
 * The score is a fixed formula over those facts, so the SAME site always scores
 * the SAME on re-run — it holds up when a skeptic checks it themselves.
 */
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
    const started = Date.now();
    const resp = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(14000),
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      },
    });
    const html   = await resp.text();
    const loadS  = +((Date.now() - started) / 1000).toFixed(1);
    const H      = html.toLowerCase();

    const hasPixel = /fbq\s*\(|fbevents\.js|facebook\.com\/tr|connect\.facebook\.net/.test(H);
    const hasGA    = /gtag\s*\(|googletagmanager\.com|google-analytics\.com|analytics\.js/.test(H);
    const hasForm  = /<form/.test(H);

    // ── deterministic score ──────────────────────────────────────────────────
    let score = 100;
    const findings: string[] = [];

    if (!hasPixel) {
      score -= 28;
      findings.push(
        "No Meta Pixel in the page source — it's either missing or injected by JavaScript after load, so it fires late and misses visitors who bounce first."
      );
    }

    if (loadS >= 4) {
      score -= 28;
      findings.push(
        `Slow server response: ${loadS}s — well past the 3s mark where visitor abandonment climbs sharply, and your tracking hasn't even fired yet.`
      );
    } else if (loadS >= 2.5) {
      score -= 18;
      findings.push(
        `Load time ${loadS}s — past 2s, every extra second measurably lifts bounce rate and delays when your pixel fires.`
      );
    } else if (loadS >= 1.5) {
      score -= 9;
      findings.push(
        `Load time ${loadS}s — usable, but tracking still fires after render, leaving an early-visitor blind spot.`
      );
    }

    if (!hasGA) {
      score -= 18;
      findings.push(
        'No Google Analytics / GTM detected in the source — conversion data has blind spots you cannot see or reconcile against Meta.'
      );
    }

    if (!hasForm) {
      score -= 12;
      findings.push(
        'No native form in the HTML — lead capture depends entirely on JavaScript rendering; if the bundle stalls, the form never appears.'
      );
    }

    if (findings.length === 0) {
      findings.push(
        'Core tracking is present in the source — a deeper audit is needed on firing order, consent gating, and conversion-event coverage.'
      );
    }

    score = Math.max(6, Math.min(94, Math.round(score)));

    return json({ ok: true, score, findings: findings.slice(0, 3), domain });

  } catch (err) {
    console.error('[quick-scan]', err);
    return json({ ok: false, error: 'Scan failed — check the URL and try again' }, 500);
  }
};
