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

  // ── 1. Forward to Make.com ───────────────────────────────────────────────
  const makeWebhook = import.meta.env.MAKE_AUDIT_WEBHOOK as string | undefined;
  if (makeWebhook) {
    await fetch(makeWebhook, {
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
    }).catch(e => console.error('[submit-audit] make webhook error:', e));
  }

  // ── 2. Resend emails ─────────────────────────────────────────────────────
  const resendKey   = import.meta.env.RESEND_API_KEY as string | undefined;
  const ownerEmail  = (import.meta.env.OWNER_EMAIL  as string | undefined) || 'taiwolanre247@gmail.com';
  const fromAddress = (import.meta.env.FROM_EMAIL   as string | undefined) || 'onboarding@resend.dev';

  console.log('[submit-audit] resendKey present:', !!resendKey);
  console.log('[submit-audit] fromAddress:', fromAddress);

  if (resendKey) {
    const resend = new Resend(resendKey);

    const t25min = new Date(Date.now() + 25 * 60 * 1000).toISOString();
    const t4h    = new Date(Date.now() + 4  * 60 * 60 * 1000).toISOString();
    const t48h   = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    const [leadResult, ownerResult] = await Promise.allSettled([
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
        <tr><td height="2" style="background:linear-gradient(to right,transparent,#D4AF37,transparent);"></td></tr>
        <tr><td style="padding:36px 36px 24px;border-bottom:1px solid rgba(255,255,255,0.06);">
          <p style="margin:0;font-size:11px;font-family:monospace;text-transform:uppercase;letter-spacing:0.12em;color:rgba(212,175,55,0.6);">LeverageSystems</p>
          <h1 style="margin:12px 0 0;font-size:24px;font-weight:900;letter-spacing:-0.03em;color:#ffffff;line-height:1.2;">Audit Received.<br/>The Machine is Moving.</h1>
        </td></tr>
        <tr><td style="padding:28px 36px;">
          <p style="margin:0 0 16px;font-size:15px;color:rgba(255,255,255,0.6);line-height:1.7;">Hi ${name},</p>
          <p style="margin:0 0 24px;font-size:15px;color:rgba(255,255,255,0.6);line-height:1.7;">
            Your Revenue Audit has been received and our system is already analyzing your conversion architecture.
          </p>
          <p style="margin:0 0 16px;font-size:11px;font-family:monospace;text-transform:uppercase;letter-spacing:0.1em;color:rgba(255,255,255,0.3);">What happens next</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr><td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
              <span style="color:#D4AF37;font-weight:700;font-size:13px;">01</span>
              <span style="font-size:14px;color:rgba(255,255,255,0.7);margin-left:12px;">AI analysis of your business profile — complete in &lt;30s</span>
            </td></tr>
            <tr><td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
              <span style="color:#00FF41;font-weight:700;font-size:13px;">02</span>
              <span style="font-size:14px;color:rgba(255,255,255,0.7);margin-left:12px;">Your complete Revenue Forensics Briefing — arriving in your inbox within 10 minutes</span>
            </td></tr>
            <tr><td style="padding:12px 0;">
              <span style="color:#D4AF37;font-weight:700;font-size:13px;">03</span>
              <span style="font-size:14px;color:rgba(255,255,255,0.7);margin-left:12px;">Strategy call to walk through your findings and build your infrastructure plan</span>
            </td></tr>
          </table>
          <p style="margin:0 0 28px;font-size:14px;color:rgba(255,255,255,0.45);line-height:1.7;">
            Questions before then? Reply directly to this email.
          </p>
          <table cellpadding="0" cellspacing="0"><tr><td style="background:#00FF41;border-radius:3px;">
            <a href="https://leveragesystems.ai/audit-status?t=${Date.now()}" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:800;color:#000000;text-decoration:none;letter-spacing:-0.01em;">
              View Your Audit Status →
            </a>
          </td></tr></table>
        </td></tr>
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
      }),

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
      }),
    ]);

    console.log('[submit-audit] lead email:', leadResult.status, leadResult.status === 'fulfilled' ? JSON.stringify(leadResult.value) : leadResult.reason);
    console.log('[submit-audit] owner email:', ownerResult.status, ownerResult.status === 'fulfilled' ? JSON.stringify(ownerResult.value) : ownerResult.reason);

    // ── Airtable logging ─────────────────────────────────────────────────────
    const atKey   = import.meta.env.AIRTABLE_API_KEY        as string | undefined;
    const atBase  = import.meta.env.AIRTABLE_BASE_ID        as string | undefined;
    const atTable = import.meta.env.AIRTABLE_EXIT_TABLE_ID  as string | undefined;
    if (atKey && atBase && atTable) {
      fetch(`https://api.airtable.com/v0/${atBase}/${atTable}`, {
        method:  'POST',
        headers: { 'Authorization': `Bearer ${atKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            'Email':         email,
            'Name':          name,
            'Website':       data.website    || '',
            'Business Type': businessLabel,
            'Ad Spend':      adSpendLabel,
            'Date Captured': submittedAt,
            'Status':        'Audit Form Lead',
          },
        }),
      }).catch(e => console.error('[submit-audit] airtable error:', e));
    }

    // ── 3. Trigger recon pipeline AFTER confirmation emails are queued ───────
    // Await with 4s abort: ensures the request body is delivered to the recon
    // serverless function. Once received, recon runs independently — the abort
    // does not terminate the recon function.
    const websiteUrl = data.website?.trim();
    if (websiteUrl) {
      const reconAbort = new AbortController();
      const reconTimer = setTimeout(() => reconAbort.abort(), 4000);
      try {
        await fetch('https://leverageengine.vercel.app/api/recon', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
          company_name:  name,
          url:           websiteUrl,
          email,
          business_type: businessLabel,
          ad_spend:      adSpendLabel,
          lead_volume:   data.lead_volume || '',
          crm:           data.crm         || '',
        }),
          signal:  reconAbort.signal,
        });
      } catch { /* expected on 4s abort — recon function continues independently */ }
      finally { clearTimeout(reconTimer); }
    }

    // ── Follow-up sequence (fire-and-forget) ────────────────────────────────
    const auditStatusUrl = `https://leveragesystems.ai/audit-status?t=${Date.now()}`;
    const bookingUrl     = 'https://calendly.com/evyn-leverage/20min';

    resend.emails.send({
      from:        `Elena Thorne — LeverageSystems <${fromAddress}>`,
      to:          email,
      subject:     `${name}, your Revenue Leakage Report is ready`,
      scheduledAt: t25min,
      html: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:'Inter',Helvetica,Arial,sans-serif;color:#fff;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;">
<tr><td align="center" style="padding:40px 20px;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#111;border:1px solid rgba(0,255,65,0.2);border-radius:4px;overflow:hidden;">
  <tr><td height="2" style="background:linear-gradient(to right,transparent,#00FF41,transparent);"></td></tr>
  <tr><td style="padding:36px 36px 24px;border-bottom:1px solid rgba(255,255,255,0.06);">
    <p style="margin:0;font-size:11px;font-family:monospace;text-transform:uppercase;letter-spacing:0.12em;color:rgba(0,255,65,0.5);">LeverageSystems · Report Ready</p>
    <h1 style="margin:12px 0 0;font-size:24px;font-weight:900;letter-spacing:-0.03em;color:#fff;line-height:1.2;">Your Revenue Leakage<br/>Report is in your inbox.</h1>
  </td></tr>
  <tr><td style="padding:28px 36px;">
    <p style="margin:0 0 20px;font-size:15px;color:rgba(255,255,255,0.6);line-height:1.7;">Hi ${name},</p>
    <p style="margin:0 0 20px;font-size:15px;color:rgba(255,255,255,0.6);line-height:1.7;">
      The scan is complete. I've gone through your conversion architecture and compiled your findings.
      The report covers where your paid traffic is leaking, what's blocking your close rate, and the exact infrastructure gaps costing you revenue right now.
    </p>
    <p style="margin:0 0 28px;font-size:15px;color:rgba(255,255,255,0.6);line-height:1.7;">
      The next step is a 15-minute debrief call so I can walk you through the numbers and tell you exactly what to fix first.
      Slots fill fast — book yours below before it closes.
    </p>
    <table cellpadding="0" cellspacing="0"><tr><td style="background:#00FF41;border-radius:3px;">
      <a href="${bookingUrl}" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:800;color:#000;text-decoration:none;letter-spacing:-0.01em;">
        Book My Strategy Debrief →
      </a>
    </td></tr></table>
    <p style="margin:20px 0 0;font-size:13px;color:rgba(255,255,255,0.3);line-height:1.7;">
      — Elena Thorne<br/>
      <span style="font-size:11px;font-family:monospace;color:rgba(255,255,255,0.2);">Chief Revenue Forensics Officer, LeverageSystems</span>
    </p>
  </td></tr>
  <tr><td style="padding:20px 36px;border-top:1px solid rgba(255,255,255,0.06);">
    <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.2);font-family:monospace;">© ${new Date().getFullYear()} LeverageSystems. AI Sales Infrastructure.</p>
  </td></tr>
</table></td></tr></table>
</body></html>`,
    }).catch(e => console.error('[submit-audit] follow-up 1 error:', e));

    resend.emails.send({
      from:        `Elena Thorne — LeverageSystems <${fromAddress}>`,
      to:          email,
      subject:     `Did you get a chance to review your report, ${name}?`,
      scheduledAt: t4h,
      html: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:'Inter',Helvetica,Arial,sans-serif;color:#fff;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;">
<tr><td align="center" style="padding:40px 20px;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#111;border:1px solid rgba(212,175,55,0.2);border-radius:4px;overflow:hidden;">
  <tr><td height="2" style="background:linear-gradient(to right,transparent,#D4AF37,transparent);"></td></tr>
  <tr><td style="padding:36px 36px 24px;border-bottom:1px solid rgba(255,255,255,0.06);">
    <p style="margin:0;font-size:11px;font-family:monospace;text-transform:uppercase;letter-spacing:0.12em;color:rgba(212,175,55,0.6);">LeverageSystems · Follow Up</p>
    <h1 style="margin:12px 0 0;font-size:24px;font-weight:900;letter-spacing:-0.03em;color:#fff;line-height:1.2;">Your debrief slot<br/>is still open.</h1>
  </td></tr>
  <tr><td style="padding:28px 36px;">
    <p style="margin:0 0 20px;font-size:15px;color:rgba(255,255,255,0.6);line-height:1.7;">Hey ${name},</p>
    <p style="margin:0 0 20px;font-size:15px;color:rgba(255,255,255,0.6);line-height:1.7;">
      Your Revenue Leakage Report has been sitting in your inbox for a few hours. The findings don't get less urgent.
    </p>
    <p style="margin:0 0 28px;font-size:15px;color:rgba(255,255,255,0.6);line-height:1.7;">
      The debrief call is 15 minutes. No pitch. I walk you through the numbers, you ask questions, and we map out what needs to be rebuilt first.
      That's the entire call. Book it below.
    </p>
    <table cellpadding="0" cellspacing="0"><tr><td style="background:#D4AF37;border-radius:3px;">
      <a href="${bookingUrl}" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:800;color:#000;text-decoration:none;letter-spacing:-0.01em;">
        Book My 15-Minute Debrief →
      </a>
    </td></tr></table>
    <p style="margin:20px 0 0;font-size:13px;color:rgba(255,255,255,0.3);line-height:1.7;">
      — Elena<br/>
      <span style="font-size:11px;font-family:monospace;color:rgba(255,255,255,0.2);">Reply to this email with any questions.</span>
    </p>
  </td></tr>
  <tr><td style="padding:20px 36px;border-top:1px solid rgba(255,255,255,0.06);">
    <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.2);font-family:monospace;">© ${new Date().getFullYear()} LeverageSystems. AI Sales Infrastructure.</p>
  </td></tr>
</table></td></tr></table>
</body></html>`,
    }).catch(e => console.error('[submit-audit] follow-up 2 error:', e));

    resend.emails.send({
      from:        `Elena Thorne — LeverageSystems <${fromAddress}>`,
      to:          email,
      subject:     `${name} — your strategy debrief slot closes tonight`,
      scheduledAt: t48h,
      html: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:'Inter',Helvetica,Arial,sans-serif;color:#fff;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;">
<tr><td align="center" style="padding:40px 20px;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#111;border:1px solid rgba(239,68,68,0.2);border-radius:4px;overflow:hidden;">
  <tr><td height="2" style="background:linear-gradient(to right,transparent,#ef4444,transparent);"></td></tr>
  <tr><td style="padding:36px 36px 24px;border-bottom:1px solid rgba(255,255,255,0.06);">
    <p style="margin:0;font-size:11px;font-family:monospace;text-transform:uppercase;letter-spacing:0.12em;color:rgba(239,68,68,0.7);">LeverageSystems · Last Notice</p>
    <h1 style="margin:12px 0 0;font-size:24px;font-weight:900;letter-spacing:-0.03em;color:#fff;line-height:1.2;">We hold debrief slots<br/>for 48 hours.</h1>
  </td></tr>
  <tr><td style="padding:28px 36px;">
    <p style="margin:0 0 20px;font-size:15px;color:rgba(255,255,255,0.6);line-height:1.7;">${name},</p>
    <p style="margin:0 0 20px;font-size:15px;color:rgba(255,255,255,0.6);line-height:1.7;">
      We reserve a debrief slot for every operator who completes a Revenue Audit. After 48 hours, the slot opens back up to the next person in queue.
    </p>
    <p style="margin:0 0 8px;font-size:15px;color:rgba(255,255,255,0.6);line-height:1.7;">Your slot expires tonight.</p>
    <p style="margin:0 0 28px;font-size:15px;color:rgba(255,255,255,0.6);line-height:1.7;">
      If you still want the 15-minute call, book it now. If the timing isn't right, no hard feelings — your report is yours to keep.
    </p>
    <table cellpadding="0" cellspacing="0"><tr><td style="background:#00FF41;border-radius:3px;">
      <a href="${bookingUrl}" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:800;color:#000;text-decoration:none;letter-spacing:-0.01em;">
        Claim My Slot Before It Closes →
      </a>
    </td></tr></table>
    <p style="margin:20px 0 0;font-size:13px;color:rgba(255,255,255,0.3);line-height:1.7;">
      — Elena Thorne<br/>
      <span style="font-size:11px;font-family:monospace;color:rgba(255,255,255,0.2);">LeverageSystems · AI Sales Infrastructure</span>
    </p>
  </td></tr>
  <tr><td style="padding:20px 36px;border-top:1px solid rgba(255,255,255,0.06);">
    <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.2);font-family:monospace;">© ${new Date().getFullYear()} LeverageSystems. AI Sales Infrastructure.</p>
  </td></tr>
</table></td></tr></table>
</body></html>`,
    }).catch(e => console.error('[submit-audit] follow-up 3 error:', e));
  }

  return json({ ok: true });
};
