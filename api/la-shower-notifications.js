import { Resend } from 'resend';
import { generateLAShowerConfirmationEmail, generateLAShowerConfirmationText } from './lib/la-shower-email-template.js';

const ADMIN_EMAIL = 'mannyandcelesti@gmail.com';

function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured - email notifications disabled');
    return null;
  }
  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendLAShowerConfirmationEmail({ name, email, attending, guestCount, guests }) {
  const resend = getResendClient();
  if (!resend) return { success: false, error: 'Email service not configured' };

  try {
    const htmlContent = generateLAShowerConfirmationEmail({ name, attending, guestCount, guests });
    const textContent = generateLAShowerConfirmationText({ name, attending, guestCount, guests });

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Manny & Celesti <rsvp@mannyandcelesti.com>',
      to: email,
      subject: attending === 'yes'
        ? "We can't wait to celebrate with you! 🌸 Baby Shower RSVP Confirmed"
        : "Thank you for your RSVP – Baby Shower",
      html: htmlContent,
      text: textContent,
    });

    if (error) {
      console.error('LA shower email error:', error);
      return { success: false, error: error.message };
    }

    console.log('LA shower confirmation email sent:', data?.id);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error('LA shower email send error:', error);
    return { success: false, error: error.message };
  }
}

export async function sendLAShowerAdminNotification({ name, email, phone, attending, guestCount, guests }) {
  const resend = getResendClient();
  if (!resend) return { success: false, error: 'Email service not configured' };

  try {
    const emoji = attending === 'yes' ? '🎀' : '💌';

    let guestList = '';
    if (attending === 'yes' && guests && guests.length > 0) {
      guestList = guests.map((g, i) => {
        let details = `  ${i + 1}. ${g.name}`;
        if (g.dietary) details += ` (Diet: ${g.dietary})`;
        if (g.allergies) details += ` (Allergies: ${g.allergies})`;
        return details;
      }).join('\n');
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #fff5f8;">
        <h2 style="color: #6d2b47;">${emoji} LA Baby Shower – New RSVP ${emoji}</h2>
        <div style="background: #fce4ec; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #e07aaa;">
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email || '—'}</p>
          <p><strong>Phone:</strong> ${phone || '—'}</p>
          <p><strong>Attending:</strong> ${attending === 'yes' ? '✅ Yes' : '❌ No'}</p>
          ${attending === 'yes' ? `<p><strong>Guest Count:</strong> ${guestCount}</p>` : ''}
          ${guestList ? `<p><strong>Guests:</strong></p><pre style="background:#fff;padding:10px;border-radius:6px;">${guestList}</pre>` : ''}
        </div>
        <p style="color: #888; font-size: 12px;">
          View all RSVPs at <a href="https://mannyandcelesti.com/admin.html">mannyandcelesti.com/admin.html</a> (🇲🇽 LA Shower tab)
        </p>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Manny & Celesti <rsvp@mannyandcelesti.com>',
      to: ADMIN_EMAIL,
      subject: `${emoji} LA Baby Shower – New RSVP: ${name} (${attending === 'yes' ? 'Attending' : 'Declined'})`,
      html: htmlContent,
    });

    if (error) {
      console.error('LA shower admin notification error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error('LA shower admin notification error:', error);
    return { success: false, error: error.message };
  }
}

export async function sendLAShowerNotifications({ name, email, phone, attending, guestCount, guests }) {
  const [emailResult, adminResult] = await Promise.all([
    email ? sendLAShowerConfirmationEmail({ name, email, attending, guestCount, guests }) : Promise.resolve({ success: false, error: 'No email provided' }),
    sendLAShowerAdminNotification({ name, email, phone, attending, guestCount, guests }),
  ]);

  return { email: emailResult, admin: adminResult };
}
