import env from '../../../config/env.js';
import { BRAND, SUPPORT_EMAIL } from '../../../constants/email.js';

// The shared shell every Cast of Mind email sits inside.
//
// Email HTML is not web HTML. Three rules drive everything odd-looking below:
//
// 1. NO stylesheets, no classes, no CSS variables. Gmail strips <style> blocks
//    in many contexts. Every rule is inlined on the element.
// 2. TABLES for layout, not flexbox or grid. Outlook on Windows renders email
//    through Microsoft Word, which supports neither.
// 3. NO border-radius or box-shadow on anything structural — Word ignores both,
//    so a design that leans on them looks broken for a large share of users.
//
// The tone follows the project's design rules: calm, plain, no urgency. The
// reader may be anxious, and a password email should not add to that.

/**
 * @param {object} options
 * @param {string} options.title    Shown as the email's main heading.
 * @param {string} options.bodyHtml The message. Already-escaped HTML.
 * @param {string} [options.buttonLabel]
 * @param {string} [options.buttonUrl]
 * @param {string} [options.footerNote] Extra line above the standard footer.
 */
export function baseTemplate({ title, bodyHtml, buttonLabel, buttonUrl, footerNote }) {
  // Falls back to a text wordmark when no logo URL is configured. A missing
  // image would otherwise render as a broken-image icon, which looks worse than
  // plain type. Many clients also block images by default, so the alt text
  // carries the brand name regardless.
  const header = env.emailLogoUrl
    ? `<img src="${env.emailLogoUrl}" width="200" alt="${BRAND.name}"
           style="display:block;border:0;outline:none;text-decoration:none;width:200px;max-width:200px;height:auto;">`
    : `<span style="font-size:24px;font-weight:600;color:${BRAND.ink};letter-spacing:0.02em;">${BRAND.name}</span>`;

  // A "bulletproof button": a table cell with a background colour, not a styled
  // div or an <a> with padding. This is the only construction Outlook renders
  // as a real button.
  //
  // Gold background with INK text. Gold text on white is 1.63:1 and would be
  // unreadable; ink on gold is 9.5:1.
  const button = buttonLabel && buttonUrl
    ? `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:32px 0;">
        <tr>
          <td align="center" bgcolor="${BRAND.gold}" style="background-color:${BRAND.gold};padding:16px 32px;">
            <a href="${buttonUrl}"
               style="display:inline-block;color:${BRAND.ink};font-size:16px;font-weight:600;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
              ${buttonLabel}
            </a>
          </td>
        </tr>
      </table>`
    : '';

  // The same link in plain text underneath. Some clients mangle buttons, and
  // some readers simply do not trust one — the raw URL is always available.
  const plainLink = buttonUrl
    ? `
      <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:${BRAND.inkMuted};">
        If the button does not work, copy and paste this link into your browser:
      </p>
      <p style="margin:0 0 24px;font-size:14px;line-height:1.6;word-break:break-all;">
        <a href="${buttonUrl}" style="color:${BRAND.ink};">${buttonUrl}</a>
      </p>`
    : '';

  const note = footerNote
    ? `<p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:${BRAND.inkMuted};">${footerNote}</p>`
    : '';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.mist};">
  <!-- Preheader: the grey preview line beside the subject in most inboxes.
       Hidden in the message itself. Left empty of detail on purpose — a reset
       link's preview text should not announce anything about the account. -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${title}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background-color:${BRAND.mist};padding:40px 16px;">
    <tr>
      <td align="center">

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
               style="max-width:560px;background-color:${BRAND.paper};">
          <tr>
            <td style="padding:40px 40px 24px;text-align:center;">
              ${header}
            </td>
          </tr>

          <tr>
            <td style="padding:0 40px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
              <h1 style="margin:0 0 20px;font-size:24px;font-weight:600;line-height:1.3;color:${BRAND.ink};">
                ${title}
              </h1>

              ${bodyHtml}
              ${button}
              ${plainLink}
              ${note}
            </td>
          </tr>

          <tr>
            <td style="padding:24px 40px 32px;border-top:1px solid ${BRAND.mist};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
              <p style="margin:0;font-size:13px;line-height:1.6;color:${BRAND.inkMuted};">
                This is an automated message. For assistance, contact us at
                <a href="mailto:${SUPPORT_EMAIL}" style="color:${BRAND.ink};">${SUPPORT_EMAIL}</a>.
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * A plain-text version of the same message.
 *
 * Not optional politeness: an email with no text part is far more likely to be
 * scored as spam, and some clients show nothing else.
 */
export function baseTextTemplate({ title, bodyText, buttonUrl }) {
  const link = buttonUrl ? `\n${buttonUrl}\n` : '';

  return `${BRAND.name}

${title}

${bodyText}
${link}
This is an automated message. For assistance, contact us at ${SUPPORT_EMAIL}.
`;
}
