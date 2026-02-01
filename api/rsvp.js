import { neon } from '@neondatabase/serverless';
import { sendRsvpNotifications } from './send-rsvp-notifications.js';

// Rate limiting for RSVP submissions - stricter limits
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 3600000; // 1 hour
const RATE_LIMIT_MAX = 5; // 5 RSVP submissions per hour per IP

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

  // Handle browser pre-flight checks
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Rate limiting
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ error: 'Too many submissions. Please try again later.' });
  }

  // Initialize Database Connection
  const sql = neon(process.env.DATABASE_URL);

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, phone, attending, guestCount, guests } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !attending) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Normalize phone number (remove all non-digits for comparison)
    const normalizedPhone = phone.replace(/\D/g, '');

    // Check for duplicate email
    const existingEmail = await sql`
      SELECT id, email FROM rsvps WHERE LOWER(email) = LOWER(${email})
    `;

    if (existingEmail.length > 0) {
      return res.status(409).json({
        error: 'An RSVP has already been submitted with this email address. If you need to make changes, please use the modify RSVP link.'
      });
    }

    // Check for duplicate phone number
    const existingPhone = await sql`
      SELECT id, phone FROM rsvps WHERE REGEXP_REPLACE(phone, '[^0-9]', '', 'g') = ${normalizedPhone}
    `;

    if (existingPhone.length > 0) {
      return res.status(409).json({
        error: 'An RSVP has already been submitted with this phone number. If you need to make changes, please use the modify RSVP link.'
      });
    }

    // Validate guests if attending
    if (attending === 'yes') {
      if (!guestCount || guestCount < 1) {
        return res.status(400).json({ error: 'Please specify the number of guests' });
      }
      if (!guests || !Array.isArray(guests) || guests.length !== guestCount) {
        return res.status(400).json({ error: 'Please provide details for all guests in your party' });
      }
      // Check that all guests have names
      for (let i = 0; i < guests.length; i++) {
        if (!guests[i].name || guests[i].name.trim() === '') {
          return res.status(400).json({ error: `Please provide a name for Guest ${i + 1}` });
        }
      }
    }

    // Convert guests array to JSON string for storage (includes name, dietary, allergies per guest)
    const guestsJson = attending === 'yes' ? JSON.stringify(guests) : null;

    // Insert RSVP
    await sql`
      INSERT INTO rsvps (name, email, phone, attending, guests, guest_names, dietary, allergies, created_at)
      VALUES (
        ${name},
        ${email.toLowerCase()},
        ${phone},
        ${attending},
        ${attending === 'yes' ? guestCount : 0},
        ${guestsJson},
        ${null},
        ${null},
        NOW()
      )
    `;

    // Send confirmation email and SMS (non-blocking - don't fail RSVP if notifications fail)
    sendRsvpNotifications({
      name,
      email: email.toLowerCase(),
      phone,
      attending,
      guestCount: attending === 'yes' ? guestCount : 0,
      guests: attending === 'yes' ? guests : [],
    }).then(result => {
      console.log('Notification results:', result);
    }).catch(err => {
      console.error('Notification error (non-critical):', err);
    });

    return res.status(200).json({
      success: true,
      message: 'RSVP submitted successfully'
    });

  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({
      error: 'Failed to submit RSVP. Please try again.'
    });
  }
}
