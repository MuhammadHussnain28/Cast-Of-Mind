import { baseTemplate, baseTextTemplate } from './base.js';
import { escapeHtml } from './escapeHtml.js';
import { BRAND, EMAIL_SUBJECTS } from '../../../constants/email.js';

// Sent when a client completes onboarding and is matched with the therapist.

const TITLE = 'New client matched';

export function therapistNewClientEmail({ firstName, clientName, loginUrl }) {
  const p = `margin:0 0 16px;font-size:16px;line-height:1.6;color:${BRAND.ink};`;
  const greeting = firstName ? `Hello ${firstName},` : 'Hello,';
  const clientRef = clientName ? escapeHtml(clientName) : 'A new client';

  const bodyHtml = `
    <p style="${p}">${escapeHtml(greeting)}</p>
    <p style="${p}">
      ${clientRef} has joined Cast of Minds and has been matched with you.
    </p>
    <p style="${p}">
      Sign in to your therapist portal to review their questionnaire answers, explore their background, and send your opening message.
    </p>`;

  const clientText = clientName || 'A new client';
  const bodyText = [
    greeting,
    '',
    `${clientText} has joined Cast of Minds and has been matched with you.`,
    '',
    'Sign in to your therapist portal to review their questionnaire answers, explore their background, and send your opening message.',
  ].join('\n');

  return {
    subject: EMAIL_SUBJECTS.therapistNewClient,
    html: baseTemplate({
      title: TITLE,
      bodyHtml,
      buttonLabel: 'Sign in to Cast of Minds',
      buttonUrl: loginUrl,
      footerNote:
        'You are receiving this because you are an active therapist on Cast of Minds.',
    }),
    text: baseTextTemplate({ title: TITLE, bodyText, buttonUrl: loginUrl }),
  };
}
