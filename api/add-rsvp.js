import { neon } from '@neondatabase/serverless';

// Simple in-memory rate limiting
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 20; // 20 requests per minute

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
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Rate limiting
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
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
    const { name, email, phone, attending, guests, guestData } = req.body;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Check for duplicate email
    const existingEmail = await sql`
      SELECT id FROM rsvps WHERE LOWER(email) = LOWER(${email})
    `;
    if (existingEmail.length > 0) {
      return res.status(409).json({ error: 'An RSVP with this email already exists' });
    }

    // Check for duplicate phone (if provided)
    if (phone) {
      const normalizedPhone = phone.replace(/\D/g, '');
      if (normalizedPhone.length >= 10) {
        const existingPhone = await sql`
          SELECT id FROM rsvps WHERE REGEXP_REPLACE(phone, '[^0-9]', '', 'g') = ${normalizedPhone}
        `;
        if (existingPhone.length > 0) {
          return res.status(409).json({ error: 'An RSVP with this phone number already exists' });
        }
      }
    }

    // Prepare guest data
    const guestCount = attending === 'yes' ? (guests || 1) : 0;
    const guestNamesJson = guestData && Array.isArray(guestData)
      ? JSON.stringify(guestData)
      : null;

    // Insert the new RSVP
    const result = await sql`
      INSERT INTO rsvps (name, email, phone, attending, guests, guest_names, dietary, allergies, created_at)
      VALUES (
        ${name},
        ${email.toLowerCase()},
        ${phone || null},
        ${attending || 'yes'},
        ${guestCount},
        ${guestNamesJson},
        ${null},
        ${null},
        NOW()
      )
      RETURNING id
    `;

    return res.status(200).json({
      success: true,
      message: 'RSVP added successfully',
      id: result[0].id
    });

  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({
      error: 'Failed to add RSVP'
    });
  }
}
