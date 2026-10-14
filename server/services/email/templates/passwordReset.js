import { baseTemplate, baseTextTemplate } from './base.js';
import { BRAND } from '../../../constants/email.js';
import { EMAIL_SUBJECTS } from '../../../constants/email.js';
import { RESET_TOKEN_TTL_MINUTES } from '../../../constants/auth.js';

// The password reset email. Works identically for all three roles — master spec
// §11 Account Recovery. Nothing in here names a role or reveals anything about
// the account beyond the fact that someone asked to reset it.
//
// The copy deliberately avoids urgency. No "act now", no countdown, no warning
// tone. Someone resetting a password on a therapy platform does not need to be
// made to feel watched.

const TITLE = 'Reset your password';

export function passwordResetEmail({ resetUrl }) {
  const p = `margin:0 0 16px;font-size:16px;line-height:1.6;color:${BRAND.ink};`;

  const bodyHtml = `
    <p style="${p}">
      We received a request to reset the password for your Cast of Minds account.
      Choose a new one using the button below.
    </p>
    <p style="${p}">
      This link works once, and expires in ${RESET_TOKEN_TTL_MINUTES} minutes.
    </p>`;

  const footerNote =
    'If you did not ask for this, you can ignore this email — your password will not change.';

  const bodyText = `We received a request to reset the password for your Cast of Minds account.

Open this link to choose a new one. It works once, and expires in ${RESET_TOKEN_TTL_MINUTES} minutes.`;

  return {
    subject: EMAIL_SUBJECTS.passwordReset,
    html: baseTemplate({
      title: TITLE,
      bodyHtml,
      buttonLabel: 'Choose a new password',
      buttonUrl: resetUrl,
      footerNote,
    }),
    text: `${baseTextTemplate({ title: TITLE, bodyText, buttonUrl: resetUrl })}
If you did not ask for this, you can ignore this email — your password will not change.
`,
  };
}
