import { neon } from '@neondatabase/serverless';
import { sendBabyShowerAdminNotification } from './baby-shower-notifications.js';

export default async function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  const allowedOrigins = ['https://mannyandcelesti.com', 'https://www.mannyandcelesti.com'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Deadline check
  const deadline = new Date('2026-05-25T23:59:59');
  if (new Date() > deadline) {
    return res.status(403).json({ error: 'The RSVP modification deadline has passed. Please contact us directly.' });
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    const { id, name, email, phone, attending, guestCount, guestData } = req.body;

    if (!id) return res.status(400).json({ error: 'RSVP ID is required' });

    const guestsJson = attending === 'yes' && guestData ? JSON.stringify(guestData) : null;

    await sql`
      UPDATE baby_shower_rsvps
      SET
        name = ${name},
        email = ${email.toLowerCase()},
        phone = ${phone || ''},
        attending = ${attending},
        guests = ${attending === 'yes' ? (guestCount || 1) : 0},
        guest_names = ${guestsJson}
      WHERE id = ${id}
    `;

    // Admin notification
    try {
      await sendBabyShowerAdminNotification({
        name, email, phone, attending,
        guestCount,
        guests: guestData || [],
        isUpdate: true
      });
    } catch (notifErr) {
      console.error('Admin notification error (non-fatal):', notifErr);
    }

    return res.status(200).json({ success: true, message: 'RSVP updated successfully' });
  } catch (error) {
    console.error('Baby shower update-public error:', error);
    return res.status(500).json({ error: 'Failed to update RSVP. Please try again.' });
  }
}
