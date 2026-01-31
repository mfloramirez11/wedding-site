import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  const sql = neon(process.env.DATABASE_URL);
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Simple password protection - change this to something secure!
  const authHeader = req.headers.authorization;
  const password = 'MannyAndCelesti2026'; // CHANGE THIS PASSWORD!

  if (!authHeader || authHeader !== `Bearer ${password}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Get all RSVPs ordered by creation date
    const result = await sql`
      SELECT id, name, email, phone, attending, guests, created_at
      FROM rsvps
      ORDER BY created_at DESC
    `;

    // Calculate statistics
    const stats = {
      total: result.length,
      attending: result.filter(r => r.attending === 'yes').length,
      declined: result.filter(r => r.attending === 'no').length,
      totalGuests: result
        .filter(r => r.attending === 'yes')
        .reduce((sum, r) => sum + (parseInt(r.guests) || 1), 0)
    };

    return res.status(200).json({ 
      rsvps: result,
      stats 
    });

  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ 
      error: 'Failed to retrieve RSVPs' 
    });
  }
}
