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

const BOOKING_URL = 'https://calendly.com/evyn-leverage/20min';
const AUDIT_URL   = 'https://leveragesystems.ai/#audit';

const CHECKLIST_HTML = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:'Inter',Helvetica,Arial,sans-serif;color:#fff;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;">
<tr><td align="center" style="padding:40px 20px;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#111;border:1px solid rgba(212,175,55,0.25);border-radius:4px;overflow:hidden;">
  <tr><td height="2" style="background:linear-gradient(to right,transparent,#D4AF37,transparent);"></td></tr>
  <tr><td style="padding:36px 36px 24px;border-bottom:1px solid rgba(255,255,255,0.06);">
    <p style="margin:0;font-size:11px;font-family:monospace;text-transform:uppercase;letter-spacing:0.12em;color:rgba(212,175,55,0.6);">Leverage Systems · Revenue Intelligence</p>
    <h1 style="margin:12px 0 0;font-size:24px;font-weight:900;letter-spacing:-0.03em;color:#fff;line-height:1.2;">The 5-Point Revenue<br/>Leakage Checklist</h1>
  </td></tr>
  <tr><td style="padding:28px 36px;">
    <p style="margin:0 0 24px;font-size:15px;color:rgba(255,255,255,0.55);line-height:1.7;">
      Most businesses lose 30–60% of their potential revenue to the same five infrastructure failures. Here's exactly what to look for on your site right now.
    </p>

    <!-- Point 1 -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;border-left:3px solid #D4AF37;padding-left:0;">
      <tr><td style="padding:0 0 0 16px;">
        <p style="margin:0 0 4px;font-size:11px;font-family:monospace;text-transform:uppercase;letter-spacing:0.1em;color:#D4AF37;">01 — Tracking Blind Spot</p>
        <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#fff;">No Meta Pixel or retargeting infrastructure</p>
        <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.5);line-height:1.6;">Every visitor who leaves without converting is gone permanently. No pixel means no retargeting pool, no lookalike audiences, and your paid CPMs climb every month as you re-acquire the same cold traffic instead of closing warm traffic you already paid for.</p>
      </td></tr>
    </table>

    <!-- Point 2 -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;border-left:3px solid #D4AF37;padding-left:0;">
      <tr><td style="padding:0 0 0 16px;">
        <p style="margin:0 0 4px;font-size:11px;font-family:monospace;text-transform:uppercase;letter-spacing:0.1em;color:#D4AF37;">02 — Speed Tax</p>
        <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#fff;">Page load time exceeding 3 seconds</p>
        <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.5);line-height:1.6;">Every second over the 3-second mobile threshold costs 7% of your conversions. A 5-second load time is silently destroying 14% of every paid campaign before a single visitor reads your headline. This is the most common and most fixable leak on the list.</p>
      </td></tr>
    </table>

    <!-- Point 3 -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;border-left:3px solid #D4AF37;padding-left:0;">
      <tr><td style="padding:0 0 0 16px;">
        <p style="margin:0 0 4px;font-size:11px;font-family:monospace;text-transform:uppercase;letter-spacing:0.1em;color:#D4AF37;">03 — No Lead Capture Infrastructure</p>
        <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#fff;">Zero lifecycle automation or CRM capture</p>
        <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.5);line-height:1.6;">Buyers rarely convert on the first visit. Without an email capture system and automated nurture sequence, every lead that doesn't book on visit one evaporates. The businesses winning right now are closing leads on visits 3, 5, and 8 — through automated follow-up sequences that run without them.</p>
      </td></tr>
    </table>

    <!-- Point 4 -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;border-left:3px solid #D4AF37;padding-left:0;">
      <tr><td style="padding:0 0 0 16px;">
        <p style="margin:0 0 4px;font-size:11px;font-family:monospace;text-transform:uppercase;letter-spacing:0.1em;color:#D4AF37;">04 — Hero Headline Failure</p>
        <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#fff;">Vague above-the-fold copy that can't self-qualify visitors</p>
        <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.5);line-height:1.6;">If your hero headline doesn't tell a qualified visitor in under 4 seconds exactly what you do, who it's for, and what outcome they get — they leave. "We help businesses grow" is a death sentence. The headline is the single highest-leverage line of copy on your entire site.</p>
      </td></tr>
    </table>

    <!-- Point 5 -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;border-left:3px solid #D4AF37;padding-left:0;">
      <tr><td style="padding:0 0 0 16px;">
        <p style="margin:0 0 4px;font-size:11px;font-family:monospace;text-transform:uppercase;letter-spacing:0.1em;color:#D4AF37;">05 — No Social Proof Above the Fold</p>
        <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#fff;">Trust signals buried below where 60% of visitors stop scrolling</p>
        <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.5);line-height:1.6;">Logos, testimonials, and case results that live below the fold might as well not exist. The majority of visitors make their stay-or-leave decision in the first viewport. If your proof isn't visible before they scroll, your conversion rate is permanently capped regardless of how good the offer is.</p>
      </td></tr>
    </table>

    <p style="margin:0 0 12px;font-size:13px;color:rgba(255,255,255,0.4);line-height:1.7;">Want to know exactly which of these are live on your site right now — with the revenue math behind each one?</p>

    <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;"><tr><td style="background:#00FF41;border-radius:3px;">
      <a href="${AUDIT_URL}" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:800;color:#000;text-decoration:none;letter-spacing:-0.01em;">
        Get Your Free Revenue Audit →
      </a>
    </td></tr></table>

    <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.3);line-height:1.7;">
      — Elena Thorne<br/>
      <span style="font-size:11px;font-family:monospace;color:rgba(255,255,255,0.2);">Chief Revenue Forensics Officer, Leverage Systems</span>
    </p>
  </td></tr>
  <tr><td style="padding:20px 36px;border-top:1px solid rgba(255,255,255,0.06);">
    <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.2);font-family:monospace;">© ${new Date().getFullYear()} Leverage Systems. AI Sales Infrastructure.<br/>You requested this checklist at leveragesystems.ai</p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;

const FOLLOWUP_1_HTML = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:'Inter',Helvetica,Arial,sans-serif;color:#fff;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;">
<tr><td align="center" style="padding:40px 20px;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#111;border:1px solid rgba(0,255,65,0.2);border-radius:4px;overflow:hidden;">
  <tr><td height="2" style="background:linear-gradient(to right,transparent,#00FF41,transparent);"></td></tr>
  <tr><td style="padding:36px 36px 24px;border-bottom:1px solid rgba(255,255,255,0.06);">
    <p style="margin:0;font-size:11px;font-family:monospace;text-transform:uppercase;letter-spacing:0.12em;color:rgba(0,255,65,0.5);">Leverage Systems · Follow Up</p>
    <h1 style="margin:12px 0 0;font-size:24px;font-weight:900;letter-spacing:-0.03em;color:#fff;line-height:1.2;">The checklist tells you<br/>what's broken. The audit<br/>tells you what it's costing.</h1>
  </td></tr>
  <tr><td style="padding:28px 36px;">
    <p style="margin:0 0 20px;font-size:15px;color:rgba(255,255,255,0.55);line-height:1.7;">
      You now know the five failure points. The question is how many are live on your site — and what the actual revenue number is behind each one.
    </p>
    <p style="margin:0 0 20px;font-size:15px;color:rgba(255,255,255,0.55);line-height:1.7;">
      The Revenue Audit runs a full diagnostic against your domain: live tracking scan, load time telemetry, and a visual architecture review. It takes 90 seconds to submit and produces a scored report with the exact dollar impact of every gap we find.
    </p>
    <p style="margin:0 0 28px;font-size:15px;color:rgba(255,255,255,0.55);line-height:1.7;">
      It's free. No call required to get the report.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;"><tr><td style="background:#00FF41;border-radius:3px;">
      <a href="${AUDIT_URL}" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:800;color:#000;text-decoration:none;letter-spacing:-0.01em;">
        Run My Revenue Audit →
      </a>
    </td></tr></table>
    <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.3);line-height:1.7;">
      — Elena Thorne<br/>
      <span style="font-size:11px;font-family:monospace;color:rgba(255,255,255,0.2);">Chief Revenue Forensics Officer, Leverage Systems</span>
    </p>
  </td></tr>
  <tr><td style="padding:20px 36px;border-top:1px solid rgba(255,255,255,0.06);">
    <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.2);font-family:monospace;">© ${new Date().getFullYear()} Leverage Systems. AI Sales Infrastructure.</p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;

const FOLLOWUP_2_HTML = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:'Inter',Helvetica,Arial,sans-serif;color:#fff;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;">
<tr><td align="center" style="padding:40px 20px;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#111;border:1px solid rgba(239,68,68,0.2);border-radius:4px;overflow:hidden;">
  <tr><td height="2" style="background:linear-gradient(to right,transparent,#ef4444,transparent);"></td></tr>
  <tr><td style="padding:36px 36px 24px;border-bottom:1px solid rgba(255,255,255,0.06);">
    <p style="margin:0;font-size:11px;font-family:monospace;text-transform:uppercase;letter-spacing:0.12em;color:rgba(239,68,68,0.7);">Leverage Systems · Last Touch</p>
    <h1 style="margin:12px 0 0;font-size:24px;font-weight:900;letter-spacing:-0.03em;color:#fff;line-height:1.2;">I'm not going to keep<br/>sending you emails.</h1>
  </td></tr>
  <tr><td style="padding:28px 36px;">
    <p style="margin:0 0 20px;font-size:15px;color:rgba(255,255,255,0.55);line-height:1.7;">
      You grabbed the checklist. You haven't run the audit. That's fine — the timing might not be right.
    </p>
    <p style="margin:0 0 20px;font-size:15px;color:rgba(255,255,255,0.55);line-height:1.7;">
      Before I go: the audit takes 90 seconds and the report is free. If even one of those five leakage points is live on your site, the math on fixing it almost always pays back in the first 30 days.
    </p>
    <p style="margin:0 0 28px;font-size:15px;color:rgba(255,255,255,0.55);line-height:1.7;">
      If you ever want it, the link stays open. No pressure.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;"><tr><td style="background:#D4AF37;border-radius:3px;">
      <a href="${AUDIT_URL}" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:800;color:#000;text-decoration:none;letter-spacing:-0.01em;">
        Run the Audit Whenever You're Ready →
      </a>
    </td></tr></table>
    <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.3);line-height:1.7;">
      — Elena Thorne<br/>
      <span style="font-size:11px;font-family:monospace;color:rgba(255,255,255,0.2);">Leverage Systems · leveragesystems.ai</span>
    </p>
  </td></tr>
  <tr><td style="padding:20px 36px;border-top:1px solid rgba(255,255,255,0.06);">
    <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.2);font-family:monospace;">© ${new Date().getFullYear()} Leverage Systems. AI Sales Infrastructure.</p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;

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

  const submittedAt = new Date().toISOString();

  // Forward to Make.com if configured
  const webhookUrl = import.meta.env.MAKE_EXIT_WEBHOOK as string | undefined;
  if (webhookUrl) {
    fetch(webhookUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, source: data.source || 'Exit Intent Popup', submitted_at: submittedAt }),
    }).catch(() => {});
  }

  // Send email sequence via Resend
  const resendKey  = import.meta.env.RESEND_API_KEY as string | undefined;
  const rawFrom    = (import.meta.env.FROM_EMAIL as string | undefined) || 'onboarding@resend.dev';
  const emailOnly  = (rawFrom.match(/<([^>]+)>/) || [null, rawFrom])[1].trim();
  const FROM_ELENA = `Elena Thorne <${emailOnly}>`;

  if (resendKey) {
    const resend = new Resend(resendKey);
    const t24h   = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const t72h   = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

    // Email 1 — immediate: deliver the checklist
    resend.emails.send({
      from:    FROM_ELENA,
      to:      email,
      subject: 'Your 5-Point Revenue Leakage Checklist',
      html:    CHECKLIST_HTML,
    }).catch(e => console.error('[exit-capture] checklist email error:', e));

    // Email 2 — T+24h: push toward the full audit
    resend.emails.send({
      from:        FROM_ELENA,
      to:          email,
      subject:     "The checklist tells you what's broken — the audit tells you what it's costing",
      scheduledAt: t24h,
      html:        FOLLOWUP_1_HTML,
    }).catch(e => console.error('[exit-capture] follow-up 1 error:', e));

    // Email 3 — T+72h: low-pressure closer
    resend.emails.send({
      from:        FROM_ELENA,
      to:          email,
      subject:     "I'm not going to keep sending you emails",
      scheduledAt: t72h,
      html:        FOLLOWUP_2_HTML,
    }).catch(e => console.error('[exit-capture] follow-up 2 error:', e));
  }

  // Log to Airtable
  const atKey     = import.meta.env.AIRTABLE_API_KEY as string | undefined;
  const atBase    = import.meta.env.AIRTABLE_BASE_ID as string | undefined;
  const atTable   = import.meta.env.AIRTABLE_EXIT_TABLE_ID as string | undefined;
  if (atKey && atBase && atTable) {
    fetch(`https://api.airtable.com/v0/${atBase}/${atTable}`, {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${atKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          'Email':          email,
          'Date Captured':  submittedAt,
          'Status':         'Subscribed',
        },
      }),
    }).catch(e => console.error('[exit-capture] airtable error:', e));
  }

  return json({ ok: true });
};
