export const prerender = false;

import type { APIRoute } from 'astro';
import { Resend } from 'resend';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const AD_SPEND_LABELS: Record<string, string> = {
  '0-5k':    '$0 – $5K / mo',
  '5-15k':   '$5K – $15K / mo',
  '15-50k':  '$15K – $50K / mo',
  '50-100k': '$50K – $100K / mo',
  '100k+':   '$100K+ / mo',
};

const BUSINESS_LABELS: Record<string, string> = {
  coaching:    'Coaching / Consulting',
  agency:      'Marketing Agency',
  saas:        'SaaS / Software',
  ecom:        'E-commerce / DTC',
  'real-estate': 'Real Estate',
  other:       'Other High-Ticket',
};

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

  const { email = '', name = '' } = data;

  if (!name.trim()) return json({ ok: false, error: 'name is required' }, 400);
  if (!EMAIL_RE.test(email)) return json({ ok: false, error: 'Valid email is required' }, 400);

  const businessLabel = BUSINESS_LABELS[data.business_type] || data.business_type || 'Not specified';
  const adSpendLabel  = AD_SPEND_LABELS[data.ad_spend]     || data.ad_spend     || 'Not specified';
  const submittedAt   = new Date().toISOString();

  // ── 1. Forward to Make.com (fire-and-forget) ────────────────────────────
  const makeWebhook = import.meta.env.MAKE_AUDIT_WEBHOOK as string | undefined;
  if (makeWebhook) {
    fetch(makeWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        phone:         data.phone         || '',
        website:       data.website       || '',
        business_type: businessLabel,
        ad_spend:      adSpendLabel,
        lead_volume:   data.lead_volume   || '',
        crm:           data.crm           || '',
        source:        'Revenue Audit Form',
        submitted_at:  submittedAt,
      }),
    }).catch(() => {});
  }

  // ── 2. Resend emails ─────────────────────────────────────────────────────
  const resendKey   = import.meta.env.RESEND_API_KEY as string | undefined;
  const ownerEmail  = (import.meta.env.OWNER_EMAIL  as string | undefined) || 'taiwolanre247@gmail.com';
  const fromAddress = (import.meta.env.FROM_EMAIL   as string | undefined) || 'onboarding@resend.dev';

  if (resendKey) {
    const resend = new Resend(resendKey);

    // Lead confirmation email
    resend.emails.send({
      from: `LeverageSystems <${fromAddress}>`,
      to:   email,
      subject: 'Your Revenue Audit is Being Reviewed — LeverageSystems',
      html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:'Inter',Helvetica,Arial,sans-serif;color:#ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#111111;border:1px solid rgba(212,175,55,0.25);border-radius:4px;overflow:hidden;">

        <!-- Gold top bar -->
        <tr><td height="2" style="background:linear-gradient(to right,transparent,#D4AF37,transparent);"></td></tr>

        <!-- Header -->
        <tr><td style="padding:36px 36px 24px;border-bottom:1px solid rgba(255,255,255,0.06);">
          <p style="margin:0;font-size:11px;font-family:monospace;text-transform:uppercase;letter-spacing:0.12em;color:rgba(212,175,55,0.6);">LeverageSystems</p>
          <h1 style="margin:12px 0 0;font-size:24px;font-weight:900;letter-spacing:-0.03em;color:#ffffff;line-height:1.2;">Audit Received.<br/>The Machine is Moving.</h1>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:28px 36px;">
          <p style="margin:0 0 16px;font-size:15px;color:rgba(255,255,255,0.6);line-height:1.7;">Hi ${name},</p>
          <p style="margin:0 0 24px;font-size:15px;color:rgba(255,255,255,0.6);line-height:1.7;">
            Your Revenue Audit has been received and our system is already analyzing your conversion architecture.
          </p>

          <!-- What happens next -->
          <p style="margin:0 0 16px;font-size:11px;font-family:monospace;text-transform:uppercase;letter-spacing:0.1em;color:rgba(255,255,255,0.3);">What happens next</p>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr><td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
              <span style="color:#D4AF37;font-weight:700;font-size:13px;">01</span>
              <span style="font-size:14px;color:rgba(255,255,255,0.7);margin-left:12px;">AI analysis of your business profile — complete in &lt;30s</span>
            </td></tr>
            <tr><td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
              <span style="color:#00FF41;font-weight:700;font-size:13px;">02</span>
              <span style="font-size:14px;color:rgba(255,255,255,0.7);margin-left:12px;">Your personal Revenue Leakage Report — delivered within 24 hours</span>
            </td></tr>
            <tr><td style="padding:12px 0;">
              <span style="color:#D4AF37;font-weight:700;font-size:13px;">03</span>
              <span style="font-size:14px;color:rgba(255,255,255,0.7);margin-left:12px;">Strategy call to walk through your findings and build your infrastructure plan</span>
            </td></tr>
          </table>

          <p style="margin:0 0 28px;font-size:14px;color:rgba(255,255,255,0.45);line-height:1.7;">
            Questions before then? Reply directly to this email.
          </p>

          <!-- CTA -->
          <table cellpadding="0" cellspacing="0"><tr><td style="background:#00FF41;border-radius:3px;">
            <a href="https://leveragesystems.ai/#diagnostic" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:800;color:#000000;text-decoration:none;letter-spacing:-0.01em;">
              View Your Audit Status →
            </a>
          </td></tr></table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 36px;border-top:1px solid rgba(255,255,255,0.06);">
          <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.2);font-family:monospace;">
            © ${new Date().getFullYear()} LeverageSystems. AI Sales Infrastructure.<br/>
            You submitted a Revenue Audit at leveragesystems.ai
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
    }).catch(() => {});

    // Owner notification
    resend.emails.send({
      from: `LeverageSystems <${fromAddress}>`,
      to:   ownerEmail,
      subject: `New Revenue Audit — ${name} (${adSpendLabel})`,
      html: `
<html><body style="font-family:monospace;background:#0A0A0A;color:#fff;padding:24px;">
  <h2 style="color:#D4AF37;margin:0 0 20px;">New Revenue Audit Submission</h2>
  <table style="border-collapse:collapse;width:100%;">
    <tr><td style="padding:8px 0;border-bottom:1px solid #222;color:#888;width:140px;">Name</td><td style="padding:8px 0;border-bottom:1px solid #222;">${name}</td></tr>
    <tr><td style="padding:8px 0;border-bottom:1px solid #222;color:#888;">Email</td><td style="padding:8px 0;border-bottom:1px solid #222;"><a href="mailto:${email}" style="color:#00FF41;">${email}</a></td></tr>
    <tr><td style="padding:8px 0;border-bottom:1px solid #222;color:#888;">Phone</td><td style="padding:8px 0;border-bottom:1px solid #222;">${data.phone || '—'}</td></tr>
    <tr><td style="padding:8px 0;border-bottom:1px solid #222;color:#888;">Website</td><td style="padding:8px 0;border-bottom:1px solid #222;">${data.website || '—'}</td></tr>
    <tr><td style="padding:8px 0;border-bottom:1px solid #222;color:#888;">Business Type</td><td style="padding:8px 0;border-bottom:1px solid #222;">${businessLabel}</td></tr>
    <tr><td style="padding:8px 0;border-bottom:1px solid #222;color:#888;">Ad Spend</td><td style="padding:8px 0;border-bottom:1px solid #222;color:#D4AF37;font-weight:bold;">${adSpendLabel}</td></tr>
    <tr><td style="padding:8px 0;border-bottom:1px solid #222;color:#888;">Lead Volume</td><td style="padding:8px 0;border-bottom:1px solid #222;">${data.lead_volume || '—'}</td></tr>
    <tr><td style="padding:8px 0;border-bottom:1px solid #222;color:#888;">CRM</td><td style="padding:8px 0;border-bottom:1px solid #222;">${data.crm || '—'}</td></tr>
    <tr><td style="padding:8px 0;color:#888;">Submitted</td><td style="padding:8px 0;">${submittedAt}</td></tr>
  </table>
</body></html>`,
    }).catch(() => {});
  }

  return json({ ok: true });
};
