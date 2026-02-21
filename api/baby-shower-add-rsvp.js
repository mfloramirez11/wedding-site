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
    const { name, email, phone, attending, guests, guestData } = req.body;

    if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });

    const phoneStr = phone || '';
    const guestsJson = attending === 'yes' && guestData ? JSON.stringify(guestData) : null;

    await sql`
      INSERT INTO baby_shower_rsvps (name, email, phone, attending, guests, guest_names, created_at)
      VALUES (
        ${name},
        ${email.toLowerCase()},
        ${phoneStr},
        ${attending || 'yes'},
        ${attending === 'yes' ? (guests || 1) : 0},
        ${guestsJson},
        NOW()
      )
    `;

    return res.status(200).json({ success: true, message: 'RSVP added successfully' });
  } catch (error) {
    console.error('Baby shower add-rsvp error:', error);
    if (error.message?.includes('unique') || error.message?.includes('duplicate')) {
      return res.status(409).json({ error: 'An RSVP already exists with this email address' });
    }
    return res.status(500).json({ error: 'Failed to add RSVP' });
  }
}
