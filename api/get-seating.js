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
      SELECT
        sc.id,
        sc.table_number,
        sc.table_label,
        sc.seat_name,
        sc.rsvp_id,
        sc.seat_order,
        r.name AS rsvp_name,
        r.email AS rsvp_email
      FROM seating_chart sc
      LEFT JOIN rsvps r ON sc.rsvp_id = r.id
      ORDER BY sc.table_number ASC, sc.seat_order ASC, sc.id ASC
    `;

    // Group rows into tables
    const tablesMap = {};
    for (const row of rows) {
      const t = row.table_number;
      if (!tablesMap[t]) {
        tablesMap[t] = {
          table_number: t,
          table_label: row.table_label,
          seats: []
        };
      }
      tablesMap[t].seats.push({
        id: row.id,
        seat_name: row.seat_name,
        rsvp_id: row.rsvp_id,
        rsvp_name: row.rsvp_name,
        rsvp_email: row.rsvp_email,
        seat_order: row.seat_order
      });
    }

    const tables = Object.values(tablesMap).sort((a, b) => a.table_number - b.table_number);

    return res.status(200).json({ tables });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Failed to retrieve seating chart' });
  }
}
