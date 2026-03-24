import { neon } from '@neondatabase/serverless';

function auth(req) {
  const authHeader = req.headers.authorization;
  const password = process.env.ADMIN_PASSWORD;
  return authHeader && authHeader === `Bearer ${password}`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!auth(req)) return res.status(401).json({ error: 'Unauthorized' });

  const { key } = req.query;
  if (!key) return res.status(400).json({ error: 'Missing key' });

  const sql = neon(process.env.DATABASE_URL);
  const rows = await sql`SELECT value, updated_at FROM settings WHERE key = ${key}`;
  if (!rows.length) return res.status(200).json({ value: null });
  return res.status(200).json({ value: rows[0].value, updated_at: rows[0].updated_at });
}
