import { neon } from '@neondatabase/serverless';

// Rate limiting for lookups - prevent enumeration attacks
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 300000; // 5 minutes
const RATE_LIMIT_MAX = 10; // 10 lookups per 5 minutes per IP

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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Rate limiting
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ error: 'Too many attempts. Please try again in a few minutes.' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check if deadline has passed (March 15, 2026)
  const deadline = new Date('2026-03-15T23:59:59');
  const now = new Date();

  if (now > deadline) {
    return res.status(403).json({
      error: 'The deadline for RSVP changes has passed. Please contact us directly.'
    });
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    const { email, phone } = req.body;

    if (!email || !phone) {
      return res.status(400).json({ error: 'Email and phone number are required' });
    }

    // Normalize phone number (remove non-digits)
    const normalizedPhone = phone.replace(/\D/g, '');

    // Look up RSVP by email AND phone (both must match for security)
    const result = await sql`
      SELECT id, name, email, phone, attending, guests, guest_names, dietary, allergies, created_at
      FROM rsvps
      WHERE LOWER(email) = LOWER(${email})
      AND REGEXP_REPLACE(phone, '[^0-9]', '', 'g') = ${normalizedPhone}
    `;

    if (result.length === 0) {
      return res.status(404).json({
        error: 'No RSVP found with those details. Please check your email and phone number.'
      });
    }

    // Return the RSVP (without sensitive info like exact phone - they already know it)
    return res.status(200).json({
      success: true,
      rsvp: result[0]
    });

  } catch (error) {
    console.error('Lookup error:', error);
    return res.status(500).json({
      error: 'Failed to look up RSVP. Please try again.'
    });
  }
}
