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
      let guestInfo = `<li style="margin-bottom: 8px; color: #ffffff;">${guest.name}`;
      const details = [];
      if (guest.dietary) details.push(`Dietary: ${guest.dietary}`);
      if (guest.allergies) details.push(`Allergies: ${guest.allergies}`);
      if (details.length > 0) {
        guestInfo += `<br><span style="font-size: 14px; opacity: 0.8;">${details.join(' • ')}</span>`;
      }
      guestInfo += '</li>';
      return guestInfo;
    }).join('');

    guestListHtml = `
      <div style="margin-top: 20px; padding: 20px; background: rgba(196, 209, 199, 0.1); border-radius: 8px;">
        <p style="font-family: 'Cinzel', Georgia, serif; font-size: 14px; color: #c4d1c7; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 15px;">Your Party (${guestCount} ${guestCount === 1 ? 'Guest' : 'Guests'})</p>
        <ul style="list-style: none; padding: 0; margin: 0;">
          ${guestItems}
        </ul>
      </div>
    `;
  }

  const attendingMessage = attending === 'yes'
    ? `<p style="font-size: 20px; color: #ffffff; margin-bottom: 10px;">We're so happy you'll be celebrating with us!</p>`
    : `<p style="font-size: 20px; color: #ffffff; margin-bottom: 10px;">We're sorry you won't be able to make it, but we appreciate you letting us know.</p>`;

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
  <table role="presentation" style="width: 100%; border-collapse: collapse; background: linear-gradient(135deg, #2d3e3a 0%, #455951 100%);">
    <tr>
      <td align="center" style="padding: 40px 20px;">

        <!-- Main Card -->
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #3d4f47; border-radius: 8px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);">

          <!-- Header -->
          <tr>
            <td style="padding: 50px 40px 30px; text-align: center; border-bottom: 1px solid rgba(196, 209, 199, 0.2);">
              <p style="font-family: Georgia, serif; font-style: italic; font-size: 18px; color: #c4d1c7; margin: 0 0 20px;">Thank you for your RSVP</p>
              <h1 style="font-family: 'Cinzel', Georgia, serif; font-size: 28px; color: #c4d1c7; letter-spacing: 6px; text-transform: uppercase; margin: 0;">MANNY & CELESTI</h1>
            </td>
          </tr>

          <!-- Confirmation Message -->
          <tr>
            <td style="padding: 40px; text-align: center;">
              ${attendingMessage}
              <p style="font-size: 16px; color: #c4d1c7; margin: 0;">Dear ${name},</p>
              ${guestListHtml}
            </td>
          </tr>

          ${attending === 'yes' ? `
          <!-- Event Details -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse; background: rgba(196, 209, 199, 0.08); border-radius: 8px; border: 1px solid rgba(196, 209, 199, 0.15);">
                <tr>
                  <td style="padding: 30px; text-align: center;">
                    <p style="font-family: 'Cinzel', Georgia, serif; font-size: 14px; color: #c4d1c7; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 20px;">Event Details</p>
                    <p style="font-family: Georgia, serif; font-style: italic; font-size: 18px; color: #ffffff; margin: 0 0 5px;">Saturday, April 4, 2026</p>
                    <p style="font-family: Georgia, serif; font-style: italic; font-size: 16px; color: #c4d1c7; margin: 0 0 20px;">4 o'clock in the afternoon</p>
                    <p style="font-size: 16px; color: #ffffff; margin: 0;">2447 Doidge Ave</p>
                    <p style="font-size: 16px; color: #ffffff; margin: 0;">Pinole, California, 94564</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Registry Info -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse; background: rgba(196, 209, 199, 0.08); border-radius: 8px; border: 1px solid rgba(196, 209, 199, 0.15);">
                <tr>
                  <td style="padding: 30px; text-align: center;">
                    <p style="font-family: 'Cinzel', Georgia, serif; font-size: 14px; color: #c4d1c7; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 15px;">Registry</p>
                    <p style="font-size: 15px; color: #c4d1c7; margin: 0 0 15px; line-height: 1.6;">Your presence is the greatest gift. If you'd like to contribute to our future together:</p>
                    <p style="font-size: 16px; color: #ffffff; margin: 0;"><strong>Venmo:</strong> @celesti-hao</p>
                    <p style="font-size: 16px; color: #ffffff; margin: 5px 0 0;"><strong>Zelle:</strong> celestihao@gmail.com</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- Edit RSVP Section -->
          <tr>
            <td style="padding: 0 40px 40px; text-align: center;">
              <p style="font-size: 14px; color: #c4d1c7; margin: 0 0 20px;">Need to make changes to your RSVP?</p>
              <a href="${editRsvpUrl}" style="display: inline-block; padding: 16px 40px; background-color: #c4d1c7; color: #3d4f47; font-family: 'Cinzel', Georgia, serif; font-size: 14px; letter-spacing: 2px; text-transform: uppercase; text-decoration: none; border-radius: 4px;">Edit Your RSVP</a>
              <p style="font-size: 13px; color: #e8b4a0; margin: 20px 0 0;">The last day to modify your RSVP is <strong>March 15, 2026</strong></p>
            </td>
          </tr>

          <!-- Contact Info -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; background: rgba(0, 0, 0, 0.1); border-radius: 0 0 8px 8px;">
              <p style="font-size: 14px; color: #c4d1c7; margin: 0 0 10px;">Questions or concerns?</p>
              <p style="font-size: 16px; color: #ffffff; margin: 0;">Call or text us at <strong>(323) 972-3556</strong></p>
            </td>
          </tr>

        </table>

        <!-- Footer -->
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; margin-top: 30px;">
          <tr>
            <td style="text-align: center;">
              <p style="font-family: Georgia, serif; font-style: italic; font-size: 14px; color: rgba(196, 209, 199, 0.6); margin: 0;">With love,</p>
              <p style="font-family: 'Cinzel', Georgia, serif; font-size: 16px; color: #c4d1c7; letter-spacing: 3px; margin: 10px 0 0;">Manny & Celesti</p>
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
      let info = `  ${i + 1}. ${guest.name}`;
      if (guest.dietary) info += ` (Dietary: ${guest.dietary})`;
      if (guest.allergies) info += ` (Allergies: ${guest.allergies})`;
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

═══════════════════════════════════════
EVENT DETAILS
═══════════════════════════════════════

Saturday, April 4, 2026
4 o'clock in the afternoon

2447 Doidge Ave
Pinole, California, 94564

═══════════════════════════════════════
REGISTRY
═══════════════════════════════════════

Your presence is the greatest gift. If you'd like to contribute to our future together:

Venmo: @celesti-hao
Zelle: celestihao@gmail.com
`;
  }

  text += `

═══════════════════════════════════════
EDIT YOUR RSVP
═══════════════════════════════════════

Need to make changes? Visit:
${editRsvpUrl}

The last day to modify your RSVP is March 15, 2026.

═══════════════════════════════════════

Questions or concerns?
Call or text us at (323) 972-3556

With love,
Manny & Celesti
  `;

  return text.trim();
}
