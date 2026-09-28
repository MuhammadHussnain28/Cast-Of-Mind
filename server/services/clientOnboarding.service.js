import mongoose from 'mongoose';
import { stripe } from '../config/stripe.js';
import { User } from '../models/User.js';
import { ClientProfile } from '../models/ClientProfile.js';
import { TherapistProfile } from '../models/TherapistProfile.js';
import { Booking } from '../models/Booking.js';
import { Subscription } from '../models/Subscription.js';
import { PendingCheckout } from '../models/PendingCheckout.js';
import { hashPassword, generateTemporaryPassword } from '../utils/password.js';
import { ROLES, USER_STATUS } from '../constants/roles.js';
import { sendClientWelcomeEmail } from './email/email.service.js';
import { notifyQuietly } from './notification.service.js';
import { NOTIFICATION_TYPE } from '../constants/notifications.js';
import { addOneMonth } from './subscriptionRenewal.service.js';
import {
  BILLING_CURRENCY,
  BOOKING_STATUS,
  SESSIONS_PER_CYCLE,
  SUBSCRIPTION_AMOUNT_MINOR,
  SUBSCRIPTION_STATUS,
} from '../constants/payments.js';

/**
 * Turning a confirmed payment into an account.
 *
 * THE GOLDEN RULE ENDS HERE (§12): this is the only place on the platform that
 * creates a client. It runs from a verified webhook, never from a browser
 * redirect.
 *
 * FOUR DOCUMENTS, ONE TRANSACTION (§10). A half-created account — a user with
 * no subscription, or a booking with no profile — is a serious failure state:
 * the client has paid, can log in, and the portal cannot answer who their
 * therapist is. All four succeed or none do.
 *
 * NOTHING HERE IS EVER LOGGED FROM THE PAYLOAD. The temporary password, the
 * email address, the concern tags and the partners' names are all off limits.
 */

/**
 * One calendar month on, used only when Stripe cannot tell us the real date.
 * Clamped (11.4): plain setUTCMonth turned 31 January into 3 March.
 */
const oneMonthFrom = (date) => addOneMonth(date);

/**
 * Ask Stripe when the paid period actually ends.
 *
 * Preferred over computing +1 month because this date is shown to the client as
 * "Next payment" and drives slice 11's reminder emails. A hand-computed date
 * drifts from Stripe's real billing schedule, and then we tell people the wrong
 * day and email them at the wrong time.
 *
 * Falls back rather than failing: a billing date that is approximately right is
 * far better than refusing to create an account somebody has paid for.
 */
export async function resolvePeriodEnd(subscriptionId, startDate) {
  if (!subscriptionId) return oneMonthFrom(startDate);

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const seconds =
      subscription.current_period_end ??
      subscription.items?.data?.[0]?.current_period_end ??
      null;

    if (Number.isInteger(seconds)) return new Date(seconds * 1000);
  } catch (error) {
    console.error('[onboarding] could not read the period end from Stripe:', error.message);
  }

  return oneMonthFrom(startDate);
}

/**
 * Has this payment already been turned into an account?
 *
 * THIS IS THE IDEMPOTENCY THAT ACTUALLY MATTERS, and chunk 6.3 recorded why:
 * the ledger row is written before this handler runs, so if the handler fails
 * the retry is skipped as a duplicate event. The ledger cannot be the guard.
 * The subscription itself is — it exists only if the whole transaction
 * committed, so its presence is proof the work is done.
 *
 * The unique partial index on platformSubscriptionId (chunk 6.1) is the atomic
 * backstop underneath this read, for two retries arriving together.
 */
async function alreadyProcessed(platformSubscriptionId) {
  if (!platformSubscriptionId) return null;

  return Subscription.findOne({ platformSubscriptionId }).select('_id clientId').lean();
}

/** The name to greet a client by — one person, or the first of a couple. */
function greetingName(questionnaire) {
  return questionnaire?.name ?? questionnaire?.coupleData?.partner1?.name ?? null;
}

/**
 * Create the account for a paid checkout session.
 *
 * @param {object} session The Stripe checkout.session object from the webhook.
 * @returns {Promise<{created: boolean, reason?: string, userId?: string}>}
 */
export async function createClientAccount(session) {
  const platformSubscriptionId =
    typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;

  const existing = await alreadyProcessed(platformSubscriptionId);
  if (existing) {
    return { created: false, reason: 'already_processed', userId: String(existing.clientId) };
  }

  // The draft was keyed by our own random reference, which travelled to Stripe
  // as client_reference_id. The session id is the fallback, in case the
  // write-back in 6.2 failed after the session was created.
  const draft = await PendingCheckout.findOne({
    $or: [
      { reference: session.client_reference_id ?? '__none__' },
      { checkoutSessionId: session.id ?? '__none__' },
    ],
  });

  if (!draft) {
    // Unrecoverable automatically: no draft and no subscription means the
    // 26-hour TTL expired before the webhook arrived, so the questionnaire is
    // gone. Throwing surfaces it as a failed delivery in Stripe's dashboard
    // rather than losing it silently — somebody has paid €200. The ledger's
    // rawPayload holds everything needed to rebuild it by hand.
    throw new Error(
      `No pending checkout for session ${session.id} — the draft expired or was already consumed.`,
    );
  }

  // Re-verified here as well as at checkout: a therapist can be deactivated
  // while the Stripe page is open. Carried forward from chunk 6.2.
  const therapist = await TherapistProfile.findOne({
    _id: draft.therapistProfileId,
    status: USER_STATUS.ACTIVE,
  })
    .select('_id userId firstName lastName title')
    .lean();

  if (!therapist) {
    throw new Error(
      `Therapist ${draft.therapistProfileId} is not active — cannot create an account for session ${session.id}.`,
    );
  }

  // Generated, never chosen — a client has no password field anywhere in the
  // questionnaire. This plaintext lives only until the email is sent.
  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);

  const startDate = new Date();
  const currentPeriodEnd = await resolvePeriodEnd(platformSubscriptionId, startDate);

  const mongoSession = await mongoose.startSession();
  let createdUserId = null;
  // Captured inside the transaction so the bell (10.4) can be told afterwards
  // which booking to open, without a second query.
  let createdBookingId = null;

  try {
    await mongoSession.withTransaction(async () => {
      const [user] = await User.create(
        [
          {
            email: draft.email,
            passwordHash,
            role: ROLES.CLIENT,
            status: USER_STATUS.ACTIVE,
          },
        ],
        { session: mongoSession },
      );

      // A COUPLE IS ONE USER AND ONE PROFILE (§6). The questionnaire is already
      // stored in exactly the shape clientProfiles expects, partners nested
      // under coupleData, so it passes straight through with no reshaping.
      await ClientProfile.create(
        [{ ...draft.questionnaire, userId: user._id }],
        { session: mongoSession },
      );

      const [booking] = await Booking.create(
        [
          {
            clientId: user._id,
            // The therapist's USER id, not their profile id — §10.5 links
            // bookings between two users, and both portals query it that way.
            therapistId: therapist.userId,
            status: BOOKING_STATUS.ACTIVE,
          },
        ],
        { session: mongoSession },
      );

      await Subscription.create(
        [
          {
            bookingId: booking._id,
            clientId: user._id,
            status: SUBSCRIPTION_STATUS.ACTIVE,
            currency: BILLING_CURRENCY,
            // MINOR UNITS — 20000 is €200.00 (chunk 6.1).
            amount: SUBSCRIPTION_AMOUNT_MINOR,
            startDate,
            currentPeriodEnd,
            nextBillingDate: currentPeriodEnd,
            sessionsRemaining: SESSIONS_PER_CYCLE,
            platformSubscriptionId,
            // What /welcome polls on. Set here so the link exists the moment
            // the account does — not a moment later.
            checkoutSessionId: session.id,
            platformCustomerId:
              typeof session.customer === 'string' ? session.customer : session.customer?.id,
          },
        ],
        { session: mongoSession },
      );

      // Consumed inside the transaction, so a rollback puts it back and a retry
      // can still work. Deleting it afterwards would strand a failed attempt.
      await PendingCheckout.deleteOne({ _id: draft._id }, { session: mongoSession });

      createdUserId = user._id;
      createdBookingId = booking._id;
    });
  } catch (error) {
    // Two deliveries of one event at once (duplicates are routed since 11.1):
    // the loser hits a unique index. If the winner's account now exists, the
    // work is done. Anything else is a real failure, and Stripe retries it.
    const winner = await alreadyProcessed(platformSubscriptionId);
    if (winner) return { created: false, reason: 'already_processed', userId: String(winner.clientId) };
    throw error;
  } finally {
    await mongoSession.endSession();
  }

  // AFTER THE COMMIT, NEVER INSIDE IT. An email sent from inside a transaction
  // that then aborts tells somebody their account is ready when it is not.
  //
  // A failure here must not undo the account: they have paid, the account
  // works, and "Forgot password" recovers the credentials. Losing a paid
  // account because Resend hiccuped would be far worse than a missing email.
  let emailSent = false;
  try {
    await sendClientWelcomeEmail(draft.email, {
      name: greetingName(draft.questionnaire),
      temporaryPassword,
      therapistName: [therapist.title, therapist.firstName, therapist.lastName]
        .filter(Boolean)
        .join(' '),
    });
    emailSent = true;
  } catch (error) {
    // The message only — never the address, never the password.
    console.error('[onboarding] welcome email failed to send:', error.message);
  }

  // 10.4: the therapist's bell — "a new client has been matched with you".
  // After the commit for the same reason the email is: a notification must
  // never be able to roll back an account somebody has paid for. It also
  // carries no name, only the booking to open.
  await notifyQuietly({
    userId: therapist.userId,
    type: NOTIFICATION_TYPE.NEW_CLIENT,
    bookingId: createdBookingId,
  });

  return { created: true, userId: String(createdUserId), emailSent };
}

export default { createClientAccount };
