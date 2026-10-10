import { baseTemplate, baseTextTemplate } from './base.js';
import { escapeHtml } from './escapeHtml.js';
import { BRAND, EMAIL_SUBJECTS, SUPPORT_EMAIL } from '../../../constants/email.js';

// Sent to BOTH addresses when an admin changes a therapist's sign-in email.
//
// Not in §16's table — added in chunk 4.5, approved by the developer. This is a
// security notice rather than business copy: without it a therapist silently
// loses the ability to sign in and has no way to work out why, and a mistaken
// or malicious change reaches nobody who could object to it.
//
// The old address is told deliberately. That is the inbox that could raise an
// alarm, and it is the one that until now controlled password recovery (§11).

const TITLE = 'Your sign-in email has changed';

function shell({ bodyHtml, bodyText, loginUrl }) {
  return {
    subject: EMAIL_SUBJECTS.emailChanged,
    html: baseTemplate({
      title: TITLE,
      bodyHtml,
      buttonLabel: 'Go to sign in',
      buttonUrl: loginUrl,
      footerNote: `If this was not expected, reply to this message or contact ${SUPPORT_EMAIL} straight away.`,
    }),
    text: baseTextTemplate({ title: TITLE, bodyText, buttonUrl: loginUrl }),
  };
}

/** To the address that is being replaced. */
export function emailChangedOldAddress({ firstName, newEmail, loginUrl }) {
  const p = `margin:0 0 16px;font-size:16px;line-height:1.6;color:${BRAND.ink};`;
  const greeting = firstName ? `Hello ${firstName},` : 'Hello,';

  const bodyHtml = `
    <p style="${p}">${escapeHtml(greeting)}</p>
    <p style="${p}">
      The email address you use to sign in to Cast of Mind has been changed by our
      team to <strong>${escapeHtml(newEmail)}</strong>. This address will no longer work for
      signing in or for resetting your password.
    </p>
    <p style="${p}">
      Your password has not changed, and nothing else about your account or your
      clients has been affected.
    </p>`;

  const bodyText = [
    greeting,
    '',
    `The email address you use to sign in to Cast of Mind has been changed by our team to ${newEmail}. This address will no longer work for signing in or for resetting your password.`,
    '',
    'Your password has not changed, and nothing else about your account or your clients has been affected.',
  ].join('\n');

  return shell({ bodyHtml, bodyText, loginUrl });
}

/** To the address that is taking over. */
export function emailChangedNewAddress({ firstName, newEmail, loginUrl }) {
  const p = `margin:0 0 16px;font-size:16px;line-height:1.6;color:${BRAND.ink};`;
  const greeting = firstName ? `Hello ${firstName},` : 'Hello,';

  const bodyHtml = `
    <p style="${p}">${escapeHtml(greeting)}</p>
    <p style="${p}">
      This address, <strong>${escapeHtml(newEmail)}</strong>, is now the one you use to sign
      in to Cast of Mind. Your previous address will no longer work.
    </p>
    <p style="${p}">
      Your password is unchanged. If you do not remember it, use
      &ldquo;Forgot password&rdquo; on the sign-in page — we do not hold a copy
      of it and cannot read it.
    </p>`;

  const bodyText = [
    greeting,
    '',
    `This address, ${newEmail}, is now the one you use to sign in to Cast of Mind. Your previous address will no longer work.`,
    '',
    'Your password is unchanged. If you do not remember it, use "Forgot password" on the sign-in page — we do not hold a copy of it and cannot read it.',
  ].join('\n');

  return shell({ bodyHtml, bodyText, loginUrl });
}
