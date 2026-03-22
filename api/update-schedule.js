import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  const allowedOrigins = ['https://mannyandcelesti.com', 'https://www.mannyandcelesti.com'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return res.status(500).json({ error: 'Server configuration error' });
  if (!authHeader || authHeader !== `Bearer ${password}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'items must be an array' });
    }

    // Replace entire schedule
    await sql`DELETE FROM schedule`;

    for (let i = 0; i < items.length; i++) {
      const { time, event, note } = items[i];
      const t = (time || '').trim();
      const e = (event || '').trim();
      if (!e) continue;
      await sql`
        INSERT INTO schedule (time, event, note, sort_order)
        VALUES (${t}, ${e}, ${note ? note.trim() : null}, ${i})
      `;
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Failed to update schedule' });
  }
}
