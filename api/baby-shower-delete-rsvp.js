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
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'RSVP ID is required' });

    await sql`DELETE FROM baby_shower_rsvps WHERE id = ${id}`;

    return res.status(200).json({ success: true, message: 'RSVP deleted successfully' });
  } catch (error) {
    console.error('Baby shower delete-rsvp error:', error);
    return res.status(500).json({ error: 'Failed to delete RSVP' });
  }
}
