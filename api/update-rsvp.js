import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,PUT,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow PUT, PATCH, or POST requests
  if (req.method !== 'PUT' && req.method !== 'PATCH' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Auth check
  const authHeader = req.headers.authorization;
  const password = 'MannyAndCelesti2026';

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
