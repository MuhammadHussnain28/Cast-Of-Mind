import { baseTemplate, baseTextTemplate } from './base.js';
import { escapeHtml } from './escapeHtml.js';
import { BRAND, EMAIL_SUBJECTS } from '../../../constants/email.js';

// Sent the moment a client's payment is confirmed — master spec §16.
//
// THIS EMAIL CARRIES A PASSWORD, unlike the therapist one. The difference is
// deliberate: a therapist chose their own on the application form (§11), while
// a client never chose anything — no password field exists anywhere in the
// questionnaire, because no account exists until the money does (§12).
//
// So the password is generated, emailed once, and stored only as a bcrypt hash.
// The copy in this email is the only readable copy that will ever exist.

const TITLE = 'Your account is ready';

export function clientWelcomeEmail({ name, email, temporaryPassword, loginUrl, therapistName }) {
  const p = `margin:0 0 16px;font-size:16px;line-height:1.6;color:${BRAND.ink};`;
  const greeting = name ? `Hello ${name},` : 'Hello,';
  const safe = {
    email: escapeHtml(email),
    password: escapeHtml(temporaryPassword),
    therapist: therapistName ? escapeHtml(therapistName) : '',
  };

  // A bordered plate rather than a coloured one: this has to stay readable in
  // Outlook, which renders email through Word and ignores most styling.
  const credentials = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
           style="margin:0 0 20px;border:1px solid ${BRAND.ink}33;">
      <tr>
        <td style="padding:16px 20px;font-size:15px;line-height:1.7;color:${BRAND.ink};">
          <strong style="display:block;margin:0 0 8px;">Your sign-in details</strong>
          Email: ${safe.email}<br>
          Temporary password: <strong>${safe.password}</strong>
        </td>
      </tr>
    </table>`;

  const matched = therapistName
    ? `<p style="${p}">You are matched with ${safe.therapist}. Once you sign in, send them a first
       message about what brought you here — it gives them the context to start properly.</p>`
    : `<p style="${p}">Once you sign in, send your therapist a first message about what brought you
       here — it gives them the context to start properly.</p>`;

  const bodyHtml = `
    <p style="${p}">${escapeHtml(greeting)}</p>
    <p style="${p}">
      Your payment went through and your Cast of Minds account is open. Your
      subscription includes four sessions a month and unlimited messaging with
      your therapist in between.
    </p>
    ${credentials}
    <p style="${p}">
      Your generated password is secure and completely safe to keep using. If you ever
      wish to change it to your own password, you are free to do so at any time using
      &ldquo;Forgot password&rdquo; on the sign-in page.
    </p>
    ${matched}`;

  const bodyText = [
    greeting,
    '',
    'Your payment went through and your Cast of Minds account is open. Your subscription includes four sessions a month and unlimited messaging with your therapist in between.',
    '',
    'Your sign-in details',
    `Email: ${email}`,
    `Temporary password: ${temporaryPassword}`,
    '',
    'Your generated password is secure and completely safe to keep using. If you ever wish to change it to your own password, you are free to do so at any time using "Forgot password" on the sign-in page.',
    '',
    therapistName
      ? `You are matched with ${therapistName}. Once you sign in, send them a first message about what brought you here — it gives them the context to start properly.`
      : 'Once you sign in, send your therapist a first message about what brought you here — it gives them the context to start properly.',
  ].join('\n');

  return {
    subject: EMAIL_SUBJECTS.clientWelcome,
    html: baseTemplate({
      title: TITLE,
      bodyHtml,
      buttonLabel: 'Sign in',
      buttonUrl: loginUrl,
      // §13 requires the renewal terms in more than one place. This is not the
      // checkout screen, so it states the fact plainly without urgency.
      footerNote:
        'Your subscription renews automatically each month until you cancel. You can cancel any time from your portal.',
    }),
    text: baseTextTemplate({ title: TITLE, bodyText, buttonUrl: loginUrl }),
  };
}

export default clientWelcomeEmail;
