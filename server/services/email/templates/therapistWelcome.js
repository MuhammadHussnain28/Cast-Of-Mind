import { baseTemplate, baseTextTemplate } from './base.js';
import { BRAND, EMAIL_SUBJECTS } from '../../../constants/email.js';

// Sent when the admin approves a therapist application — master spec §16.
//
// THIS EMAIL CONTAINS NO PASSWORD, AND THAT IS THE POINT. The therapist chose
// their own on the application form and it carries over unchanged on approval
// (§11, §8.7, confirmed by Asad). Nobody generates a new one, and the admin
// never sees theirs.
//
// docs/04 §9.2 still says approval "generates a temporary password" — that line
// is stale and is superseded by §11. Recorded in docs/ongoing.md rather than
// edited, because the spec is the client's document.

const TITLE = 'Your account is ready';

export function therapistWelcomeEmail({ firstName, loginUrl }) {
  const p = `margin:0 0 16px;font-size:16px;line-height:1.6;color:${BRAND.ink};`;
  const greeting = firstName ? `Hello ${firstName},` : 'Hello,';

  const bodyHtml = `
    <p style="${p}">${greeting}</p>
    <p style="${p}">
      Your application to practise with Cast of Mind has been approved, and your
      therapist account is now open.
    </p>
    <p style="${p}">
      Sign in with the email address you applied with and the password you chose
      on the application form. We do not have a copy of it, so if you cannot
      remember it, use the &ldquo;Forgot password&rdquo; link on the sign-in page.
    </p>
    <p style="${p}">
      Your profile has already been built from your application, so there is
      nothing to fill in. Clients will appear in your portal once they are
      matched with you.
    </p>`;

  const bodyText = [
    greeting,
    '',
    'Your application to practise with Cast of Mind has been approved, and your therapist account is now open.',
    '',
    'Sign in with the email address you applied with and the password you chose on the application form. We do not have a copy of it, so if you cannot remember it, use the "Forgot password" link on the sign-in page.',
    '',
    'Your profile has already been built from your application, so there is nothing to fill in. Clients will appear in your portal once they are matched with you.',
  ].join('\n');

  return {
    subject: EMAIL_SUBJECTS.therapistWelcome,
    html: baseTemplate({
      title: TITLE,
      bodyHtml,
      buttonLabel: 'Sign in',
      buttonUrl: loginUrl,
      footerNote:
        'Your specialties and credentials were verified during review, so they are fixed on your profile. Contact us if anything needs changing.',
    }),
    text: baseTextTemplate({ title: TITLE, bodyText, buttonUrl: loginUrl }),
  };
}
