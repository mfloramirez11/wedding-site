import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  const sql = neon(process.env.DATABASE_URL);
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, phone, attending, guests } = req.body;

    // Validate required fields
    if (!name || !email || !attending) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check for duplicate email
    const existing = await sql`
      SELECT email FROM rsvps WHERE LOWER(email) = LOWER(${email})
    `;

    if (existing.length > 0) {
      return res.status(409).json({ 
        error: 'An RSVP has already been submitted with this email address' 
      });
    }

    // Insert RSVP
    await sql`
      INSERT INTO rsvps (name, email, phone, attending, guests, created_at)
      VALUES (${name}, ${email}, ${phone || null}, ${attending}, ${guests || 1}, NOW())
    `;

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
