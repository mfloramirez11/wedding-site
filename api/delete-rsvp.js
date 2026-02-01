import { neon } from '@neondatabase/serverless';

// Simple in-memory rate limiting
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 delete requests per minute

function checkRateLimit(ip) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, []);
  }

  const requests = rateLimitMap.get(ip).filter(time => time > windowStart);
  requests.push(now);
  rateLimitMap.set(ip, requests);

  return requests.length <= RATE_LIMIT_MAX;
}

export default async function handler(req, res) {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // CORS - restrict to your domain
  const allowedOrigins = ['https://mannyandcelesti.com', 'https://www.mannyandcelesti.com'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Rate limiting
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  // Only allow DELETE or POST requests
  if (req.method !== 'DELETE' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Auth check - password from environment variable
  const authHeader = req.headers.authorization;
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    console.error('ADMIN_PASSWORD environment variable not set');
    return res.status(500).json({ error: 'Server configuration error' });
  }

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
