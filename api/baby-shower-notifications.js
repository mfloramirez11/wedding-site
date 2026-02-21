import { Resend } from 'resend';
import { generateBabyShowerConfirmationEmail, generateBabyShowerConfirmationText } from './lib/baby-shower-email-template.js';

const ADMIN_EMAIL = 'mannyandcelesti@gmail.com';

function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured - email notifications disabled');
    return null;
  }
  return new Resend(process.env.RESEND_API_KEY);
}

/**
 * Send admin notification when someone RSVPs or modifies for baby shower
 */
export async function sendBabyShowerAdminNotification({ name, email, phone, attending, guestCount, guests, isUpdate = false }) {
  const resend = getResendClient();
  if (!resend) return { success: false, error: 'Email service not configured' };

  try {
    const action = isUpdate ? 'Updated' : 'New';
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
        <h2 style="color: #6d2b47;">${emoji} Baby Shower – ${action} RSVP ${emoji}</h2>
        <div style="background: #fce4ec; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #e07aaa;">
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Attending:</strong> ${attending === 'yes' ? '✅ Yes' : '❌ No'}</p>
          ${attending === 'yes' ? `<p><strong>Guest Count:</strong> ${guestCount}</p>` : ''}
          ${guestList ? `<p><strong>Guests:</strong></p><pre style="background:#fff;padding:10px;border-radius:6px;">${guestList}</pre>` : ''}
        </div>
        <p style="color: #888; font-size: 12px;">
          View all RSVPs at <a href="https://mannyandcelesti.com/admin.html">mannyandcelesti.com/admin.html</a>
        </p>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Manny & Celesti <rsvp@mannyandcelesti.com>',
      to: ADMIN_EMAIL,
      subject: `${emoji} Baby Shower – ${action} RSVP: ${name} (${attending === 'yes' ? 'Attending' : 'Declined'})`,
      html: htmlContent,
    });

    if (error) {
      console.error('Baby shower admin notification error:', error);
      return { success: false, error: error.message };
    }

    console.log('Baby shower admin notification sent:', data?.id);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error('Baby shower admin notification error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send confirmation email to the guest
 */
export async function sendBabyShowerConfirmationEmail({ name, email, attending, guestCount, guests }) {
  const resend = getResendClient();
  if (!resend) return { success: false, error: 'Email service not configured' };

  try {
    const htmlContent = generateBabyShowerConfirmationEmail({ name, email, attending, guestCount, guests });
    const textContent = generateBabyShowerConfirmationText({ name, email, attending, guestCount, guests });

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
      console.error('Baby shower email error:', error);
      return { success: false, error: error.message };
    }

    console.log('Baby shower email sent:', data?.id);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error('Baby shower email send error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send both guest confirmation and admin notification
 */
export async function sendBabyShowerNotifications({ name, email, phone, attending, guestCount, guests, isUpdate = false }) {
  const [emailResult, adminResult] = await Promise.all([
    sendBabyShowerConfirmationEmail({ name, email, attending, guestCount, guests }),
    sendBabyShowerAdminNotification({ name, email, phone, attending, guestCount, guests, isUpdate }),
  ]);

  return { email: emailResult, admin: adminResult };
}
