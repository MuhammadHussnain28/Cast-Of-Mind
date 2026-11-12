import { baseTemplate, baseTextTemplate } from './base.js';
import { BRAND } from '../../../constants/email.js';

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
 * A contact form submission, formatted for the business inbox.
 *
 * Every field is escaped: this is the one email on the platform whose body is
 * written by an untrusted stranger, and an unescaped `<script>` or a broken tag
 * would either execute in a webmail preview or wreck the layout.
 */
export function contactMessageEmail({ name, email, subject, message }) {
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeSubject = escapeHtml(subject || 'General question');
  // Preserve the sender's line breaks; they wrote it as prose, not one block.
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br />');

  const bodyHtml = `
    <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:${BRAND.inkMuted};">
      <strong style="color:${BRAND.ink};">From:</strong> ${safeName} &lt;${safeEmail}&gt;
    </p>
    <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:${BRAND.inkMuted};">
      <strong style="color:${BRAND.ink};">Subject:</strong> ${safeSubject}
    </p>
    <div style="margin:0 0 24px;padding:20px;background-color:${BRAND.mist};font-size:15px;line-height:1.7;color:${BRAND.ink};">
      ${safeMessage}
    </div>
    <p style="margin:0;font-size:14px;line-height:1.6;color:${BRAND.inkMuted};">
      Reply to this email and it goes straight back to ${safeName}.
    </p>
  `;

  return {
    subject: `Contact form: ${safeSubject} — ${safeName}`,
    html: baseTemplate({
      title: 'New message from the website',
      bodyHtml,
      footerNote: 'Sent from the contact form at castofminds.com.',
    }),
    text: baseTextTemplate({
      title: 'New message from the website',
      bodyText: `From: ${name} <${email}>\nSubject: ${subject || 'General question'}\n\n${message}\n\nReply to this email to answer them directly.`,
    }),
  };
}
