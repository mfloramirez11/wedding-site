import { Resend } from 'resend';
import twilio from 'twilio';
import { generateRsvpConfirmationEmail, generateRsvpConfirmationText } from './lib/email-template.js';

/**
 * Sends RSVP confirmation notifications via email and SMS
 * This is an internal utility function, not a public API endpoint
 */

// Initialize Resend client
function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured - email notifications disabled');
    return null;
  }
  return new Resend(process.env.RESEND_API_KEY);
}

// Initialize Twilio client
function getTwilioClient() {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
    console.warn('Twilio not fully configured - SMS notifications disabled');
    return null;
  }
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

/**
 * Send confirmation email via Resend
 */
export async function sendConfirmationEmail({ name, email, attending, guestCount, guests }) {
  const resend = getResendClient();
  if (!resend) {
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const htmlContent = generateRsvpConfirmationEmail({ name, email, attending, guestCount, guests });
    const textContent = generateRsvpConfirmationText({ name, email, attending, guestCount, guests });

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Manny & Celesti <rsvp@mannyandcelesti.com>',
      to: email,
      subject: attending === 'yes'
        ? "We can't wait to see you! 💍 RSVP Confirmed"
        : "Thank you for your RSVP - Manny & Celesti",
      html: htmlContent,
      text: textContent,
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error: error.message };
    }

    console.log('Email sent successfully:', data?.id);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Format phone number to E.164 format for Twilio
 * Assumes US numbers if no country code provided
 */
function formatPhoneForTwilio(phone) {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // If it's 10 digits, assume US and add +1
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  // If it's 11 digits and starts with 1, add +
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }

  // Otherwise, assume it already has country code
  if (!digits.startsWith('+')) {
    return `+${digits}`;
  }

  return digits;
}

/**
 * Send confirmation SMS via Twilio
 */
export async function sendConfirmationSms({ name, phone, attending }) {
  const twilioClient = getTwilioClient();
  if (!twilioClient) {
    return { success: false, error: 'SMS service not configured' };
  }

  try {
    const formattedPhone = formatPhoneForTwilio(phone);
    const editUrl = 'https://mannyandcelesti.com/modify-rsvp.html';

    let message;
    if (attending === 'yes') {
      message = `Hi ${name.split(' ')[0]}! 💍 Thank you for your RSVP - we're so excited to celebrate with you on April 4th!\n\nNeed to make changes? Edit here: ${editUrl}\n\n📅 Last day to edit: March 15, 2026\n\nQuestions? Reply to this text or call (323) 972-3556\n\n- Manny & Celesti`;
    } else {
      message = `Hi ${name.split(' ')[0]}, thank you for letting us know. We'll miss you at the wedding!\n\nChanged your mind? Update your RSVP here: ${editUrl}\n\n📅 Deadline: March 15, 2026\n\n- Manny & Celesti`;
    }

    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone,
    });

    console.log('SMS sent successfully:', result.sid);
    return { success: true, messageSid: result.sid };
  } catch (error) {
    console.error('SMS send error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send both email and SMS notifications
 * Returns results for both, doesn't fail if one fails
 */
export async function sendRsvpNotifications({ name, email, phone, attending, guestCount, guests }) {
  const [emailResult, smsResult] = await Promise.all([
    sendConfirmationEmail({ name, email, attending, guestCount, guests }),
    sendConfirmationSms({ name, phone, attending }),
  ]);

  return {
    email: emailResult,
    sms: smsResult,
  };
}
