import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  const allowedOrigins = ['https://mannyandcelesti.com', 'https://www.mannyandcelesti.com'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const sql = neon(process.env.DATABASE_URL);

  try {
    const rows = await sql`
      SELECT id, time, event, note, sort_order
      FROM schedule
      ORDER BY sort_order ASC, id ASC
    `;
    return res.status(200).json({ items: rows });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Failed to retrieve schedule' });
  }
}
