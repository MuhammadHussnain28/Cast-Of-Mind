import { baseTemplate, baseTextTemplate } from './base.js';
import { BRAND, EMAIL_SUBJECTS } from '../../../constants/email.js';

// A failed renewal payment — chunk 11.2, §13 and §16.
//
// Clear, not alarming: nothing is lost yet, the portal keeps working until the
// grace ends, and there is one thing to do. No urgency, no guilt, no card details.

const TITLE = 'Your payment did not go through';

/** Escapes user input before it goes into the HTML email body. */
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * @param {object} options
 * @param {string|null} options.name
 * @param {string} options.amount       Already formatted, e.g. "€200.00".
 * @param {string} options.accessUntil  When the grace ends, in the client's zone.
 * @param {string} options.accountUrl
 */
export function paymentFailedEmail({ name, amount, accessUntil, accountUrl }) {
  const p = `margin:0 0 16px;font-size:16px;line-height:1.6;color:${BRAND.ink};`;
  const strong = `margin:0 0 16px;font-size:18px;line-height:1.5;color:${BRAND.ink};font-weight:600;`;
  const greeting = name ? `Hello ${escapeHtml(name)},` : 'Hello,';
  const greetingText = name ? `Hello ${name},` : 'Hello,';

  const opening = `We could not take your monthly payment of ${amount}. This often happens when a card has expired or been replaced.`;
  const access = 'Your portal keeps working as normal until:';
  const action = 'Please update your card before then to carry on. Nothing else changes, and everything in your portal is kept.';

  const bodyHtml = `
    <p style="${p}">${greeting}</p>
    <p style="${p}">${escapeHtml(opening)}</p>
    <p style="${p}">${access}</p>
    <p style="${strong}">${escapeHtml(accessUntil)}</p>
    <p style="${p}">${escapeHtml(action)}</p>`;

  const bodyText = [greetingText, '', opening, '', access, accessUntil, '', action].join('\n');

  return {
    subject: EMAIL_SUBJECTS.paymentFailed,
    html: baseTemplate({
      title: TITLE,
      bodyHtml,
      buttonLabel: 'Update your card',
      buttonUrl: accountUrl,
    }),
    text: baseTextTemplate({ title: TITLE, bodyText, buttonUrl: accountUrl }),
  };
}

export default paymentFailedEmail;
