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
  const partyLine = guestCount && guestCount > 1
    ? `We have you down for <strong style="color:#e8d5b0;">${guestCount} guests</strong> in your party.`
    : `We have you down for <strong style="color:#e8d5b0;">1 guest</strong> in your party.`;
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:Georgia,serif;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#2d3e3a;border-radius:12px;overflow:hidden;">

        <!-- Header -->
        <tr>
          <td align="center" style="padding:48px 40px 32px;border-bottom:1px solid rgba(196,163,110,0.3);">
            <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.25em;color:rgba(196,163,110,0.7);text-transform:uppercase;font-family:Arial,sans-serif;">April 4, 2026</p>
            <h1 style="margin:0;font-size:36px;font-weight:400;color:#e8d5b0;letter-spacing:0.12em;font-family:Georgia,serif;">Manny &amp; Celesti</h1>
            <p style="margin:12px 0 0;font-size:13px;color:rgba(232,208,176,0.6);letter-spacing:0.08em;font-family:Arial,sans-serif;">A REMINDER FOR OUR SPECIAL DAY</p>
          </td>
        </tr>

        <!-- Greeting -->
        <tr>
          <td style="padding:36px 40px 24px;">
            <p style="margin:0 0 16px;font-size:18px;color:#e8f0ec;line-height:1.5;">Dear ${firstName},</p>
            <p style="margin:0 0 16px;font-size:16px;color:rgba(232,240,236,0.85);line-height:1.8;">
              Thank you so much for your RSVP — it truly means the world to us.
              We are counting down the days and cannot wait to celebrate with you on our special day.
            </p>
            <p style="margin:0;font-size:15px;color:rgba(232,240,236,0.7);line-height:1.7;background:rgba(196,163,110,0.08);border:1px solid rgba(196,163,110,0.2);border-radius:8px;padding:14px 18px;">
              📝 ${partyLine} If anything has changed, please text us and we'll get it sorted.
            </p>
          </td>
        </tr>

        <!-- Photos -->
        <tr>
          <td style="padding:8px 40px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="48%" style="padding-right:8px;">
                  <img src="https://mannyandcelesti.com/images/email-couple-1.jpeg"
                       alt="Manny &amp; Celesti"
                       width="100%"
                       style="border-radius:8px;display:block;border:1px solid rgba(196,163,110,0.2);">
                </td>
                <td width="4%"></td>
                <td width="48%" style="padding-left:8px;">
                  <img src="https://mannyandcelesti.com/images/email-couple-2.jpeg"
                       alt="Manny &amp; Celesti"
                       width="100%"
                       style="border-radius:8px;display:block;border:1px solid rgba(196,163,110,0.2);">
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Divider -->
        <tr>
          <td style="padding:0 40px;">
            <hr style="border:none;border-top:1px solid rgba(196,163,110,0.25);margin:0;">
          </td>
        </tr>

        <!-- Details -->
        <tr>
          <td style="padding:32px 40px 8px;">
            <p style="margin:0 0 24px;font-size:13px;letter-spacing:0.15em;color:rgba(196,163,110,0.8);text-transform:uppercase;font-family:Arial,sans-serif;">A few things to keep in mind</p>

            <!-- Item 1 -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
              <tr>
                <td width="28" valign="top" style="padding-top:2px;">
                  <span style="font-size:14px;">📋</span>
                </td>
                <td>
                  <p style="margin:0;font-size:15px;color:#e8f0ec;line-height:1.6;">
                    Have questions? Please take a moment to read our
                    <a href="https://mannyandcelesti.com/#faq" style="color:#c4a36e;text-decoration:none;border-bottom:1px solid rgba(196,163,110,0.4);">FAQ page</a>
                    — you'll find answers to the most common questions about the day.
                  </p>
                </td>
              </tr>
            </table>

            <!-- Item 2 -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
              <tr>
                <td width="28" valign="top" style="padding-top:2px;">
                  <span style="font-size:14px;">📅</span>
                </td>
                <td>
                  <p style="margin:0;font-size:15px;color:#e8f0ec;line-height:1.6;">
                    We've updated the
                    <a href="https://mannyandcelesti.com/#schedule" style="color:#c4a36e;text-decoration:none;border-bottom:1px solid rgba(196,163,110,0.4);">event schedule</a>
                    — take a look so you know what to expect throughout the evening.
                  </p>
                </td>
              </tr>
            </table>

            <!-- Item 3 -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
              <tr>
                <td width="28" valign="top" style="padding-top:2px;">
                  <span style="font-size:14px;">⏰</span>
                </td>
                <td>
                  <p style="margin:0;font-size:15px;color:#e8f0ec;line-height:1.6;">
                    <strong style="color:#e8d5b0;">Please be on time.</strong>
                    Doors open at 4:00 PM — we'd love for everyone to be settled in before the evening begins.
                  </p>
                </td>
              </tr>
            </table>

            <!-- Item 4 -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
              <tr>
                <td width="28" valign="top" style="padding-top:2px;">
                  <span style="font-size:14px;">✏️</span>
                </td>
                <td>
                  <p style="margin:0;font-size:15px;color:#e8f0ec;line-height:1.6;">
                    Need to modify your RSVP? Please <strong style="color:#e8d5b0;">text us</strong> and we'll take care of it for you.
                  </p>
                </td>
              </tr>
            </table>

            <!-- Item 5 -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
              <tr>
                <td width="28" valign="top" style="padding-top:2px;">
                  <span style="font-size:14px;">💬</span>
                </td>
                <td>
                  <p style="margin:0;font-size:15px;color:#e8f0ec;line-height:1.6;">
                    Any other questions? Don't hesitate — text us or simply reply to this email and we'll get back to you.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td align="center" style="padding:32px 40px;">
            <a href="https://mannyandcelesti.com/seating"
               style="display:inline-block;background:rgba(196,163,110,0.15);border:1px solid rgba(196,163,110,0.5);color:#e8d5b0;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:13px;letter-spacing:0.12em;font-family:Arial,sans-serif;text-transform:uppercase;">
              Find Your Seat
            </a>
          </td>
        </tr>

        <!-- Divider -->
        <tr>
          <td style="padding:0 40px;">
            <hr style="border:none;border-top:1px solid rgba(196,163,110,0.25);margin:0;">
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td align="center" style="padding:28px 40px 36px;">
            <p style="margin:0 0 8px;font-size:15px;color:rgba(232,240,236,0.7);line-height:1.6;font-style:italic;">
              We are so grateful to have you in our lives.<br>
              See you very soon. 💍
            </p>
            <p style="margin:16px 0 0;font-size:13px;color:rgba(232,240,236,0.4);font-family:Arial,sans-serif;">
              Manny &amp; Celesti · April 4, 2026
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
      subject: "We can't wait to see you — a quick reminder 💍",
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
        subject: "We can't wait to see you — a quick reminder 💍",
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
