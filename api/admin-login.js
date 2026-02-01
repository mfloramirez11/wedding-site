// Simple in-memory rate limiting for login attempts
const loginAttempts = new Map();
const LOCKOUT_WINDOW = 900000; // 15 minutes
const MAX_ATTEMPTS = 5; // 5 attempts before lockout

function checkLoginRateLimit(ip) {
  const now = Date.now();

  if (!loginAttempts.has(ip)) {
    loginAttempts.set(ip, { attempts: 0, lockoutUntil: 0 });
  }

  const record = loginAttempts.get(ip);

  // Check if currently locked out
  if (record.lockoutUntil > now) {
    const remainingMinutes = Math.ceil((record.lockoutUntil - now) / 60000);
    return { allowed: false, remainingMinutes };
  }

  // Reset if lockout has expired
  if (record.lockoutUntil <= now && record.attempts >= MAX_ATTEMPTS) {
    record.attempts = 0;
  }

  return { allowed: true };
}

function recordFailedAttempt(ip) {
  const now = Date.now();
  const record = loginAttempts.get(ip) || { attempts: 0, lockoutUntil: 0 };
  record.attempts++;

  if (record.attempts >= MAX_ATTEMPTS) {
    record.lockoutUntil = now + LOCKOUT_WINDOW;
  }

  loginAttempts.set(ip, record);
}

function resetAttempts(ip) {
  loginAttempts.delete(ip);
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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';

  // Check rate limit
  const rateCheck = checkLoginRateLimit(clientIp);
  if (!rateCheck.allowed) {
    return res.status(429).json({
      error: `Too many login attempts. Please try again in ${rateCheck.remainingMinutes} minutes.`
    });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  // Get credentials from environment variables
  const validUsers = {
    'manny': process.env.ADMIN_PASSWORD,
    'celesti': process.env.ADMIN_PASSWORD
  };

  if (!process.env.ADMIN_PASSWORD) {
    console.error('ADMIN_PASSWORD environment variable not set');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const normalizedUsername = username.toLowerCase().trim();

  if (validUsers[normalizedUsername] && validUsers[normalizedUsername] === password) {
    // Successful login - reset attempts
    resetAttempts(clientIp);

    return res.status(200).json({
      success: true,
      token: process.env.ADMIN_PASSWORD // This becomes the Bearer token for API calls
    });
  } else {
    // Failed login - record attempt
    recordFailedAttempt(clientIp);

    const record = loginAttempts.get(clientIp);
    const remainingAttempts = MAX_ATTEMPTS - record.attempts;

    return res.status(401).json({
      error: 'Invalid username or password',
      remainingAttempts: remainingAttempts > 0 ? remainingAttempts : 0
    });
  }
}
