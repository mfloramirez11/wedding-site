/**
 * Generates the RSVP confirmation email HTML
 * Matches the wedding website aesthetics
 */
export function generateRsvpConfirmationEmail({ name, email, attending, guestCount, guests }) {
  const editRsvpUrl = `https://mannyandcelesti.com/modify-rsvp.html`;

  // Build guest list HTML if attending
  let guestListHtml = '';
  if (attending === 'yes' && guests && guests.length > 0) {
    const guestItems = guests.map((guest, index) => {
      let guestInfo = `<li style="margin-bottom: 8px; color: #ffffff; font-size: 16px;">${guest.name}`;
      const details = [];
      if (guest.dietary) details.push(`${guest.dietary}`);
      if (guest.allergies) details.push(`Allergies: ${guest.allergies}`);
      if (details.length > 0) {
        guestInfo += `<br><span style="font-size: 13px; color: #a8b5ab; font-style: italic;">${details.join(' · ')}</span>`;
      }
      guestInfo += '</li>';
      return guestInfo;
    }).join('');

    guestListHtml = `
      <div style="margin-top: 30px; padding: 25px; background: rgba(255, 255, 255, 0.05); border-radius: 8px; border: 1px solid rgba(196, 209, 199, 0.1);">
        <p style="font-family: Georgia, serif; font-size: 12px; color: #a8b5ab; letter-spacing: 3px; text-transform: uppercase; margin: 0 0 20px; text-align: center;">Your Party · ${guestCount} ${guestCount === 1 ? 'Guest' : 'Guests'}</p>
        <ul style="list-style: none; padding: 0; margin: 0; text-align: center;">
          ${guestItems}
        </ul>
      </div>
    `;
  }

  const attendingMessage = attending === 'yes'
    ? `<p style="font-family: Georgia, serif; font-size: 18px; color: #ffffff; margin: 0 0 15px; line-height: 1.6;">We're so happy you'll be celebrating with us!</p>`
    : `<p style="font-family: Georgia, serif; font-size: 18px; color: #ffffff; margin: 0 0 15px; line-height: 1.6;">We're sorry you won't be able to make it, but we appreciate you letting us know.</p>`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RSVP Confirmation - Manny & Celesti</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Georgia, serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #2d3e3a; font-family: Georgia, 'Times New Roman', serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #2d3e3a;">
    <tr>
      <td align="center" style="padding: 50px 20px;">

        <!-- Main Card -->
        <table role="presentation" style="max-width: 560px; width: 100%; border-collapse: collapse; background-color: #3d4f47; border-radius: 12px; overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="padding: 50px 40px 40px; text-align: center;">
              <p style="font-family: Georgia, serif; font-style: italic; font-size: 14px; color: #a8b5ab; letter-spacing: 1px; margin: 0 0 25px;">Thank you for your RSVP</p>
              <h1 style="font-family: Georgia, serif; font-size: 32px; font-weight: normal; color: #c4d1c7; letter-spacing: 8px; text-transform: uppercase; margin: 0;">MANNY</h1>
              <p style="font-family: Georgia, serif; font-size: 14px; color: #a8b5ab; margin: 8px 0; letter-spacing: 2px;">&</p>
              <h1 style="font-family: Georgia, serif; font-size: 32px; font-weight: normal; color: #c4d1c7; letter-spacing: 8px; text-transform: uppercase; margin: 0;">CELESTI</h1>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 50px;">
              <div style="height: 1px; background: linear-gradient(to right, transparent, rgba(196, 209, 199, 0.3), transparent);"></div>
            </td>
          </tr>

          <!-- Confirmation Message -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center;">
              ${attendingMessage}
              <p style="font-family: Georgia, serif; font-size: 16px; color: #c4d1c7; margin: 0;">Dear ${name},</p>
              ${guestListHtml}
            </td>
          </tr>

          ${attending === 'yes' ? `
          <!-- Event Details -->
          <tr>
            <td style="padding: 10px 40px 30px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse; background: rgba(255, 255, 255, 0.03); border-radius: 8px; border: 1px solid rgba(196, 209, 199, 0.1);">
                <tr>
                  <td style="padding: 30px; text-align: center;">
                    <p style="font-family: Georgia, serif; font-size: 12px; color: #a8b5ab; letter-spacing: 3px; text-transform: uppercase; margin: 0 0 20px;">Event Details</p>
                    <p style="font-family: Georgia, serif; font-style: italic; font-size: 20px; color: #ffffff; margin: 0 0 5px;">Saturday, April 4, 2026</p>
                    <p style="font-family: Georgia, serif; font-style: italic; font-size: 15px; color: #a8b5ab; margin: 0 0 25px;">4 o'clock in the afternoon</p>
                    <p style="font-family: Georgia, serif; font-size: 15px; color: #c4d1c7; margin: 0; line-height: 1.6;">2447 Doidge Ave<br>Pinole, California 94564</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- Edit RSVP Section -->
          <tr>
            <td style="padding: 10px 40px 40px; text-align: center;">
              <p style="font-family: Georgia, serif; font-size: 14px; color: #a8b5ab; margin: 0 0 20px;">Need to make changes?</p>
              <table role="presentation" style="margin: 0 auto;">
                <tr>
                  <td style="background-color: #c4d1c7; border-radius: 6px;">
                    <a href="${editRsvpUrl}" style="display: inline-block; padding: 14px 36px; font-family: Georgia, serif; font-size: 13px; color: #3d4f47; letter-spacing: 2px; text-transform: uppercase; text-decoration: none; font-weight: 500;">Edit Your RSVP</a>
                  </td>
                </tr>
              </table>
              <p style="font-family: Georgia, serif; font-size: 12px; color: #d4a574; margin: 25px 0 0; font-style: italic;">The last day to make changes to your RSVP is March 15, 2026</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; background: rgba(0, 0, 0, 0.15);">
              <p style="font-family: Georgia, serif; font-size: 14px; color: #c4d1c7; margin: 0 0 12px; line-height: 1.7;">Have questions? Check out our <a href="https://mannyandcelesti.com/#faq" style="color: #ffffff; text-decoration: underline;">FAQ</a></p>
              <p style="font-family: Georgia, serif; font-size: 14px; color: #a8b5ab; margin: 0; line-height: 1.7;">Or respond to this email and we'll get back to you</p>
            </td>
          </tr>

        </table>

        <!-- Signature -->
        <table role="presentation" style="max-width: 560px; width: 100%; border-collapse: collapse; margin-top: 35px;">
          <tr>
            <td style="text-align: center;">
              <p style="font-family: Georgia, serif; font-style: italic; font-size: 14px; color: #6b7c74; margin: 0;">With love,</p>
              <p style="font-family: Georgia, serif; font-size: 16px; color: #8a9b92; letter-spacing: 4px; margin: 12px 0 0; text-transform: uppercase;">Manny & Celesti</p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generates plain text version of the email for clients that don't support HTML
 */
export function generateRsvpConfirmationText({ name, email, attending, guestCount, guests }) {
  const editRsvpUrl = `https://mannyandcelesti.com/modify-rsvp.html`;

  let guestList = '';
  if (attending === 'yes' && guests && guests.length > 0) {
    guestList = '\n\nYour Party:\n' + guests.map((guest, i) => {
      let info = `  • ${guest.name}`;
      if (guest.dietary) info += ` (${guest.dietary})`;
      if (guest.allergies) info += ` - Allergies: ${guest.allergies}`;
      return info;
    }).join('\n');
  }

  const attendingMessage = attending === 'yes'
    ? "We're so happy you'll be celebrating with us!"
    : "We're sorry you won't be able to make it, but we appreciate you letting us know.";

  let text = `
MANNY & CELESTI

Thank you for your RSVP

Dear ${name},

${attendingMessage}
${guestList}
`;

  if (attending === 'yes') {
    text += `

────────────────────────────────────────
EVENT DETAILS
────────────────────────────────────────

Saturday, April 4, 2026
4 o'clock in the afternoon

2447 Doidge Ave
Pinole, California 94564
`;
  }

  text += `

────────────────────────────────────────
EDIT YOUR RSVP
────────────────────────────────────────

Need to make changes? Visit:
${editRsvpUrl}

The last day to make changes to your RSVP is March 15, 2026.

────────────────────────────────────────

Have questions? Check out our FAQ:
https://mannyandcelesti.com/#faq

Or just respond to this email and we'll get back to you.

With love,
Manny & Celesti
  `;

  return text.trim();
}
