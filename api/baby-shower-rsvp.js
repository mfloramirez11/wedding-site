import { neon } from '@neondatabase/serverless';
import { sendBabyShowerNotifications } from './baby-shower-notifications.js';

// Rate limiting
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 3600000; // 1 hour
const RATE_LIMIT_MAX = 5;

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
  res.setHeader('X-XSS-Protection', '1; mode=block');

  const allowedOrigins = ['https://mannyandcelesti.com', 'https://www.mannyandcelesti.com'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ error: 'Too many submissions. Please try again later.' });
  }

  const sql = neon(process.env.DATABASE_URL);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, phone, attending, guestCount, guests } = req.body;

    if (!name || !email || !phone || !attending) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const normalizedPhone = phone.replace(/\D/g, '');

    // Check duplicate email
    const existingEmail = await sql`
      SELECT id FROM baby_shower_rsvps WHERE LOWER(email) = LOWER(${email})
    `;
    if (existingEmail.length > 0) {
      return res.status(409).json({
        error: 'An RSVP has already been submitted with this email address. If you need to make changes, please use the modify RSVP link.'
      });
    }

    // Check duplicate phone
    const existingPhone = await sql`
      SELECT id FROM baby_shower_rsvps WHERE REGEXP_REPLACE(phone, '[^0-9]', '', 'g') = ${normalizedPhone}
    `;
    if (existingPhone.length > 0) {
      return res.status(409).json({
        error: 'An RSVP has already been submitted with this phone number. If you need to make changes, please use the modify RSVP link.'
      });
    }

    // Validate guests
    if (attending === 'yes') {
      if (!guestCount || guestCount < 1) {
        return res.status(400).json({ error: 'Please specify the number of guests' });
      }
      if (!guests || !Array.isArray(guests) || guests.length !== guestCount) {
        return res.status(400).json({ error: 'Please provide details for all guests in your party' });
      }
      for (let i = 0; i < guests.length; i++) {
        if (!guests[i].name || guests[i].name.trim() === '') {
          return res.status(400).json({ error: `Please provide a name for Guest ${i + 1}` });
        }
      }
    }

    const guestsJson = attending === 'yes' ? JSON.stringify(guests) : null;

    await sql`
      INSERT INTO baby_shower_rsvps (name, email, phone, attending, guests, guest_names, created_at)
      VALUES (
        ${name},
        ${email.toLowerCase()},
        ${phone},
        ${attending},
        ${attending === 'yes' ? guestCount : 0},
        ${guestsJson},
        NOW()
      )
    `;

    let notificationResult;
    try {
      notificationResult = await sendBabyShowerNotifications({
        name,
        email: email.toLowerCase(),
        phone,
        attending,
        guestCount: attending === 'yes' ? guestCount : 0,
        guests: attending === 'yes' ? guests : [],
      });
      console.log('Baby shower notification results:', notificationResult);
    } catch (err) {
      console.error('Baby shower notification error:', err);
      notificationResult = { email: { success: false, error: err.message } };
    }

    return res.status(200).json({
      success: true,
      message: 'RSVP submitted successfully',
      notifications: {
        email: notificationResult?.email?.success || false,
        emailError: notificationResult?.email?.error || null,
      }
    });

  } catch (error) {
    console.error('Baby shower RSVP error:', error);
    return res.status(500).json({ error: 'Failed to submit RSVP. Please try again.' });
  }
}
