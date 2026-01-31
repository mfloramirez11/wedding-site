import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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
