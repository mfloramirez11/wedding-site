import { neon } from '@neondatabase/serverless';

function verifyToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  return authHeader.substring(7) === process.env.ADMIN_PASSWORD;
}

export default async function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!verifyToken(req)) return res.status(401).json({ error: 'Unauthorized' });

  const sql = neon(process.env.DATABASE_URL);

  try {
    const { id, name, email, phone, attending, guests, guestData } = req.body;
    if (!id) return res.status(400).json({ error: 'RSVP ID is required' });

    const guestsJson = attending === 'yes' && guestData ? JSON.stringify(guestData) : null;

    await sql`
      UPDATE spanish_rsvps
      SET
        name = ${name},
        email = ${email.toLowerCase()},
        phone = ${phone || ''},
        attending = ${attending},
        guests = ${attending === 'yes' ? (guests || 1) : 0},
        guest_names = ${guestsJson}
      WHERE id = ${id}
    `;

    return res.status(200).json({ success: true, message: 'RSVP updated successfully' });
  } catch (error) {
    console.error('Spanish update-rsvp error:', error);
    return res.status(500).json({ error: 'Failed to update RSVP' });
  }
}
