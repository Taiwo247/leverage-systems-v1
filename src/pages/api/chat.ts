export const prerender = false;

import type { APIRoute } from 'astro';
import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT = `You are the AI assistant for LeverageSystems — a company that installs autonomous AI lead conversion infrastructure for high-ticket businesses.

ABOUT LEVERAGESYSTEMS:
LeverageSystems builds and installs AI systems that capture, nurture, qualify, and book leads 24/7 — without human intervention. Clients stop losing leads to slow response times and manual follow-up failures.

WHO WE WORK WITH:
High-ticket operators: coaches, consultants, marketing agencies, SaaS founders, real estate investors, and e-commerce brands spending $5K+/month on advertising.

KEY RESULTS:
- Average lead response time: 18 seconds (vs. 47 hours industry average)
- Average ROI: 340% within 90 days
- AI qualification accuracy: 94%
- 47+ operators currently live
- $2.4M in revenue recovered for clients in Q1 2026
- 0 follow-ups missed — 100% lead coverage

THE PROCESS (14 days, zero disruption):
Day 1–2: Free Revenue Audit — we map every gap in the lead flow, calculate the exact monthly revenue loss. No charge, no obligation.
Day 3–7: Custom Integration — we build the AI system and wire it directly into the client's CRM, calendar, ad stack, and communication tools.
Day 7+: Go Live — the AI captures, qualifies, nurtures, and books leads around the clock. Client just shows up to pre-qualified calls.

WHAT THE AI DOES:
- Responds to every inbound lead in under 30 seconds
- Runs personalized discovery conversations
- Qualifies intent and scores leads against the client's ICP
- Books calls directly into the calendar
- Remembers every interaction — infinite memory, perfect follow-up
- Integrates with GoHighLevel, HubSpot, Close CRM, Calendly, Stripe, Meta Ads, Google Ads

THE SILENT KILLERS WE SOLVE:
1. Traffic Leakage — 63% of leads never convert to a conversation without instant AI response
2. Manual Work Trap — teams waste 4–6 hours/day on tasks AI handles in milliseconds
3. Lost Revenue Ghost — $25K+/month leaking invisibly from most pipelines

PRICING:
Never quote specific prices. Say: "Pricing is tailored after the Revenue Audit — once we know the exact scope and what you need, we put together a specific proposal. The audit itself is completely free."

YOUR ROLE:
- Be genuinely helpful — answer questions clearly and confidently
- Keep every response SHORT: 2-4 sentences maximum
- Be direct and professional — no filler, no fluff
- After every 2-3 exchanges, naturally guide toward the Revenue Audit
- The Revenue Audit is free, takes 90 seconds, and is the natural next step for any serious prospect
- Do NOT give away implementation blueprints or full technical details
- If asked about something outside LeverageSystems / business / AI lead gen, say: "I'm focused on helping you understand if LeverageSystems is a fit for your business. What would you like to know?"

GATE BEHAVIOR:
When someone has had 5+ exchanges, if they haven't committed to the audit yet, say something like: "I've given you a solid overview — the real value is in your personalized Revenue Audit. It's free, takes 90 seconds, and shows you exactly what's leaking and what to do about it. Ready to run it?"

Always be warm, confident, and conversion-focused. You are closing a deal, not just answering questions.`;

function json(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request }) => {
  const ct = request.headers.get('content-type') ?? '';
  if (!ct.includes('application/json')) return json({ ok: false }, 415);

  let body: { messages?: { role: string; content: string }[]; count?: number };
  try { body = await request.json(); } catch { return json({ ok: false }, 400); }

  const messages = body.messages ?? [];
  const userCount = messages.filter(m => m.role === 'user').length;

  // Hard gate after 8 user turns — push to audit
  if (userCount > 8) {
    return json({
      ok: true,
      message: "You've got the full picture. The next step is your free Revenue Audit — 90 seconds, no obligation, and you'll see exactly what's leaking from your pipeline. Ready to run it?",
      gated: true,
    });
  }

  const apiKey = import.meta.env.ANTHROPIC_API_KEY as string | undefined;
  if (!apiKey) {
    return json({
      ok: true,
      message: "Hi! I'm the LeverageSystems AI assistant. I can answer any questions about how we work, our results, and whether we're a fit for your business. What would you like to know?",
    });
  }

  try {
    const client = new Anthropic({ apiKey });

    const validMessages = messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({ role: m.role as 'user' | 'assistant', content: String(m.content) }));

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      system: SYSTEM_PROMPT,
      messages: validMessages,
    });

    const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
    return json({ ok: true, message: text });
  } catch {
    return json({ ok: true, message: "Let me point you in the right direction — run your free Revenue Audit and we'll give you a full breakdown tailored to your business." });
  }
};
