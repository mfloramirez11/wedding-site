import { neon } from '@neondatabase/serverless';
import { sendLAShowerNotifications } from './la-shower-notifications.js';

const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 3600000;
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
  if (allowedOrigins.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ error: 'Demasiados intentos. Por favor intenta más tarde.' });
  }

  const sql = neon(process.env.DATABASE_URL);

  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const { name, email, phone, attending, guestCount, guests } = req.body;

    if (!name || !attending) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    // Duplicate checks only if values were provided
    if (email) {
      const existingEmail = await sql`
        SELECT id FROM spanish_rsvps WHERE LOWER(email) = LOWER(${email})
      `;
      if (existingEmail.length > 0) {
        return res.status(409).json({
          error: 'Ya se recibió una confirmación con este correo electrónico. Si necesitas hacer cambios, por favor contáctanos.'
        });
      }
    }

    if (phone) {
      const normalizedPhone = phone.replace(/\D/g, '');
      if (normalizedPhone) {
        const existingPhone = await sql`
          SELECT id FROM spanish_rsvps WHERE REGEXP_REPLACE(phone, '[^0-9]', '', 'g') = ${normalizedPhone}
        `;
        if (existingPhone.length > 0) {
          return res.status(409).json({
            error: 'Ya se recibió una confirmación con este número de teléfono. Si necesitas hacer cambios, por favor contáctanos.'
          });
        }
      }
    }

    if (attending === 'yes') {
      if (!guestCount || guestCount < 1) {
        return res.status(400).json({ error: 'Por favor indica el número de invitados' });
      }
      if (!guests || !Array.isArray(guests) || guests.length !== guestCount) {
        return res.status(400).json({ error: 'Por favor proporciona los datos de todos los invitados' });
      }
      for (let i = 0; i < guests.length; i++) {
        if (!guests[i].name || guests[i].name.trim() === '') {
          return res.status(400).json({ error: `Por favor proporciona el nombre del Invitado ${i + 1}` });
        }
      }
    }

    const guestsJson = attending === 'yes' ? JSON.stringify(guests) : null;

    await sql`
      INSERT INTO spanish_rsvps (name, email, phone, attending, guests, guest_names, created_at)
      VALUES (
        ${name},
        ${email ? email.toLowerCase() : null},
        ${phone || null},
        ${attending},
        ${attending === 'yes' ? guestCount : 0},
        ${guestsJson},
        NOW()
      )
    `;

    let notificationResult;
    try {
      notificationResult = await sendLAShowerNotifications({
        name,
        email: email ? email.toLowerCase() : null,
        phone: phone || null,
        attending,
        guestCount: attending === 'yes' ? guestCount : 0,
        guests: attending === 'yes' ? guests : [],
      });
      console.log('LA shower notification results:', notificationResult);
    } catch (err) {
      console.error('LA shower notification error:', err);
      notificationResult = { email: { success: false, error: err.message } };
    }

    return res.status(200).json({
      success: true,
      message: 'Confirmación enviada exitosamente',
      notifications: {
        email: notificationResult?.email?.success || false,
        emailError: notificationResult?.email?.error || null,
      }
    });

  } catch (error) {
    console.error('Spanish RSVP error:', error);
    return res.status(500).json({ error: 'Error al enviar la confirmación. Por favor intenta de nuevo.' });
  }
}
