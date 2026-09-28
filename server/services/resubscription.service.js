import mongoose from 'mongoose';
import env from '../config/env.js';
import { stripe, isStripeConfigured } from '../config/stripe.js';
import { AppError } from '../utils/AppError.js';
import { isStripeUrl } from '../utils/stripeUrl.js';
import { Booking } from '../models/Booking.js';
import { Subscription } from '../models/Subscription.js';
import { TherapistProfile } from '../models/TherapistProfile.js';
import { User } from '../models/User.js';
import { ClientProfile } from '../models/ClientProfile.js';
import { USER_STATUS } from '../constants/roles.js';
import { PORTAL_ACCESS } from '../constants/clientPortal.js';
import {
  BILLING_CURRENCY,
  BOOKING_STATUS,
  SESSIONS_PER_CYCLE,
  SUBSCRIPTION_AMOUNT_MINOR,
  SUBSCRIPTION_STATUS,
  formatMinorUnits,
} from '../constants/payments.js';
import {
  CHECKOUT_SESSION_TTL_HOURS,
  PAYMENTS_UNAVAILABLE_CODE,
  PAYMENTS_UNAVAILABLE_MESSAGE,
  RENEWAL_DISCLOSURE,
} from '../constants/checkout.js';
import {
  NO_BOOKING_TO_RESUME_CODE,
  NO_BOOKING_TO_RESUME_MESSAGE,
  RESUBSCRIBE_FAILED_CODE,
  RESUBSCRIBE_FAILED_MESSAGE,
  RESUBSCRIBE_KIND,
  STILL_SUBSCRIBED_CODE,
  STILL_SUBSCRIBED_MESSAGE,
  THERAPIST_GONE_CODE,
  THERAPIST_GONE_MESSAGE,
} from '../constants/subscriptionLifecycle.js';
import { findCurrentSubscription, resolveAccess } from '../middleware/requireActiveSubscription.js';
import { subscriptionLineItem } from './checkout.service.js';
import { resolvePeriodEnd } from './clientOnboarding.service.js';
import { accessUntilText } from './subscriptionLifecycle.service.js';
import { sendWelcomeBackEmail } from './email/email.service.js';

// Re-subscribe after expiry — chunk 11.4, master spec §13.
//
// THE SAME BOOKING, A NEW SUBSCRIPTION ROW (approved 2026-09-25). Everything a
// client has — messages, journal, worksheets, sessions, their therapist — hangs
// off the booking, so it all resumes. A new row keeps each Stripe subscription,
// its ledger rows and its one review (10.3) separate.
//
// THE GOLDEN RULE HOLDS: this file's first half only makes a Stripe page. Access
// returns when the WEBHOOK confirms payment, in its second half. Logs carry ids only.

/** The client's live booking and whether its therapist still practises here. */
async function loadResumable(userId) {
  const booking = await Booking.findOne({ clientId: userId, status: BOOKING_STATUS.ACTIVE })
    .select('_id therapistId')
    .lean();
  if (!booking) return { booking: null, therapist: null };
  const therapist = await TherapistProfile.findOne({ userId: booking.therapistId, status: USER_STATUS.ACTIVE })
    .select('_id userId title firstName lastName')
    .lean();
  return { booking, therapist };
}

/** Can this client re-subscribe right now? Read by /me for the ended screen. */
export async function canResubscribe(userId) {
  const current = await findCurrentSubscription(userId);
  if (resolveAccess(current) !== PORTAL_ACCESS.ENDED) return false;
  const { booking, therapist } = await loadResumable(userId);
  return Boolean(booking && therapist);
}

/** An open re-subscribe page already made for this booking, so two tabs cannot pay twice. */
async function findOpenSession(customer, bookingId) {
  if (!customer) return null;
  try {
    const open = await stripe.checkout.sessions.list({ customer, status: 'open', limit: 10 });
    return (
      open?.data?.find(
        (session) => session.metadata?.kind === RESUBSCRIBE_KIND && session.metadata?.bookingId === String(bookingId),
      ) ?? null
    );
  } catch (error) {
    // Not fatal: a fresh page is made instead.
    console.error(`[resubscribe] could not list open sessions (${error?.name ?? 'Error'})`);
    return null;
  }
}

/**
 * Make a Stripe page to re-subscribe. NO QUESTIONNAIRE: the booking and the
 * therapist are reused. Only our own ids travel to Stripe.
 * @returns {Promise<{ url: string }>}
 */
export async function startResubscription(userId) {
  if (!isStripeConfigured) throw new AppError(PAYMENTS_UNAVAILABLE_MESSAGE, 503, PAYMENTS_UNAVAILABLE_CODE);

  const current = await findCurrentSubscription(userId);
  if (resolveAccess(current) !== PORTAL_ACCESS.ENDED) {
    throw new AppError(STILL_SUBSCRIBED_MESSAGE, 409, STILL_SUBSCRIBED_CODE);
  }

  const { booking, therapist } = await loadResumable(userId);
  if (!booking) throw new AppError(NO_BOOKING_TO_RESUME_MESSAGE, 409, NO_BOOKING_TO_RESUME_CODE);
  if (!therapist) throw new AppError(THERAPIST_GONE_MESSAGE, 409, THERAPIST_GONE_CODE);

  const customer = current?.platformCustomerId ?? null;
  const reusable = await findOpenSession(customer, booking._id);
  if (reusable && isStripeUrl(reusable.url)) return { url: reusable.url };

  const ids = { kind: RESUBSCRIBE_KIND, bookingId: String(booking._id), clientId: String(userId) };
  let session;
  try {
    const user = customer ? null : await User.findById(userId).select('email').lean();
    session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [subscriptionLineItem()],
      ...(customer ? { customer } : { customer_email: user?.email }),
      client_reference_id: String(booking._id),
      metadata: ids,
      subscription_data: { metadata: ids },
      // §13: the renewal terms on the last screen before a card is charged.
      custom_text: { submit: { message: RENEWAL_DISCLOSURE } },
      expires_at: Math.floor(Date.now() / 1000) + CHECKOUT_SESSION_TTL_HOURS * 60 * 60,
      success_url: `${env.clientOrigin}/portal?welcome_back=1`,
      cancel_url: `${env.clientOrigin}/portal`,
    });
  } catch (error) {
    console.error(`[resubscribe] Stripe refused the page for booking ${booking._id} (${error?.name ?? 'Error'})`);
    throw new AppError(RESUBSCRIBE_FAILED_MESSAGE, 502, RESUBSCRIBE_FAILED_CODE);
  }

  if (!isStripeUrl(session?.url)) {
    console.error('[resubscribe] Stripe returned an unexpected URL — refused');
    throw new AppError(RESUBSCRIBE_FAILED_MESSAGE, 502, RESUBSCRIBE_FAILED_CODE);
  }
  return { url: session.url };
}

/** Stop a Stripe subscription we cannot honour. Throws, so the webhook is retried. */
async function stopUnwanted(platformSubscriptionId, eventId, why) {
  await stripe.subscriptions.cancel(platformSubscriptionId);
  console.error(
    `[resubscribe] ${eventId} ${why} — Stripe subscription ${platformSubscriptionId} cancelled. REFUND BY HAND in the Stripe dashboard.`,
  );
}

/**
 * A paid re-subscribe checkout: a new subscription row on the SAME booking.
 *
 * Safe to run twice — a row for this Stripe subscription is looked for first,
 * and the one-active-per-booking index is the atomic backstop. A second payment
 * that slips through, or one for a therapist who has since left, is cancelled at
 * Stripe at once and logged loudly for a refund.
 *
 * @returns {Promise<{ created: boolean, reason?: string }>}
 */
export async function completeResubscription(session, { eventId }) {
  const platformSubscriptionId =
    typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
  const { bookingId, clientId } = session.metadata ?? {};

  if (!platformSubscriptionId || !mongoose.isValidObjectId(bookingId) || !mongoose.isValidObjectId(clientId)) {
    throw new Error(`Re-subscribe ${eventId} carries no usable subscription or booking — resolve by hand.`);
  }

  if (await Subscription.exists({ platformSubscriptionId })) return { created: false, reason: 'already_processed' };

  const booking = await Booking.findOne({ _id: bookingId, clientId, status: BOOKING_STATUS.ACTIVE })
    .select('_id therapistId')
    .lean();
  if (!booking) throw new Error(`Re-subscribe ${eventId}: booking ${bookingId} is not this client's live booking.`);

  const therapist = await TherapistProfile.findOne({ userId: booking.therapistId, status: USER_STATUS.ACTIVE })
    .select('title firstName lastName')
    .lean();
  if (!therapist) {
    await stopUnwanted(platformSubscriptionId, eventId, 'therapist no longer active');
    return { created: false, reason: 'therapist_unavailable' };
  }

  if (resolveAccess(await findCurrentSubscription(clientId)) !== PORTAL_ACCESS.ENDED) {
    await stopUnwanted(platformSubscriptionId, eventId, 'a live subscription already exists');
    return { created: false, reason: 'duplicate' };
  }

  const startDate = new Date();
  const currentPeriodEnd = await resolvePeriodEnd(platformSubscriptionId, startDate);
  let created;
  try {
    created = await Subscription.create({
      bookingId: booking._id,
      clientId,
      status: SUBSCRIPTION_STATUS.ACTIVE,
      currency: BILLING_CURRENCY,
      amount: SUBSCRIPTION_AMOUNT_MINOR,
      startDate,
      currentPeriodEnd,
      nextBillingDate: currentPeriodEnd,
      sessionsRemaining: SESSIONS_PER_CYCLE,
      platformSubscriptionId,
      platformCustomerId: typeof session.customer === 'string' ? session.customer : session.customer?.id,
      checkoutSessionId: session.id,
    });
  } catch (error) {
    if (error?.code !== 11000) throw error;
    // A concurrent delivery of this event won; or a second payment raced the first.
    if (await Subscription.exists({ platformSubscriptionId })) return { created: false, reason: 'already_processed' };
    await stopUnwanted(platformSubscriptionId, eventId, 'a live subscription already exists');
    return { created: false, reason: 'duplicate' };
  }

  try {
    const [user, profile] = await Promise.all([
      User.findById(clientId).select('email').lean(),
      ClientProfile.findOne({ userId: clientId }).select('name coupleData timezone').lean(),
    ]);
    if (user?.email) {
      await sendWelcomeBackEmail(user.email, {
        name: profile?.name ?? profile?.coupleData?.partner1?.name ?? null,
        therapistName: [therapist.title, therapist.firstName, therapist.lastName].filter(Boolean).join(' '),
        amount: formatMinorUnits(created.amount, created.currency),
        nextPayment: accessUntilText(created.nextBillingDate, profile?.timezone),
      });
    }
  } catch (error) {
    console.error(`[resubscribe] ${eventId} welcome-back email failed (${error?.name ?? 'Error'})`);
  }

  console.log(`[resubscribe] ${eventId} booking ${booking._id} resumed with subscription ${created._id}`);
  return { created: true };
}

export default { canResubscribe, startResubscription, completeResubscription };
