import { neon } from '@neondatabase/serverless';
import { Resend } from 'resend';

const DRIVE_LINK = 'https://drive.google.com/drive/folders/1QILiocouuDp96plQwx3IDaTf01jZ-uEs?usp=sharing';

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

function buildEmailHtml({ name }) {
  const firstName = name.split(' ')[0];

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
            <p style="margin:0 0 10px;font-size:10px;letter-spacing:0.3em;color:rgba(196,163,110,0.6);text-transform:uppercase;font-family:Arial,sans-serif;">April 4, 2026 · Pinole, CA</p>
            <h1 style="margin:0;font-size:34px;font-weight:400;color:#e8d5b0;letter-spacing:0.14em;font-family:Georgia,serif;">Manny &amp; Celesti</h1>
            <p style="margin:14px 0 0;font-size:11px;color:rgba(232,208,176,0.45);letter-spacing:0.2em;text-transform:uppercase;font-family:Arial,sans-serif;">Thank You</p>
          </td>
        </tr>

        <!-- Hero Photo -->
        <tr>
          <td style="padding:0;">
            <img src="https://mannyandcelesti.com/images/IMG_4207.JPG"
                 alt="Manny &amp; Celesti" width="100%"
                 style="display:block;max-height:400px;object-fit:cover;object-position:50% 30%;">
          </td>
        </tr>

        <!-- Greeting -->
        <tr>
          <td style="padding:44px 48px 36px;">
            <p style="margin:0 0 22px;font-size:17px;color:#e8f0ec;line-height:1.4;font-family:Georgia,serif;">Dear ${firstName},</p>
            <p style="margin:0 0 20px;font-size:15px;color:rgba(232,240,236,0.85);line-height:1.9;font-family:Georgia,serif;">
              Thank you for being a part of our special day. We hope you had a wonderful time and felt the love we have for each and every one of you.
            </p>
            <p style="margin:0 0 20px;font-size:15px;color:rgba(232,240,236,0.85);line-height:1.9;font-family:Georgia,serif;">
              If you took any photos or videos during the celebration that you'd like to share with us, we would absolutely love to have them. Please feel free to add them to our shared Google Drive below or text them to either one of us if that's easier.
            </p>
          </td>
        </tr>

        <!-- Drive Button -->
        <tr>
          <td align="center" style="padding:0 48px 44px;">
            <a href="${DRIVE_LINK}"
               style="display:inline-block;padding:16px 40px;background:#c4a36e;color:#2d3e3a;font-family:Arial,sans-serif;font-size:13px;letter-spacing:0.15em;text-transform:uppercase;text-decoration:none;border-radius:3px;font-weight:600;">
              Share Your Photos
            </a>
          </td>
        </tr>

        <!-- Divider -->
        <tr>
          <td style="padding:0 48px;">
            <hr style="border:none;border-top:1px solid rgba(196,163,110,0.2);margin:0;">
          </td>
        </tr>

        <!-- Closing -->
        <tr>
          <td style="padding:40px 48px 44px;">
            <p style="margin:0 0 20px;font-size:15px;color:rgba(232,240,236,0.85);line-height:1.9;font-family:Georgia,serif;">
              From the bottom of our hearts! We are so grateful for each one of you. Our paths have crossed, and you will forever be a part of our story, our history, and the adventures still ahead.
            </p>
            <p style="margin:0;font-size:15px;color:rgba(232,240,236,0.85);line-height:1.9;font-family:Georgia,serif;">
              We love you all.
            </p>
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
          <td align="center" style="padding:28px 48px 40px;">
            <p style="margin:0 0 6px;font-size:15px;color:rgba(232,240,236,0.6);font-style:italic;font-family:Georgia,serif;">
              With all our love,
            </p>
            <p style="margin:0 0 20px;font-size:15px;color:rgba(232,240,236,0.6);font-style:italic;font-family:Georgia,serif;">
              Manny &amp; Celesti
            </p>
            <p style="margin:0;font-size:10px;color:rgba(232,240,236,0.2);letter-spacing:0.18em;text-transform:uppercase;font-family:Arial,sans-serif;">
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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!auth(req)) return res.status(401).json({ error: 'Unauthorized' });

  const { send_all, test_email } = req.body || {};
  const { sql, resend } = getClients();

  // ── Test send ────────────────────────────────────────────────────────────────
  if (test_email) {
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Manny & Celesti <rsvp@mannyandcelesti.com>',
      to: test_email,
      replyTo: 'mannyandcelesti@gmail.com',
      subject: 'Thank you for celebrating with us 💚 · Manny & Celesti',
      html: buildEmailHtml({ name: 'Guest' }),
    });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true, sent: [test_email] });
  }

  // ── Send all attending guests ─────────────────────────────────────────────────
  if (send_all) {
    const guests = await sql`
      SELECT id, name, email
      FROM rsvps
      WHERE attending = 'yes' AND email IS NOT NULL AND email != ''
    `;

    if (!guests.length) {
      return res.status(400).json({ error: 'No attending guests with email addresses found.' });
    }

    const sent = [];
    const failed = [];

    for (const guest of guests) {
      const { error } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'Manny & Celesti <rsvp@mannyandcelesti.com>',
        to: guest.email,
        replyTo: 'mannyandcelesti@gmail.com',
        subject: 'Thank you for celebrating with us 💚 · Manny & Celesti',
        html: buildEmailHtml({ name: guest.name }),
      });

      if (error) {
        failed.push({ name: guest.name, error: error.message });
      } else {
        sent.push(guest.email);
      }
    }

    return res.status(200).json({ success: true, sent: sent.length, failed });
  }

  return res.status(400).json({ error: 'Provide either send_all: true or test_email.' });
}
