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
    const { table_number, table_label, seats } = req.body;

    if (!table_number || !Array.isArray(seats)) {
      return res.status(400).json({ error: 'Missing table_number or seats' });
    }

    // Replace all seats for this table
    await sql`DELETE FROM seating_chart WHERE table_number = ${table_number}`;

    for (let i = 0; i < seats.length; i++) {
      const seat = seats[i];
      const seatName = (seat.seat_name || '').trim();
      if (!seatName) continue;

      const rsvpId = seat.rsvp_id ? parseInt(seat.rsvp_id) : null;
      await sql`
        INSERT INTO seating_chart (table_number, table_label, seat_name, rsvp_id, seat_order)
        VALUES (${table_number}, ${table_label || null}, ${seatName}, ${rsvpId}, ${i})
      `;
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Failed to update seating chart' });
  }
}
