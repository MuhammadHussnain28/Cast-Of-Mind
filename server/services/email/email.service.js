import { Resend } from 'resend';
import env from '../../config/env.js';
import { passwordResetEmail } from './templates/passwordReset.js';
import { therapistWelcomeEmail } from './templates/therapistWelcome.js';
import { therapistNewClientEmail } from './templates/therapistNewClient.js';
import { clientWelcomeEmail } from './templates/clientWelcome.js';
import {
  emailChangedOldAddress,
  emailChangedNewAddress,
} from './templates/emailChanged.js';
import { sessionReminderEmail } from './templates/sessionReminder.js';
import { paymentReceiptEmail } from './templates/paymentReceipt.js';
import { paymentFailedEmail } from './templates/paymentFailed.js';
import {
  subscriptionCancelledEmail,
  subscriptionReactivatedEmail,
  welcomeBackEmail,
  renewalReminderEmail,
} from './templates/subscriptionChange.js';

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

/**
 * Welcome a newly approved therapist.
 *
 * Carries NO password. They set their own on the application form and it
 * carries over unchanged (§11) — see the note in templates/therapistWelcome.js.
 */
export async function sendTherapistWelcomeEmail(to, { firstName }) {
  const loginUrl = `${env.clientOrigin}/login`;
  const { subject, html, text } = therapistWelcomeEmail({ firstName, loginUrl });

  return sendEmail({ to, subject, html, text });
}

/**
 * Notify a therapist that a new client has been matched with them.
 */
export async function sendTherapistNewClientEmail(to, { firstName, clientName }) {
  const loginUrl = `${env.clientOrigin}/login`;
  const { subject, html, text } = therapistNewClientEmail({ firstName, clientName, loginUrl });

  return sendEmail({ to, subject, html, text });
}

/**
 * Tell both addresses that a therapist's sign-in email changed.
 *
 * Both, deliberately: the old inbox is the one that could raise an alarm, and
 * the new one needs to know it is now the sign-in address. Sent in parallel;
 * one failing must not stop the other.
 */
/**
 * Welcome a client whose payment has just been confirmed.
 *
 * CARRIES THE TEMPORARY PASSWORD — the one place a readable copy exists. The
 * value must never be logged here or anywhere upstream.
 */
export async function sendClientWelcomeEmail(to, { name, temporaryPassword, therapistName }) {
  const loginUrl = `${env.clientOrigin}/login`;
  const { subject, html, text } = clientWelcomeEmail({
    name,
    email: to,
    temporaryPassword,
    loginUrl,
    therapistName,
  });

  return sendEmail({ to, subject, html, text });
}

export async function sendEmailChangedNotices({ previousEmail, newEmail, firstName }) {
  const loginUrl = `${env.clientOrigin}/login`;

  const old = emailChangedOldAddress({ firstName, newEmail, loginUrl });
  const fresh = emailChangedNewAddress({ firstName, newEmail, loginUrl });

  const results = await Promise.allSettled([
    sendEmail({ to: previousEmail, subject: old.subject, html: old.html, text: old.text }),
    sendEmail({ to: newEmail, subject: fresh.subject, html: fresh.html, text: fresh.text }),
  ]);

  return {
    oldAddressNotified: results[0].status === 'fulfilled',
    newAddressNotified: results[1].status === 'fulfilled',
  };
}

/**
 * A session reminder (9.6). The client's carries no meeting link — they get it
 * on their sessions page when Join opens (9.4). The therapist's does.
 */
export async function sendSessionReminderEmail(to, { recipient, kind, when, otherName, meetingLink }) {
  const portalUrl = `${env.clientOrigin}/portal${recipient === 'client' ? '/sessions' : ''}`;
  const { subject, html, text } = sessionReminderEmail({
    recipient,
    kind,
    when,
    otherName,
    meetingLink,
    portalUrl,
  });

  return sendEmail({ to, subject, html, text });
}

/** The renewal receipt (11.1). Dates arrive already formatted in the client's zone. */
export async function sendPaymentReceiptEmail(to, { name, amount, paidOn, periodFrom, periodTo, nextPayment }) {
  const accountUrl = `${env.clientOrigin}/portal/account`;
  const { subject, html, text } = paymentReceiptEmail({
    name,
    amount,
    paidOn,
    periodFrom,
    periodTo,
    nextPayment,
    accountUrl,
  });

  return sendEmail({ to, subject, html, text });
}

/**
 * A failed renewal (11.2). Links to the portal, where the banner opens Stripe's
 * card page — a Stripe portal link would expire long before the email is read.
 */
export async function sendPaymentFailedEmail(to, { name, amount, accessUntil }) {
  const accountUrl = `${env.clientOrigin}/portal/account`;
  const { subject, html, text } = paymentFailedEmail({ name, amount, accessUntil, accountUrl });

  return sendEmail({ to, subject, html, text });
}

/** The client cancelled (11.3): exactly when access ends. */
export async function sendSubscriptionCancelledEmail(to, { name, accessUntil, canReactivate }) {
  const accountUrl = `${env.clientOrigin}/portal/account`;
  const { subject, html, text } = subscriptionCancelledEmail({ name, accessUntil, canReactivate, accountUrl });

  return sendEmail({ to, subject, html, text });
}

/** The client reactivated before the end (11.3): billing resumes, and when. */
export async function sendSubscriptionReactivatedEmail(to, { name, amount, nextPayment }) {
  const accountUrl = `${env.clientOrigin}/portal/account`;
  const { subject, html, text } = subscriptionReactivatedEmail({ name, amount, nextPayment, accountUrl });

  return sendEmail({ to, subject, html, text });
}

/** A returning client re-subscribed after expiry (11.4). */
export async function sendWelcomeBackEmail(to, { name, therapistName, amount, nextPayment }) {
  const portalUrl = `${env.clientOrigin}/portal`;
  const { subject, html, text } = welcomeBackEmail({ name, therapistName, amount, nextPayment, portalUrl });

  return sendEmail({ to, subject, html, text });
}

/** The pre-renewal reminder (11.6), a few days before the charge. */
export async function sendRenewalReminderEmail(to, { name, renewsOn, amount }) {
  const accountUrl = `${env.clientOrigin}/portal/account`;
  const { subject, html, text } = renewalReminderEmail({ name, renewsOn, amount, accountUrl });

  return sendEmail({ to, subject, html, text });
}
