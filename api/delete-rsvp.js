import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,DELETE,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow DELETE or POST requests
  if (req.method !== 'DELETE' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Auth check
  const authHeader = req.headers.authorization;
  const password = 'MannyAndCelesti2026';

  if (!authHeader || authHeader !== `Bearer ${password}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Missing RSVP ID' });
    }

    // Check if RSVP exists
    const existing = await sql`SELECT id FROM rsvps WHERE id = ${id}`;

    if (existing.length === 0) {
      return res.status(404).json({ error: 'RSVP not found' });
    }

    // Delete the RSVP
    await sql`DELETE FROM rsvps WHERE id = ${id}`;

    return res.status(200).json({
      success: true,
      message: 'RSVP deleted successfully'
    });

  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({
      error: 'Failed to delete RSVP'
    });
  }
}
