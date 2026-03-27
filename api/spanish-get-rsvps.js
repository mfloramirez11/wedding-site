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
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!verifyToken(req)) return res.status(401).json({ error: 'Unauthorized' });

  const sql = neon(process.env.DATABASE_URL);

  try {
    const rsvps = await sql`
      SELECT id, name, email, phone, attending, guests, guest_names, created_at, reminder_sent_at
      FROM spanish_rsvps
      ORDER BY created_at DESC
    `;

    const total = rsvps.length;
    const attending = rsvps.filter(r => r.attending === 'yes').length;
    const declined = rsvps.filter(r => r.attending === 'no').length;
    const totalGuests = rsvps
      .filter(r => r.attending === 'yes')
      .reduce((sum, r) => sum + (r.guests || 0), 0);

    return res.status(200).json({ rsvps, stats: { total, attending, declined, totalGuests } });
  } catch (error) {
    console.error('Spanish get-rsvps error:', error);
    return res.status(500).json({ error: 'Failed to fetch RSVPs' });
  }
}
