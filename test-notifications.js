/**
 * Test script for email and SMS notifications
 * Run with: node test-notifications.js
 *
 * Make sure your .env file has the real credentials before running!
 */

import 'dotenv/config';
import { Resend } from 'resend';
import twilio from 'twilio';

// Test data
const TEST_RSVP = {
  name: 'Test Guest',
  email: 'YOUR_EMAIL_HERE', // <-- Change this to your email
  phone: 'YOUR_PHONE_HERE', // <-- Change this to your phone (format: +1XXXXXXXXXX)
  attending: 'yes',
  guestCount: 2,
  guests: [
    { name: 'Test Guest', dietary: 'Vegetarian', allergies: '' },
    { name: 'Plus One', dietary: '', allergies: 'Shellfish' }
  ]
};

async function testSMS() {
  console.log('\n📱 Testing SMS...\n');

  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
    console.log('❌ Twilio credentials not configured in .env');
    console.log('   Required: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER');
    return;
  }

  if (TEST_RSVP.phone === 'YOUR_PHONE_HERE') {
    console.log('❌ Please update TEST_RSVP.phone in this file with your phone number');
    return;
  }

  try {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    const message = await client.messages.create({
      body: `Hi ${TEST_RSVP.name.split(' ')[0]}! 💍 This is a TEST from your wedding site. RSVP notifications are working!\n\nEdit RSVP: https://mannyandcelesti.com/modify-rsvp.html\n\n- Manny & Celesti`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: TEST_RSVP.phone,
    });

    console.log('✅ SMS sent successfully!');
    console.log(`   Message SID: ${message.sid}`);
    console.log(`   To: ${TEST_RSVP.phone}`);
    console.log(`   From: ${process.env.TWILIO_PHONE_NUMBER}`);
  } catch (error) {
    console.log('❌ SMS failed:', error.message);
    if (error.code === 21608) {
      console.log('   → This number is not verified. On trial, verify it at:');
      console.log('     https://console.twilio.com/us1/develop/phone-numbers/manage/verified');
    }
  }
}

async function testEmail() {
  console.log('\n📧 Testing Email...\n');

  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'your_resend_api_key_here') {
    console.log('❌ Resend API key not configured in .env');
    console.log('   Required: RESEND_API_KEY');
    return;
  }

  if (TEST_RSVP.email === 'YOUR_EMAIL_HERE') {
    console.log('❌ Please update TEST_RSVP.email in this file with your email');
    return;
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Manny & Celesti <rsvp@mannyandcelesti.com>',
      to: TEST_RSVP.email,
      subject: '🧪 TEST - RSVP Confirmation Working!',
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px; background: #3d4f47; color: #c4d1c7;">
          <h1 style="color: #c4d1c7; text-align: center;">Test Successful! 🎉</h1>
          <p style="color: #fff; text-align: center; font-size: 18px;">Your email notifications are working correctly.</p>
          <p style="color: #c4d1c7; text-align: center;">This is a test email from your wedding site RSVP system.</p>
        </div>
      `,
    });

    if (error) {
      console.log('❌ Email failed:', error.message);
      return;
    }

    console.log('✅ Email sent successfully!');
    console.log(`   Email ID: ${data.id}`);
    console.log(`   To: ${TEST_RSVP.email}`);
  } catch (error) {
    console.log('❌ Email failed:', error.message);
  }
}

async function main() {
  console.log('====================================');
  console.log('  Wedding Site Notification Tester');
  console.log('====================================');

  const args = process.argv.slice(2);

  if (args.includes('--sms') || args.includes('-s')) {
    await testSMS();
  } else if (args.includes('--email') || args.includes('-e')) {
    await testEmail();
  } else {
    // Test both
    await testEmail();
    await testSMS();
  }

  console.log('\n====================================\n');
}

main();
