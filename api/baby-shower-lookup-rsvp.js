import { neon } from '@neondatabase/serverless';

const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 300000; // 5 minutes
const RATE_LIMIT_MAX = 10;

function checkRateLimit(ip) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  if (!rateLimitMap.has(ip)) rateLimitMap.set(ip, []);
  const requests = rateLimitMap.get(ip).filter(t => t > windowStart);
  requests.push(now);
  rateLimitMap.set(ip, requests);
  return requests.length <= RATE_LIMIT_MAX;
}

export default async function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  const allowedOrigins = ['https://mannyandcelesti.com', 'https://www.mannyandcelesti.com'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Deadline check
  const deadline = new Date('2026-05-25T23:59:59');
  if (new Date() > deadline) {
    return res.status(403).json({ error: 'The RSVP modification deadline has passed. Please contact us directly.' });
  }

  const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(clientIp)) return res.status(429).json({ error: 'Too many requests. Please try again later.' });

  const sql = neon(process.env.DATABASE_URL);

  try {
    const { email, phone } = req.body;

    if (!email && !phone) {
      return res.status(400).json({ error: 'Please provide your email or phone number' });
    }

    let rsvp = null;

    if (email) {
      const result = await sql`
        SELECT id, name, email, phone, attending, guests, guest_names
        FROM baby_shower_rsvps
        WHERE LOWER(email) = LOWER(${email})
        LIMIT 1
      `;
      if (result.length > 0) rsvp = result[0];
    }

    if (!rsvp && phone) {
      const normalizedPhone = phone.replace(/\D/g, '');
      const result = await sql`
        SELECT id, name, email, phone, attending, guests, guest_names
        FROM baby_shower_rsvps
        WHERE REGEXP_REPLACE(phone, '[^0-9]', '', 'g') = ${normalizedPhone}
        LIMIT 1
      `;
      if (result.length > 0) rsvp = result[0];
    }

    if (!rsvp) {
      return res.status(404).json({ error: 'No RSVP found with that information. Please check your email or phone number.' });
    }

    return res.status(200).json({ success: true, rsvp });
  } catch (error) {
    console.error('Baby shower lookup error:', error);
    return res.status(500).json({ error: 'Failed to look up RSVP. Please try again.' });
  }
}
