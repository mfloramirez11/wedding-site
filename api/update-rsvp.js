import { neon } from '@neondatabase/serverless';

// Simple in-memory rate limiting
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 20; // 20 requests per minute for updates

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
  res.setHeader('Access-Control-Allow-Methods', 'PUT, PATCH, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Rate limiting
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  // Only allow PUT, PATCH, or POST requests
  if (req.method !== 'PUT' && req.method !== 'PATCH' && req.method !== 'POST') {
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
    const { id, name, email, phone, attending, guests, guestData, guestNames, dietary, allergies } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Missing RSVP ID' });
    }

    // Check if RSVP exists
    const existing = await sql`SELECT * FROM rsvps WHERE id = ${id}`;

    if (existing.length === 0) {
      return res.status(404).json({ error: 'RSVP not found' });
    }

    // Check for duplicate email (excluding current record)
    if (email) {
      const existingEmail = await sql`
        SELECT id FROM rsvps WHERE LOWER(email) = LOWER(${email}) AND id != ${id}
      `;
      if (existingEmail.length > 0) {
        return res.status(409).json({ error: 'Another RSVP already uses this email address' });
      }
    }

    // Check for duplicate phone (excluding current record)
    if (phone) {
      const normalizedPhone = phone.replace(/\D/g, '');
      const existingPhone = await sql`
        SELECT id FROM rsvps WHERE REGEXP_REPLACE(phone, '[^0-9]', '', 'g') = ${normalizedPhone} AND id != ${id}
      `;
      if (existingPhone.length > 0) {
        return res.status(409).json({ error: 'Another RSVP already uses this phone number' });
      }
    }

    // Handle guest data - supports both new format (guestData with per-guest dietary/allergies)
    // and legacy format (guestNames array of strings)
    let guestNamesJson;
    if (guestData && Array.isArray(guestData)) {
      // New format: array of { name, dietary, allergies } objects
      guestNamesJson = JSON.stringify(guestData);
    } else if (guestNames && Array.isArray(guestNames)) {
      // Legacy format: array of strings - convert to new format
      guestNamesJson = JSON.stringify(guestNames.map(n => ({ name: n, dietary: '', allergies: '' })));
    } else {
      guestNamesJson = existing[0].guest_names;
    }

    // Update the RSVP
    // Note: dietary and allergies columns kept for backwards compatibility but now stored per-guest
    await sql`
      UPDATE rsvps SET
        name = ${name || existing[0].name},
        email = ${email ? email.toLowerCase() : existing[0].email},
        phone = ${phone || existing[0].phone},
        attending = ${attending || existing[0].attending},
        guests = ${guests !== undefined ? guests : existing[0].guests},
        guest_names = ${guestNamesJson},
        dietary = ${dietary !== undefined ? (dietary || null) : existing[0].dietary},
        allergies = ${allergies !== undefined ? (allergies || null) : existing[0].allergies}
      WHERE id = ${id}
    `;

    return res.status(200).json({
      success: true,
      message: 'RSVP updated successfully'
    });

  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({
      error: 'Failed to update RSVP'
    });
  }
}
