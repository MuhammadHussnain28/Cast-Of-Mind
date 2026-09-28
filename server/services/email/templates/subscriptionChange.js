import { baseTemplate, baseTextTemplate } from './base.js';
import { BRAND, EMAIL_SUBJECTS } from '../../../constants/email.js';

// Cancellation and reactivation confirmations — chunk 11.3, §13.
//
// NO RETENTION PRESSURE, EVER: no "we're sad to see you go", no discount, no
// warning about what is lost. The facts, the date, and that the door is open.

/** Escapes user input before it goes into the HTML email body. */
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const p = `margin:0 0 16px;font-size:16px;line-height:1.6;color:${BRAND.ink};`;
const strong = `margin:0 0 16px;font-size:18px;line-height:1.5;color:${BRAND.ink};font-weight:600;`;

function compose({ title, subject, name, lead, highlight, lines, buttonLabel, accountUrl }) {
  const greeting = name ? `Hello ${escapeHtml(name)},` : 'Hello,';
  const greetingText = name ? `Hello ${name},` : 'Hello,';

  const bodyHtml = `
    <p style="${p}">${greeting}</p>
    <p style="${p}">${escapeHtml(lead)}</p>
    <p style="${strong}">${escapeHtml(highlight)}</p>
    ${lines.map((line) => `<p style="${p}">${escapeHtml(line)}</p>`).join('')}`;

  const bodyText = [greetingText, '', lead, highlight, '', ...lines.flatMap((line) => [line, ''])].join('\n');

  return {
    subject,
    html: baseTemplate({ title, bodyHtml, buttonLabel, buttonUrl: accountUrl }),
    text: baseTextTemplate({ title, bodyText, buttonUrl: accountUrl }),
  };
}

/**
 * @param {object} options
 * @param {string|null} options.name
 * @param {string} options.accessUntil  In the client's zone.
 * @param {boolean} options.canReactivate  False after a past-due cancellation.
 * @param {string} options.accountUrl
 */
export function subscriptionCancelledEmail({ name, accessUntil, canReactivate, accountUrl }) {
  return compose({
    title: 'Your subscription is cancelled',
    subject: EMAIL_SUBJECTS.subscriptionCancelled,
    name,
    lead: 'You will not be charged again. Your portal stays fully open until:',
    highlight: accessUntil,
    lines: [
      'Until then your conversation, sessions, journal and worksheets all carry on as normal.',
      'After that date nothing is deleted. Everything is kept, exactly as it is, should you ever come back.',
      ...(canReactivate ? ['If you change your mind before then, you can reactivate from your account page.'] : []),
    ],
    buttonLabel: 'View your subscription',
    accountUrl,
  });
}

/**
 * @param {object} options
 * @param {string|null} options.name
 * @param {string} options.amount       Already formatted, e.g. "€200.00".
 * @param {string} options.nextPayment  In the client's zone.
 * @param {string} options.accountUrl
 */
export function subscriptionReactivatedEmail({ name, amount, nextPayment, accountUrl }) {
  return compose({
    title: 'Your subscription will continue',
    subject: EMAIL_SUBJECTS.subscriptionReactivated,
    name,
    lead: `Your subscription is active again, and renews as before. Your next payment of ${amount} is on:`,
    highlight: nextPayment,
    lines: ['To stop it, cancel before this date. Everything else stays exactly as it was.'],
    buttonLabel: 'View your subscription',
    accountUrl,
  });
}

/**
 * A returning client's portal is open again (11.4). Their history was kept, and
 * §13's renewal terms are restated, because this is a fresh subscription.
 *
 * @param {object} options
 * @param {string|null} options.name
 * @param {string|null} options.therapistName
 * @param {string} options.amount       Already formatted, e.g. "€200.00".
 * @param {string} options.nextPayment  In the client's zone.
 * @param {string} options.portalUrl
 */
export function welcomeBackEmail({ name, therapistName, amount, nextPayment, portalUrl }) {
  return compose({
    title: 'Welcome back',
    subject: EMAIL_SUBJECTS.welcomeBack,
    name,
    lead: therapistName
      ? `Your portal is open again, and ${therapistName} is there. Everything is exactly where you left it. Your next payment of ${amount} is on:`
      : `Your portal is open again, and everything is exactly where you left it. Your next payment of ${amount} is on:`,
    highlight: nextPayment,
    lines: [
      'Your subscription renews each month until you cancel. To stop it, cancel before this date.',
    ],
    buttonLabel: 'Open your portal',
    accountUrl: portalUrl,
  });
}

/**
 * The pre-renewal reminder (11.6) — §13's third transparency point. The lead
 * sentence is §13's, VERBATIM; it is a commitment, not copy to tighten.
 *
 * @param {object} options
 * @param {string|null} options.name
 * @param {string} options.renewsOn   The billing date, in the client's zone.
 * @param {string} options.amount     Already formatted, e.g. "€200.00".
 * @param {string} options.accountUrl
 */
export function renewalReminderEmail({ name, renewsOn, amount, accountUrl }) {
  return compose({
    title: 'Your subscription renews soon',
    subject: EMAIL_SUBJECTS.renewalReminder,
    name,
    lead: `Your subscription renews on ${renewsOn}. No action needed to continue; cancel anytime before then.`,
    highlight: `${amount} on ${renewsOn}`,
    lines: ['You can see your plan, or cancel, from your account page.'],
    buttonLabel: 'View your subscription',
    accountUrl,
  });
}

export default { subscriptionCancelledEmail, subscriptionReactivatedEmail, welcomeBackEmail, renewalReminderEmail };
