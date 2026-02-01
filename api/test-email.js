import { Resend } from 'resend';

export default async function handler(req, res) {
  // Only allow GET for easy testing
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const testEmail = req.query.email || 'test@example.com';

  console.log('=== EMAIL TEST START ===');
  console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
  console.log('RESEND_API_KEY length:', process.env.RESEND_API_KEY?.length || 0);
  console.log('RESEND_FROM_EMAIL:', process.env.RESEND_FROM_EMAIL);

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({
      success: false,
      error: 'RESEND_API_KEY not configured',
      env: {
        hasKey: false,
        fromEmail: process.env.RESEND_FROM_EMAIL || null
      }
    });
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    console.log('Sending test email to:', testEmail);

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Manny & Celesti <rsvp@mannyandcelesti.com>',
      to: testEmail,
      subject: 'Test Email - RSVP System',
      html: '<h1>Test Successful!</h1><p>Your email configuration is working.</p>',
    });

    console.log('Resend response - data:', data);
    console.log('Resend response - error:', error);

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
        errorDetails: error,
        env: {
          hasKey: true,
          keyLength: process.env.RESEND_API_KEY.length,
          fromEmail: process.env.RESEND_FROM_EMAIL
        }
      });
    }

    return res.status(200).json({
      success: true,
      emailId: data?.id,
      sentTo: testEmail,
      env: {
        hasKey: true,
        keyLength: process.env.RESEND_API_KEY.length,
        fromEmail: process.env.RESEND_FROM_EMAIL
      }
    });
  } catch (err) {
    console.error('Exception:', err);
    return res.status(500).json({
      success: false,
      error: err.message,
      stack: err.stack,
      env: {
        hasKey: !!process.env.RESEND_API_KEY,
        keyLength: process.env.RESEND_API_KEY?.length || 0,
        fromEmail: process.env.RESEND_FROM_EMAIL
      }
    });
  }
}
