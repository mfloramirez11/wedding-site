import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
  // 1. Handle CORS (Cross-Origin Resource Sharing)
  response.setHeader('Access-Control-Allow-Credentials', true);
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  response.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle browser pre-flight checks
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  // 2. Only allow POST requests
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 3. Get data from the frontend
    const { name, email, phone, attending, guests, dietary, allergies } = request.body;

    // Validation (Optional but recommended)
    if (!name || !email || !phone) {
        return response.status(400).json({ error: 'Name, Email, and Phone are required.' });
    }

    // 4. Insert into Vercel Postgres
    // NOTE: Ensure your table name matches "rsvps" below
    await sql`
      INSERT INTO rsvps (name, email, phone, attending, guests, dietary, allergies)
      VALUES (${name}, ${email}, ${phone}, ${attending}, ${guests}, ${dietary}, ${allergies});
    `;

    return response.status(200).json({ message: 'RSVP received successfully!' });
    
  } catch (error) {
    console.error('Database Error:', error);
    return response.status(500).json({ error: 'Internal Server Error' });
  }
}