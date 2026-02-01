import { neon } from '@neondatabase/serverless';

// Simple in-memory rate limiting
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 30; // 30 requests per minute

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Rate limiting
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  const sql = neon(process.env.DATABASE_URL);

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Password from environment variable
  const authHeader = req.headers.authorization;
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    console.error('ADMIN_PASSWORD environment variable not set');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  if (!authHeader || authHeader !== `Bearer ${password}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Get all RSVPs ordered by creation date
    const result = await sql`
      SELECT id, name, email, phone, attending, guests, guest_names, dietary, allergies, created_at
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
