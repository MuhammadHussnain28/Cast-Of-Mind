import { Resend } from 'resend';
import env from '../../config/env.js';
import { passwordResetEmail } from './templates/passwordReset.js';

// Sending layer — master spec §16.
//
// PRIVACY RULE, and it matters more here than almost anywhere else: never log an
// email body. A password reset email contains a working credential. Later
// chunks will send login credentials through this same function. Only the
// recipient, the subject, and success or failure are ever logged.

// Created once. Null when no API key is configured, which is allowed in
// development only — config/env.js refuses to start production without one.
const resend = env.resendApiKey ? new Resend(env.resendApiKey) : null;

/**
 * Send one email.
 *
 * @returns {Promise<{ delivered: boolean }>}
 */
export async function sendEmail({ to, subject, html, text, replyTo }) {
  // DEVELOPMENT FALLBACK. With no API key, print the message to the terminal
  // instead of sending it, so the whole reset flow can be walked through with no
  // Resend account. This branch is unreachable in production: the server exits
  // at startup if RESEND_API_KEY is missing.
  if (!resend) {
    console.log('\n--- EMAIL (not sent — no RESEND_API_KEY) ---');
    console.log(`To:      ${to}`);
    if (replyTo) console.log(`Reply-To: ${replyTo}`);
    console.log(`Subject: ${subject}`);
    console.log(text);
    console.log('--- end of email ---\n');
    return { delivered: false };
  }

  const { error } = await resend.emails.send({
    from: env.emailFrom,
    to,
    subject,
    html,
    text,
    // Lets the business reply straight to the sender. The From stays our own
    // verified domain — sending as the visitor would fail SPF and land in spam.
    ...(replyTo ? { replyTo } : {}),
  });

  if (error) {
    // Thrown so the caller decides what to do. For password reset the caller
    // deliberately swallows it — see the note in auth.service.forgotPassword.
    throw new Error(`Resend refused the message: ${error.message || 'unknown error'}`);
  }

  return { delivered: true };
}

/**
 * Send a password reset link.
 *
 * @param {string} to
 * @param {string} resetUrl The full link, token included. NEVER log this value.
 */
export async function sendPasswordResetEmail(to, resetUrl) {
  const { subject, html, text } = passwordResetEmail({ resetUrl });

  return sendEmail({ to, subject, html, text });
}
