import { neon } from '@neondatabase/serverless';

// Rate limiting for public updates
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 3600000; // 1 hour
const RATE_LIMIT_MAX = 10; // 10 updates per hour per IP

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
    return res.status(429).json({ error: 'Too many updates. Please try again later.' });
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
    const { id, name, email, phone, attending, guests, guestData } = req.body;

    if (!id || !email || !phone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Normalize phone number (remove non-digits)
    const normalizedPhone = phone.replace(/\D/g, '');

    // Verify the RSVP belongs to this email/phone combination (security check)
    const existing = await sql`
      SELECT * FROM rsvps
      WHERE id = ${id}
      AND LOWER(email) = LOWER(${email})
      AND REGEXP_REPLACE(phone, '[^0-9]', '', 'g') = ${normalizedPhone}
    `;

    if (existing.length === 0) {
      return res.status(403).json({
        error: 'Unable to verify your identity. Please try looking up your RSVP again.'
      });
    }

    // Prepare guest data for storage
    let guestNamesJson;
    if (guestData && Array.isArray(guestData)) {
      guestNamesJson = JSON.stringify(guestData);
    } else {
      guestNamesJson = existing[0].guest_names;
    }

    // Update the RSVP (only allow updating certain fields for security)
    await sql`
      UPDATE rsvps SET
        name = ${name || existing[0].name},
        attending = ${attending || existing[0].attending},
        guests = ${guests !== undefined ? guests : existing[0].guests},
        guest_names = ${guestNamesJson}
      WHERE id = ${id}
    `;

    return res.status(200).json({
      success: true,
      message: 'RSVP updated successfully'
    });

  } catch (error) {
    console.error('Update error:', error);
    return res.status(500).json({
      error: 'Failed to update RSVP. Please try again.'
    });
  }
}
