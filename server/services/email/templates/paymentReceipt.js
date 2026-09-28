import { baseTemplate, baseTextTemplate } from './base.js';
import { BRAND, EMAIL_SUBJECTS } from '../../../constants/email.js';

// The monthly renewal receipt — chunk 11.1, §13.
//
// Calm and factual: a renewal is seamless, so nothing here asks the reader to
// act. No card details, no Stripe invoice link, no session length.

const TITLE = 'Payment received';

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
 * @param {string|null} options.name  The client, or the first of a couple.
 * @param {string} options.amount     Already formatted, e.g. "€200.00".
 * @param {string} options.paidOn
 * @param {string} options.periodFrom
 * @param {string} options.periodTo
 * @param {string} options.nextPayment
 * @param {string} options.accountUrl
 */
export function paymentReceiptEmail({ name, amount, paidOn, periodFrom, periodTo, nextPayment, accountUrl }) {
  const p = `margin:0 0 16px;font-size:16px;line-height:1.6;color:${BRAND.ink};`;
  const greeting = name ? `Hello ${escapeHtml(name)},` : 'Hello,';
  const greetingText = name ? `Hello ${name},` : 'Hello,';

  const rows = [
    ['Amount', amount],
    ['Paid on', paidOn],
    ['Covers', `${periodFrom} to ${periodTo}`],
    ['Next payment', nextPayment],
  ];

  // A bordered plate, not a coloured one — Outlook renders email through Word.
  const plate = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
           style="margin:0 0 20px;border:1px solid ${BRAND.ink}33;">
      ${rows
        .map(
          ([label, value]) => `
      <tr>
        <td style="padding:10px 20px;font-size:15px;line-height:1.6;color:${BRAND.inkMuted};width:40%;">${label}</td>
        <td style="padding:10px 20px;font-size:15px;line-height:1.6;color:${BRAND.ink};font-weight:600;">${escapeHtml(value)}</td>
      </tr>`,
        )
        .join('')}
    </table>`;

  const bodyHtml = `
    <p style="${p}">${greeting}</p>
    <p style="${p}">
      Your monthly payment went through, and your subscription carries on as
      before. There is nothing you need to do.
    </p>
    ${plate}
    <p style="${p}">Your sessions for this month have reset to four.</p>`;

  // §13's portal wording, stated plainly on every receipt.
  const renewalNote = `Next payment: ${nextPayment}. To stop it, cancel before this date.`;

  const bodyText = [
    greetingText,
    '',
    'Your monthly payment went through, and your subscription carries on as before. There is nothing you need to do.',
    '',
    ...rows.map(([label, value]) => `${label}: ${value}`),
    '',
    'Your sessions for this month have reset to four.',
    '',
    renewalNote,
  ].join('\n');

  return {
    subject: EMAIL_SUBJECTS.paymentReceipt,
    html: baseTemplate({
      title: TITLE,
      bodyHtml,
      buttonLabel: 'View your subscription',
      buttonUrl: accountUrl,
      footerNote: escapeHtml(renewalNote),
    }),
    text: baseTextTemplate({ title: TITLE, bodyText, buttonUrl: accountUrl }),
  };
}

export default paymentReceiptEmail;
