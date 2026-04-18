import { neon } from '@neondatabase/serverless';
import { Resend } from 'resend';

const FLICKR_LINK = 'https://www.flickr.com/gp/200325627@N08/6548v97490';

function auth(req) {
  return req.headers.authorization === `Bearer ${process.env.ADMIN_PASSWORD}`;
}

function buildDearLine(name, guestNamesJson) {
  const names = [name.split(' ')[0]];
  if (guestNamesJson) {
    try {
      const guests = typeof guestNamesJson === 'string'
        ? JSON.parse(guestNamesJson)
        : guestNamesJson;
      for (const g of guests) {
        const fn = (g.name || '').trim().split(' ')[0];
        if (fn) names.push(fn);
      }
    } catch {}
  }
  if (names.length === 1) return `Dear ${names[0]},`;
  if (names.length === 2) return `Dear ${names[0]} and ${names[1]},`;
  return `Dear ${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]},`;
}

async function getAiNote(dearLine) {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 80,
        messages: [{
          role: 'user',
          content: `Write one warm, sincere sentence (max 25 words) for a wedding thank-you email addressed "${dearLine}". Output only the sentence — no greeting, no signature.`,
        }],
      }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data?.content?.[0]?.text?.trim() || null;
  } catch {
    return null;
  }
}

function bodyToHtml(bodyText) {
  return bodyText
    .split(/\n{2,}/)
    .map(p => p.replace(/\n/g, '<br>').trim())
    .filter(Boolean)
    .map(p => `<p style="margin:0 0 20px;font-size:15px;color:rgba(232,240,236,0.85);line-height:1.9;font-family:Georgia,serif;">${p}</p>`)
    .join('');
}

function buildEmailHtml({ dearLine, bodyHtml, photoLink, aiNote }) {
  const aiSection = aiNote
    ? `<p style="margin:0 0 24px;font-size:15px;color:#c4a36e;line-height:1.8;font-family:Georgia,serif;font-style:italic;">${aiNote}</p>`
    : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
</head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;padding:40px 16px;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;background:#2d3e3a;border-radius:6px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.18);">

        <!-- Header -->
        <tr>
          <td align="center" style="padding:52px 48px 40px;border-bottom:1px solid rgba(196,163,110,0.25);">
            <p style="margin:0 0 10px;font-size:10px;letter-spacing:0.3em;color:rgba(196,163,110,0.6);text-transform:uppercase;font-family:Arial,sans-serif;">April 4, 2026 &nbsp;&middot;&nbsp; Pinole, CA</p>
            <h1 style="margin:0;font-size:34px;font-weight:400;color:#e8d5b0;letter-spacing:0.14em;font-family:Georgia,serif;">Manny &amp; Celesti</h1>
            <p style="margin:14px 0 0;font-size:11px;color:rgba(232,208,176,0.4);letter-spacing:0.22em;text-transform:uppercase;font-family:Arial,sans-serif;">Thank You</p>
          </td>
        </tr>

        <!-- Hero Photo -->
        <tr>
          <td style="padding:0;line-height:0;">
            <img src="https://mannyandcelesti.com/images/finale.png"
                 alt="Manny &amp; Celesti"
                 width="580"
                 style="display:block;width:100%;max-width:580px;max-height:440px;object-fit:cover;object-position:50% 62%;">
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:44px 48px 8px;">
            <p style="margin:0 0 26px;font-size:18px;color:#e8f0ec;line-height:1.4;font-family:Georgia,serif;">${dearLine}</p>
            ${aiSection}
            ${bodyHtml}
          </td>
        </tr>

        <!-- Photo Button -->
        <tr>
          <td align="center" style="padding:16px 48px 48px;">
            <a href="${photoLink}"
               target="_blank"
               style="display:inline-block;padding:17px 44px;background:#c4a36e;color:#2d3e3a;font-family:Arial,sans-serif;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;text-decoration:none;border-radius:3px;font-weight:700;">
              View &amp; Download Photos
            </a>
          </td>
        </tr>

        <!-- Divider -->
        <tr>
          <td style="padding:0 48px;">
            <hr style="border:none;border-top:1px solid rgba(196,163,110,0.2);margin:0;">
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td align="center" style="padding:32px 48px 44px;">
            <p style="margin:0 0 6px;font-size:15px;color:rgba(232,240,236,0.55);font-style:italic;font-family:Georgia,serif;">With all our love,</p>
            <p style="margin:0 0 22px;font-size:17px;color:rgba(232,208,176,0.75);font-style:italic;font-family:Georgia,serif;">Manny &amp; Celesti</p>
            <p style="margin:0;font-size:10px;color:rgba(232,240,236,0.18);letter-spacing:0.2em;text-transform:uppercase;font-family:Arial,sans-serif;">
              April 4, 2026 &nbsp;&middot;&nbsp; Pinole, CA
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!auth(req)) return res.status(401).json({ error: 'Unauthorized' });

  const sql = neon(process.env.DATABASE_URL);
  const resend = new Resend(process.env.RESEND_API_KEY);

  // ── GET: list recipients ────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const recipients = await sql`
      SELECT id, name, email, guest_names, final_thankyou_sent_at
      FROM rsvps
      WHERE attending = 'yes'
      ORDER BY final_thankyou_sent_at NULLS FIRST, name ASC
    `;
    const aiAvailable = !!process.env.ANTHROPIC_API_KEY;
    return res.status(200).json({ recipients, aiAvailable });
  }

  if (req.method !== 'POST') return res.status(405).end();

  const {
    rsvp_id,
    rsvp_ids,
    send_all,
    only_unsent = true,
    test_email,
    custom_name,
    custom_email,
    subject,
    body,
    photo_link,
    ai_personalize,
  } = req.body || {};

  if (!body || !body.trim()) {
    return res.status(400).json({ error: 'Email body is required.' });
  }

  const emailSubject = (subject || '').trim() || 'Thank you for celebrating with us 💚 · Manny & Celesti';
  const photoLink = (photo_link || '').trim() || FLICKR_LINK;
  const bodyHtml = bodyToHtml(body.trim());

  async function doSend({ name, email, guest_names, id }) {
    const dearLine = buildDearLine(name, guest_names ?? null);
    const aiNote = ai_personalize ? await getAiNote(dearLine) : null;
    const html = buildEmailHtml({ dearLine, bodyHtml, photoLink, aiNote });

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Manny & Celesti <rsvp@mannyandcelesti.com>',
      to: email,
      replyTo: 'mannyandcelesti@gmail.com',
      subject: emailSubject,
      html,
    });

    if (error) return { ok: false, error: error.message };

    if (id) {
      await sql`UPDATE rsvps SET final_thankyou_sent_at = NOW() WHERE id = ${id}`;
    }
    return { ok: true, dearLine };
  }

  // ── Test send ───────────────────────────────────────────────────────────────
  if (test_email) {
    const result = await doSend({ name: 'Friends', email: test_email, guest_names: null, id: null });
    if (!result.ok) return res.status(500).json({ error: result.error });
    return res.status(200).json({ success: true });
  }

  // ── Custom recipient ────────────────────────────────────────────────────────
  if (custom_email && custom_name) {
    const result = await doSend({ name: custom_name, email: custom_email, guest_names: null, id: null });
    if (!result.ok) return res.status(500).json({ error: result.error });
    return res.status(200).json({ success: true });
  }

  // ── Bulk email list (no names — generic greeting) ───────────────────────────
  if (Array.isArray(req.body.email_list) && req.body.email_list.length > 0) {
    const sent = [], failed = [];
    for (const email of req.body.email_list) {
      const trimmed = email.trim();
      if (!trimmed) continue;
      const result = await doSend({ name: 'friends and family', email: trimmed, guest_names: null, id: null });
      if (result.ok) sent.push(trimmed);
      else failed.push({ email: trimmed, error: result.error });
    }
    return res.status(200).json({ success: true, sent, failed });
  }

  // ── Single by rsvp_id ───────────────────────────────────────────────────────
  if (rsvp_id) {
    const [g] = await sql`
      SELECT id, name, email, guest_names FROM rsvps WHERE id = ${rsvp_id}
    `;
    if (!g) return res.status(404).json({ error: 'Guest not found' });
    if (!g.email) return res.status(400).json({ error: 'No email on record' });

    const result = await doSend(g);
    if (!result.ok) return res.status(500).json({ error: result.error });
    return res.status(200).json({
      success: true,
      dearLine: result.dearLine,
      final_thankyou_sent_at: new Date().toISOString(),
    });
  }

  // ── Batch by selected IDs ───────────────────────────────────────────────────
  if (Array.isArray(rsvp_ids) && rsvp_ids.length > 0) {
    const guests = await sql`
      SELECT id, name, email, guest_names
      FROM rsvps
      WHERE id = ANY(${rsvp_ids}) AND email IS NOT NULL AND email != ''
    `;
    const sent = [], failed = [];
    for (const g of guests) {
      const result = await doSend(g);
      if (result.ok) sent.push({ id: g.id, email: g.email, dearLine: result.dearLine });
      else failed.push({ id: g.id, name: g.name, email: g.email, error: result.error });
    }
    return res.status(200).json({ success: true, sent, failed });
  }

  // ── Send all attending ──────────────────────────────────────────────────────
  if (send_all) {
    const guests = only_unsent
      ? await sql`
          SELECT id, name, email, guest_names FROM rsvps
          WHERE attending = 'yes' AND email IS NOT NULL AND email != ''
            AND final_thankyou_sent_at IS NULL
        `
      : await sql`
          SELECT id, name, email, guest_names FROM rsvps
          WHERE attending = 'yes' AND email IS NOT NULL AND email != ''
        `;

    if (!guests.length) {
      return res.status(200).json({ success: true, sent: [], failed: [], message: 'No eligible recipients.' });
    }

    const sent = [], failed = [];
    for (const g of guests) {
      const result = await doSend(g);
      if (result.ok) sent.push({ id: g.id, email: g.email, dearLine: result.dearLine });
      else failed.push({ id: g.id, name: g.name, email: g.email, error: result.error });
    }
    return res.status(200).json({ success: true, sent, failed });
  }

  return res.status(400).json({ error: 'Provide rsvp_id, rsvp_ids, send_all, test_email, or custom_name+custom_email.' });
}
