import { neon } from '@neondatabase/serverless';

const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 30;

function checkRateLimit(ip) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  if (!rateLimitMap.has(ip)) rateLimitMap.set(ip, []);
  const requests = rateLimitMap.get(ip).filter(t => t > windowStart);
  requests.push(now);
  rateLimitMap.set(ip, requests);
  return requests.length <= RATE_LIMIT_MAX;
}

function verifyToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  const token = authHeader.substring(7);
  return token === process.env.ADMIN_PASSWORD;
}

export default async function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  if (!verifyToken(req)) return res.status(401).json({ error: 'Unauthorized' });

  const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(clientIp)) return res.status(429).json({ error: 'Too many requests' });

  const sql = neon(process.env.DATABASE_URL);

  try {
    const rsvps = await sql`
      SELECT id, name, email, phone, attending, guests, guest_names, created_at
      FROM baby_shower_rsvps
      ORDER BY created_at DESC
    `;

    const total = rsvps.length;
    const attending = rsvps.filter(r => r.attending === 'yes').length;
    const declined = rsvps.filter(r => r.attending === 'no').length;
    const totalGuests = rsvps
      .filter(r => r.attending === 'yes')
      .reduce((sum, r) => sum + (r.guests || 0), 0);

    return res.status(200).json({
      rsvps,
      stats: { total, attending, declined, totalGuests }
    });
  } catch (error) {
    console.error('Baby shower get-rsvps error:', error);
    return res.status(500).json({ error: 'Failed to fetch RSVPs' });
  }
}
