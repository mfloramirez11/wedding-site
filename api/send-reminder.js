import { neon } from '@neondatabase/serverless';
import { Resend } from 'resend';

const COOLDOWN_HOURS = 48; // 2 days

function auth(req) {
  const authHeader = req.headers.authorization;
  const password = process.env.ADMIN_PASSWORD;
  return authHeader && authHeader === `Bearer ${password}`;
}

function getClients() {
  const sql = neon(process.env.DATABASE_URL);
  const resend = new Resend(process.env.RESEND_API_KEY);
  return { sql, resend };
}

function hoursAgo(ts) {
  if (!ts) return Infinity;
  return (Date.now() - new Date(ts).getTime()) / 36e5;
}

function buildEmailHtml({ name, guestCount }) {
  const firstName = name.split(' ')[0];
  const partyCount = guestCount || 1;
  const partyLine = partyCount > 1
    ? `We have you down for <strong style="color:#e8d5b0;">${partyCount} guests</strong>.`
    : `We have you down for <strong style="color:#e8d5b0;">1 guest</strong>.`;

  const dot = `<span style="color:#c4a36e;font-size:18px;line-height:1;vertical-align:middle;padding-right:12px;">&#8212;</span>`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:Georgia,serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;padding:40px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;background:#2d3e3a;border-radius:4px;overflow:hidden;">

        <!-- Header -->
        <tr>
          <td align="center" style="padding:52px 48px 40px;border-bottom:1px solid rgba(196,163,110,0.25);">
            <p style="margin:0 0 10px;font-size:10px;letter-spacing:0.3em;color:rgba(196,163,110,0.6);text-transform:uppercase;font-family:Arial,sans-serif;">April 4, 2026 · Bay Area, CA</p>
            <h1 style="margin:0;font-size:34px;font-weight:400;color:#e8d5b0;letter-spacing:0.14em;font-family:Georgia,serif;">Manny &amp; Celesti</h1>
            <p style="margin:14px 0 0;font-size:11px;color:rgba(232,208,176,0.45);letter-spacing:0.2em;text-transform:uppercase;font-family:Arial,sans-serif;">A Gentle Reminder</p>
          </td>
        </tr>

        <!-- Greeting -->
        <tr>
          <td style="padding:44px 48px 32px;">
            <p style="margin:0 0 20px;font-size:17px;color:#e8f0ec;line-height:1.4;font-family:Georgia,serif;">Dear ${firstName},</p>
            <p style="margin:0 0 20px;font-size:15px;color:rgba(232,240,236,0.8);line-height:1.9;font-family:Georgia,serif;">
              Thank you so much for your RSVP — it truly means the world to us.
              We are counting down the days and cannot wait to celebrate with you.
            </p>
            <p style="margin:0;font-size:14px;color:rgba(232,240,236,0.6);line-height:1.8;border-left:2px solid rgba(196,163,110,0.5);padding-left:16px;font-family:Arial,sans-serif;">
              ${partyLine} If anything has changed, please text us and we'll get it sorted.
            </p>
          </td>
        </tr>

        <!-- Photos -->
        <tr>
          <td style="padding:0 48px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="49%" style="padding-right:6px;">
                  <img src="https://mannyandcelesti.com/images/email-couple-1.jpeg"
                       alt="Manny &amp; Celesti" width="100%"
                       style="border-radius:3px;display:block;">
                </td>
                <td width="2%"></td>
                <td width="49%" style="padding-left:6px;">
                  <img src="https://mannyandcelesti.com/images/email-couple-2.jpeg"
                       alt="Manny &amp; Celesti" width="100%"
                       style="border-radius:3px;display:block;">
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Divider -->
        <tr>
          <td style="padding:0 48px;">
            <hr style="border:none;border-top:1px solid rgba(196,163,110,0.2);margin:0;">
          </td>
        </tr>

        <!-- Details -->
        <tr>
          <td style="padding:36px 48px 32px;">
            <p style="margin:0 0 28px;font-size:10px;letter-spacing:0.25em;color:rgba(196,163,110,0.7);text-transform:uppercase;font-family:Arial,sans-serif;">A few things to keep in mind</p>

            <p style="margin:0 0 20px;font-size:15px;color:rgba(232,240,236,0.8);line-height:1.8;font-family:Georgia,serif;">
              ${dot}Please take a moment to review our
              <a href="https://mannyandcelesti.com/#faq" style="color:#c4a36e;text-decoration:none;border-bottom:1px solid rgba(196,163,110,0.35);">FAQ page</a>
              before the day.
            </p>

            <p style="margin:0 0 20px;font-size:15px;color:rgba(232,240,236,0.8);line-height:1.8;font-family:Georgia,serif;">
              ${dot}The
              <a href="https://mannyandcelesti.com/#schedule" style="color:#c4a36e;text-decoration:none;border-bottom:1px solid rgba(196,163,110,0.35);">event schedule</a>
              has been updated — take a look so you know what to expect throughout the evening.
            </p>

            <p style="margin:0 0 20px;font-size:15px;color:rgba(232,240,236,0.8);line-height:1.8;font-family:Georgia,serif;">
              ${dot}Doors open at <strong style="color:#e8d5b0;font-weight:normal;">4:00 PM</strong> — please plan to arrive on time so we can begin together.
            </p>

            <p style="margin:0 0 20px;font-size:15px;color:rgba(232,240,236,0.8);line-height:1.8;font-family:Georgia,serif;">
              ${dot}Need to modify your RSVP? Please text us and we will take care of it for you.
            </p>

            <p style="margin:0;font-size:15px;color:rgba(232,240,236,0.8);line-height:1.8;font-family:Georgia,serif;">
              ${dot}Any other questions? Simply reply to this email or send us a text — we are happy to help.
            </p>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td align="center" style="padding:8px 48px 40px;">
            <a href="https://mannyandcelesti.com/seating"
               style="display:inline-block;border:1px solid rgba(196,163,110,0.45);color:#e8d5b0;text-decoration:none;padding:13px 36px;font-size:11px;letter-spacing:0.2em;font-family:Arial,sans-serif;text-transform:uppercase;">
              Find Your Seat
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
            <p style="margin:0 0 6px;font-size:15px;color:rgba(232,240,236,0.6);line-height:1.8;font-style:italic;font-family:Georgia,serif;">
              We are so grateful to have you in our lives.
            </p>
            <p style="margin:0 0 20px;font-size:15px;color:rgba(232,240,236,0.6);font-style:italic;font-family:Georgia,serif;">
              See you very soon.
            </p>
            <p style="margin:0;font-size:10px;color:rgba(232,240,236,0.3);letter-spacing:0.15em;text-transform:uppercase;font-family:Arial,sans-serif;">
              Manny &amp; Celesti &nbsp;&middot;&nbsp; April 4, 2026
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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!auth(req)) return res.status(401).json({ error: 'Unauthorized' });

  const { rsvp_id, send_all } = req.body || {};
  const { sql, resend } = getClients();

  // ── Single guest ─────────────────────────────────────────────────────────────
  if (rsvp_id) {
    const rows = await sql`
      SELECT id, name, email, guests, reminder_sent_at
      FROM rsvps WHERE id = ${rsvp_id} AND attending = 'yes'
    `;
    if (!rows.length) return res.status(404).json({ error: 'RSVP not found or not attending' });

    const rsvp = rows[0];
    const hrs = hoursAgo(rsvp.reminder_sent_at);
    if (hrs < COOLDOWN_HOURS) {
      return res.status(429).json({
        error: `Reminder already sent to ${rsvp.name} ${Math.round(hrs)}h ago. Wait ${Math.round(COOLDOWN_HOURS - hrs)}h before resending.`
      });
    }

    if (!rsvp.email) return res.status(400).json({ error: 'No email on file for this guest' });

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Manny & Celesti <rsvp@mannyandcelesti.com>',
      to: rsvp.email,
      replyTo: 'mannyandcelesti@gmail.com',
      subject: "A gentle reminder — Manny & Celesti, April 4",
      html: buildEmailHtml({ name: rsvp.name, guestCount: rsvp.guests }),
    });

    if (error) return res.status(500).json({ error: error.message });

    await sql`UPDATE rsvps SET reminder_sent_at = NOW() WHERE id = ${rsvp_id}`;
    return res.status(200).json({ success: true, sent: [rsvp.email] });
  }

  // ── Send all ──────────────────────────────────────────────────────────────────
  if (send_all) {
    // Check bulk cooldown
    const setting = await sql`SELECT value FROM settings WHERE key = 'last_bulk_reminder_at'`;
    const lastBulk = setting[0]?.value;
    const bulkHrs = hoursAgo(lastBulk);
    if (bulkHrs < COOLDOWN_HOURS) {
      return res.status(429).json({
        error: `Bulk reminder already sent ${Math.round(bulkHrs)}h ago. Wait ${Math.round(COOLDOWN_HOURS - bulkHrs)}h before sending again.`
      });
    }

    // Fetch all attending guests with email, skip those recently reminded
    const guests = await sql`
      SELECT id, name, email, guests, reminder_sent_at
      FROM rsvps
      WHERE attending = 'yes' AND email IS NOT NULL AND email != ''
    `;

    const eligible = guests.filter(g => hoursAgo(g.reminder_sent_at) >= COOLDOWN_HOURS);
    const skipped = guests.filter(g => hoursAgo(g.reminder_sent_at) < COOLDOWN_HOURS);

    if (eligible.length === 0) {
      return res.status(429).json({
        error: 'All guests were already sent a reminder recently.',
        skipped: skipped.map(g => g.name),
      });
    }

    const sent = [];
    const failed = [];

    for (const guest of eligible) {
      const { error } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'Manny & Celesti <rsvp@mannyandcelesti.com>',
        to: guest.email,
        replyTo: 'mannyandcelesti@gmail.com',
        subject: "A gentle reminder — Manny & Celesti, April 4",
        html: buildEmailHtml({ name: guest.name, guestCount: guest.guests }),
      });

      if (error) {
        failed.push({ name: guest.name, error: error.message });
      } else {
        await sql`UPDATE rsvps SET reminder_sent_at = NOW() WHERE id = ${guest.id}`;
        sent.push(guest.email);
      }
    }

    // Record bulk send time
    await sql`
      INSERT INTO settings (key, value, updated_at)
      VALUES ('last_bulk_reminder_at', NOW()::TEXT, NOW())
      ON CONFLICT (key) DO UPDATE SET value = NOW()::TEXT, updated_at = NOW()
    `;

    return res.status(200).json({
      success: true,
      sent: sent.length,
      skipped: skipped.map(g => g.name),
      failed,
    });
  }

  return res.status(400).json({ error: 'Provide either rsvp_id or send_all: true' });
}
