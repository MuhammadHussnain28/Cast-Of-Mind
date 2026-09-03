import { baseTemplate, baseTextTemplate } from './base.js';
import { BRAND } from '../../../constants/email.js';

/** Escapes applicant-supplied text before it enters the HTML body. */
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Confirmation to the applicant.
 *
 * NO TIMELINE IS PROMISED — no "we reply within 48 hours". There is no basis
 * for a number, and a missed promise on a professional application reads worse
 * than saying nothing. Same reasoning as the contact page.
 *
 * It also promises no outcome: this confirms receipt, not approval.
 */
export function applicationReceivedEmail({ firstName, applicationId }) {
  const safeName = escapeHtml(firstName);

  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${BRAND.ink};">
      Hello ${safeName},
    </p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${BRAND.ink};">
      Thank you for applying to join Cast of Mind. We have your application and everything you uploaded.
    </p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${BRAND.ink};">
      What happens next: a member of our team reads your application in full, including your
      qualifications and the documents you sent. We will email you at this address once a decision
      is made. There is nothing for you to do in the meantime.
    </p>
    <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:${BRAND.inkMuted};">
      Your reference:
    </p>
    <p style="margin:0 0 24px;padding:12px 16px;background-color:${BRAND.mist};font-family:monospace;font-size:14px;color:${BRAND.ink};">
      ${escapeHtml(applicationId)}
    </p>
    <p style="margin:0;font-size:15px;line-height:1.7;color:${BRAND.ink};">
      If you did not apply to Cast of Mind, please let us know using the address below.
    </p>
  `;

  const text = `Hello ${firstName},

Thank you for applying to join Cast of Mind. We have your application and everything you uploaded.

What happens next: a member of our team reads your application in full, including your qualifications and the documents you sent. We will email you at this address once a decision is made. There is nothing for you to do in the meantime.

Your reference: ${applicationId}

If you did not apply to Cast of Mind, please let us know using the address below.`;

  return {
    subject: 'We have received your Cast of Mind application',
    html: baseTemplate({ title: 'Your application has been received', bodyHtml }),
    text: baseTextTemplate({ title: 'Your application has been received', bodyText: text }),
  };
}
