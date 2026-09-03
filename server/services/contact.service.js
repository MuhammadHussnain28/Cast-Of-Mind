import env from '../config/env.js';
import { sendEmail } from './email/email.service.js';
import { contactMessageEmail } from './email/templates/contactMessage.js';

/**
 * Deliver a contact form message. Email only — nothing is written to MongoDB.
 *
 * PRIVACY: the message body is never logged. Someone in distress may write
 * something personal into this form, and it belongs in one inbox, not in a
 * server log. Only success or failure is recorded.
 */
export async function submitContactMessage({ name, email, subject, message, website }) {
  // Honeypot filled means a bot. Return as though it worked: telling it
  // otherwise just teaches it which field to leave alone next time.
  if (website && website.trim().length > 0) {
    console.log('Contact form: honeypot triggered, message discarded.');
    return;
  }

  const { subject: emailSubject, html, text } = contactMessageEmail({
    name,
    email,
    subject,
    message,
  });

  await sendEmail({
    // Falls back to the sender in development so the terminal fallback in
    // sendEmail still has somewhere to address the message.
    to: env.contactTo || email,
    subject: emailSubject,
    html,
    text,
    // From stays our verified domain — sending as the visitor would fail SPF.
    replyTo: email,
  });
}
