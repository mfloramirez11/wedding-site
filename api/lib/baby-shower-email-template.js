/**
 * Baby shower RSVP confirmation email – girl-themed pink design
 */
export function generateBabyShowerConfirmationEmail({ name, attending, guestCount, guests }) {
  const editRsvpUrl = `https://mannyandcelesti.com/baby-shower-modify.html`;

  let guestListHtml = '';
  if (attending === 'yes' && guests && guests.length > 0) {
    const guestItems = guests.map(guest => {
      let guestInfo = `<li style="margin-bottom: 8px; color: #4a1a30; font-size: 16px;">${guest.name}`;
      const details = [];
      if (guest.dietary) details.push(guest.dietary);
      if (guest.allergies) details.push(`Allergies: ${guest.allergies}`);
      if (details.length > 0) {
        guestInfo += `<br><span style="font-size: 13px; color: #b05678; font-style: italic;">${details.join(' · ')}</span>`;
      }
      guestInfo += '</li>';
      return guestInfo;
    }).join('');

    guestListHtml = `
      <div style="margin-top: 28px; padding: 22px; background: rgba(224, 122, 170, 0.06); border-radius: 10px; border: 1px solid rgba(224, 122, 170, 0.2);">
        <p style="font-family: Georgia, serif; font-size: 12px; color: #b05678; letter-spacing: 3px; text-transform: uppercase; margin: 0 0 18px; text-align: center;">Your Party · ${guestCount} ${guestCount === 1 ? 'Guest' : 'Guests'}</p>
        <ul style="list-style: none; padding: 0; margin: 0; text-align: center;">
          ${guestItems}
        </ul>
      </div>
    `;
  }

  const attendingMessage = attending === 'yes'
    ? `<p style="font-family: Georgia, serif; font-size: 18px; color: #6d2b47; margin: 0 0 12px; line-height: 1.6;">We're so thrilled you'll be celebrating with us! 🎀</p>`
    : `<p style="font-family: Georgia, serif; font-size: 18px; color: #6d2b47; margin: 0 0 12px; line-height: 1.6;">We're sorry you won't be able to make it, but we appreciate you letting us know 💕</p>`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Baby Shower RSVP Confirmation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fce4ec; font-family: Georgia, 'Times New Roman', serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #fce4ec;">
    <tr>
      <td align="center" style="padding: 50px 20px;">

        <!-- Main card -->
        <table role="presentation" style="max-width: 560px; width: 100%; border-collapse: collapse; background-color: #fff5f8; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 30px rgba(176, 86, 120, 0.15);">

          <!-- Top ribbon accent -->
          <tr>
            <td style="background: linear-gradient(to right, #f4a8c5, #e07aaa, #f4a8c5); height: 8px; padding: 0;"></td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding: 45px 40px 35px; text-align: center;">
              <p style="font-family: Georgia, serif; font-size: 32px; color: #e07aaa; margin: 0 0 6px;">🌸</p>
              <p style="font-family: Georgia, serif; font-style: italic; font-size: 13px; color: #b05678; letter-spacing: 1px; margin: 0 0 20px;">Thank you for your RSVP</p>
              <h1 style="font-family: Georgia, serif; font-size: 13px; font-weight: normal; color: #b05678; letter-spacing: 4px; text-transform: uppercase; margin: 0 0 10px;">It's a Girl!</h1>
              <h1 style="font-family: Georgia, serif; font-size: 28px; font-weight: normal; color: #6d2b47; letter-spacing: 6px; text-transform: uppercase; margin: 0;">BABY SHOWER</h1>
              <p style="font-family: Georgia, serif; font-style: italic; font-size: 14px; color: #b05678; margin: 10px 0 0; letter-spacing: 2px;">Celesti & Manny</p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 50px;">
              <div style="height: 1px; background: linear-gradient(to right, transparent, rgba(224, 122, 170, 0.3), transparent);"></div>
            </td>
          </tr>

          <!-- Confirmation -->
          <tr>
            <td style="padding: 35px 40px 28px; text-align: center;">
              ${attendingMessage}
              <p style="font-family: Georgia, serif; font-size: 16px; color: #8a3a58; margin: 0;">Dear ${name},</p>
              ${guestListHtml}
            </td>
          </tr>

          ${attending === 'yes' ? `
          <!-- Event Details -->
          <tr>
            <td style="padding: 0 40px 25px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse; background: rgba(224, 122, 170, 0.05); border-radius: 10px; border: 1px solid rgba(224, 122, 170, 0.2);">
                <tr>
                  <td style="padding: 28px; text-align: center;">
                    <p style="font-family: Georgia, serif; font-size: 11px; color: #b05678; letter-spacing: 3px; text-transform: uppercase; margin: 0 0 18px;">Event Details</p>
                    <p style="font-family: Georgia, serif; font-style: italic; font-size: 20px; color: #6d2b47; margin: 0 0 5px;">Sunday, June 7, 2026</p>
                    <p style="font-family: Georgia, serif; font-style: italic; font-size: 15px; color: #b05678; margin: 0 0 22px;">1 o'clock in the afternoon</p>
                    <p style="font-family: Georgia, serif; font-size: 15px; color: #8a3a58; margin: 0; line-height: 1.7;">2725 De La Briandais Ct<br>Pinole, California 94564</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- Edit RSVP -->
          <tr>
            <td style="padding: 5px 40px 38px; text-align: center;">
              <p style="font-family: Georgia, serif; font-size: 14px; color: #b05678; margin: 0 0 18px;">Need to make changes?</p>
              <table role="presentation" style="margin: 0 auto;">
                <tr>
                  <td style="background: linear-gradient(135deg, #e07aaa, #d4638a); border-radius: 30px;">
                    <a href="${editRsvpUrl}" style="display: inline-block; padding: 14px 36px; font-family: Georgia, serif; font-size: 13px; color: #ffffff; letter-spacing: 2px; text-transform: uppercase; text-decoration: none; font-weight: 500;">Edit Your RSVP</a>
                  </td>
                </tr>
              </table>
              <p style="font-family: Georgia, serif; font-size: 12px; color: #c0517a; margin: 22px 0 0; font-style: italic;">The last day to make changes is May 25, 2026</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: rgba(224, 122, 170, 0.06); height: 8px;"></td>
          </tr>
          <tr>
            <td style="padding: 28px 40px; text-align: center; background: rgba(224, 122, 170, 0.04);">
              <p style="font-family: Georgia, serif; font-size: 14px; color: #8a3a58; margin: 0 0 10px; line-height: 1.7;">Questions? Reply to this email and we'll get back to you!</p>
              <p style="font-family: Georgia, serif; font-size: 13px; color: #b05678; margin: 0;">(323) 972-3556</p>
            </td>
          </tr>

        </table>

        <!-- Signature -->
        <table role="presentation" style="max-width: 560px; width: 100%; margin-top: 30px;">
          <tr>
            <td style="text-align: center;">
              <p style="font-family: Georgia, serif; font-style: italic; font-size: 14px; color: #b05678; margin: 0;">With love,</p>
              <p style="font-family: Georgia, serif; font-size: 16px; color: #8a3a58; letter-spacing: 4px; margin: 10px 0 0; text-transform: uppercase;">Celesti & Manny</p>
              <p style="font-family: Georgia, serif; font-size: 22px; margin: 8px 0 0;">🌸 💕 🎀</p>
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
 * Plain text version
 */
export function generateBabyShowerConfirmationText({ name, attending, guestCount, guests }) {
  const editRsvpUrl = `https://mannyandcelesti.com/baby-shower-modify.html`;

  let guestList = '';
  if (attending === 'yes' && guests && guests.length > 0) {
    guestList = '\n\nYour Party:\n' + guests.map(guest => {
      let info = `  • ${guest.name}`;
      if (guest.dietary) info += ` (${guest.dietary})`;
      if (guest.allergies) info += ` - Allergies: ${guest.allergies}`;
      return info;
    }).join('\n');
  }

  const attendingMessage = attending === 'yes'
    ? "We're so thrilled you'll be celebrating with us! 🎀"
    : "We're sorry you won't be able to make it, but we appreciate you letting us know 💕";

  let text = `
IT'S A GIRL! 🌸 – BABY SHOWER

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

Sunday, June 7, 2026
1 o'clock in the afternoon

2725 De La Briandais Ct
Pinole, California 94564
`;
  }

  text += `

────────────────────────────────────────
EDIT YOUR RSVP
────────────────────────────────────────

Need to make changes? Visit:
${editRsvpUrl}

The last day to make changes is May 25, 2026.

────────────────────────────────────────

Questions? Just reply to this email or call us at (323) 972-3556.

With love,
Celesti & Manny 🌸
  `;

  return text.trim();
}
