import mongoose from 'mongoose';
import env from '../config/env.js';
import { stripe, isStripeConfigured } from '../config/stripe.js';
import { AppError } from '../utils/AppError.js';
import { User } from '../models/User.js';
import { ClientProfile } from '../models/ClientProfile.js';
import { TherapistProfile } from '../models/TherapistProfile.js';
import { PendingCheckout } from '../models/PendingCheckout.js';
import { Subscription } from '../models/Subscription.js';
import { USER_STATUS } from '../constants/roles.js';
import {
  BILLING_CURRENCY,
  SUBSCRIPTION_AMOUNT_MINOR,
} from '../constants/payments.js';
import {
  CHECKOUT_PRODUCT_DESCRIPTION,
  CHECKOUT_PRODUCT_NAME,
  CHECKOUT_SESSION_TTL_HOURS,
  EMAIL_IN_USE_CODE,
  EMAIL_IN_USE_MESSAGE,
  PAYMENTS_UNAVAILABLE_CODE,
  PAYMENTS_UNAVAILABLE_MESSAGE,
  RENEWAL_DISCLOSURE,
  THERAPIST_UNAVAILABLE_CODE,
  THERAPIST_UNAVAILABLE_MESSAGE,
  SESSION_STATUS,
} from '../constants/checkout.js';

/**
 * Creating a checkout session.
 *
 * NOTHING HERE CREATES AN ACCOUNT. No user, no clientProfile, no booking, no
 * subscription. §12's golden rule puts all four behind webhook confirmation, and
 * chunk 6.4 is the only place they are written. This function stores a draft and
 * returns a URL, and that is all it is allowed to do.
 *
 * THE APPLICATION NEVER TOUCHES CARD DETAILS. We ask Stripe for a hosted page;
 * the card is entered there. No card field is accepted by this endpoint, and
 * none could be — the schema strips unknown keys.
 */

/**
 * Run the REAL ClientProfile validators over the answers without saving.
 *
 * The Zod layer already checked the shape, but the model is the authority and
 * carries rules Zod does not — the fixed-list validator's duplicate check, the
 * cross-branch guard, the enum lists. Running them here means we can never take
 * €200 for a questionnaire that would fail to persist at 6.4, which would leave
 * a paying client with no account and a webhook that cannot succeed.
 *
 * `validate()` runs validators only. It touches no connection and writes
 * nothing. (`validateSync()` would do the same but is deprecated in Mongoose 9
 * and removed in 10.)
 */
async function assertQuestionnaireWillPersist(questionnaire) {
  const draft = new ClientProfile({
    ...questionnaire,
    // Required by the model, and genuinely not known yet — the user does not
    // exist until 6.4. A placeholder id keeps the check focused on the answers.
    userId: new mongoose.Types.ObjectId(),
  });

  try {
    await draft.validate();
    return;
  } catch (error) {
    const validationError = new AppError('Invalid input.', 422, 'VALIDATION_ERROR');
    validationError.details = Object.entries(error.errors ?? {}).map(([path, issue]) => ({
      path,
      message: issue.message,
    }));
    throw validationError;
  }
}

/**
 * The therapist must exist and be active, checked before any money moves.
 *
 * Carried from chunk 5.6: the client's selection is a snapshot that could be
 * minutes or days old, and paying to reach a deactivated therapist is the
 * failure to avoid. Chunk 6.4 checks again at webhook time, because a therapist
 * can be deactivated while the Stripe page is open.
 */
async function assertTherapistAvailable(therapistProfileId) {
  const therapist = await TherapistProfile.findOne({
    _id: therapistProfileId,
    status: USER_STATUS.ACTIVE,
  })
    .select('_id userId')
    .lean();

  if (!therapist) {
    throw new AppError(THERAPIST_UNAVAILABLE_MESSAGE, 409, THERAPIST_UNAVAILABLE_CODE);
  }

  return therapist;
}

/**
 * Refuse a registered address BEFORE payment.
 *
 * One message for a client, a therapist or the admin — the chunk 3.2 pattern.
 * It concedes that the address is known to us but never what kind of record it
 * is, and on this platform "this address belongs to a client" is the sensitive
 * half. Rate limiting is what keeps that concession small.
 *
 * The alternative — letting them pay and failing at the webhook — would take
 * €200 from someone who then cannot be given an account.
 */
async function assertEmailIsFree(email) {
  const existing = await User.findOne({ email }).select('_id').lean();

  if (existing) {
    throw new AppError(EMAIL_IN_USE_MESSAGE, 409, EMAIL_IN_USE_CODE);
  }
}

/**
 * The one subscription line item — INLINE PRICE, built from our own constant
 * (developer's decision, 2026-09-07), so what Stripe charges and what we store
 * come from one line of code. Shared with re-subscribe (11.4).
 */
export function subscriptionLineItem() {
  return {
    quantity: 1,
    price_data: {
      currency: BILLING_CURRENCY.toLowerCase(),
      unit_amount: SUBSCRIPTION_AMOUNT_MINOR,
      recurring: { interval: 'month' },
      product_data: {
        name: CHECKOUT_PRODUCT_NAME,
        description: CHECKOUT_PRODUCT_DESCRIPTION,
      },
    },
  };
}

export async function createCheckoutSession({ email, therapistProfileId, questionnaire }) {
  if (!isStripeConfigured) {
    // Development without payment credentials. A clear 503 rather than a
    // confusing failure deeper in the SDK.
    throw new AppError(PAYMENTS_UNAVAILABLE_MESSAGE, 503, PAYMENTS_UNAVAILABLE_CODE);
  }

  await assertQuestionnaireWillPersist(questionnaire);
  await assertTherapistAvailable(therapistProfileId);
  await assertEmailIsFree(email);

  // ORDER MATTERS, AND THIS IS THE SAFE DIRECTION.
  //
  // The draft is written first, carrying its own random `reference`. If the
  // Stripe call then fails we are left with an orphan draft that expires on its
  // own — harmless. The reverse order could leave a PAID session with no
  // questionnaire behind it, which strands a client who has already been charged.
  const pending = await PendingCheckout.create({
    email,
    therapistProfileId,
    questionnaire,
    expiresAt: PendingCheckout.expiryFromNow(),
  });

  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'subscription',

      line_items: [subscriptionLineItem()],

      // Prefilled so the address they subscribe with is the address they gave
      // us, rather than whatever is saved in their browser.
      customer_email: email,

      // Our own key, echoed back on the webhook. NOT sensitive — 32 random
      // bytes. NO QUESTIONNAIRE DATA GOES TO STRIPE: concern tags are somebody's
      // mental health information and stay in our own database.
      client_reference_id: pending.reference,
      metadata: { pendingCheckoutReference: pending.reference },

      // §13 requires the auto-renewal terms at checkout, and calls this the most
      // important of the three places it must appear. Stripe's page is the last
      // screen before a card is charged, so it is stated there as well as in the
      // UI that 6.5 builds.
      custom_text: { submit: { message: RENEWAL_DISCLOSURE } },

      expires_at: Math.floor(Date.now() / 1000) + CHECKOUT_SESSION_TTL_HOURS * 60 * 60,

      success_url: `${env.clientOrigin}/welcome?session_id={CHECKOUT_SESSION_ID}`,
      // A page of its own rather than a query-param mode on /checkout, so the
      // "nothing was charged" reassurance is a real screen. Built in chunk 6.5.
      cancel_url: `${env.clientOrigin}/checkout/cancel`,
    });
  } catch (error) {
    // The draft is left to expire rather than deleted: a failed Stripe call may
    // still have created a session we never heard about, and a draft that
    // outlives a stray session is safer than one that does not.
    console.error('[checkout] Stripe session creation failed:', error.message);
    throw new AppError(PAYMENTS_UNAVAILABLE_MESSAGE, 502, PAYMENTS_UNAVAILABLE_CODE);
  }

  // Write-back, so 6.4 can find the draft by session id as well as by
  // reference. Non-fatal by design: `client_reference_id` already reaches the
  // webhook, so losing this write costs nothing.
  try {
    await PendingCheckout.updateOne(
      { _id: pending._id },
      { $set: { checkoutSessionId: session.id } },
    );
  } catch (error) {
    console.error('[checkout] could not store the session id:', error.message);
  }

  return { url: session.url, reference: pending.reference };
}

/**
 * Has the webhook turned this checkout into an account yet?
 *
 * READ-ONLY, AND THAT IS THE POINT. §12's golden rule puts account creation
 * behind the webhook; /welcome only reports. Nothing in this function writes,
 * and a test asserts the counts are unchanged after calling it.
 *
 * The subscription is the proof: it exists only if the whole four-document
 * transaction committed, so its presence means the work is genuinely done —
 * not merely started.
 *
 * Returns ONE WORD. Never the email, the therapist, the amount or the name.
 */
export async function getSessionStatus(sessionId) {
  const subscription = await Subscription.findOne({ checkoutSessionId: sessionId })
    .select('_id')
    .lean();

  if (subscription) return SESSION_STATUS.READY;

  // The draft is deleted inside the transaction, so its survival means the
  // webhook has not been through yet.
  const pending = await PendingCheckout.findOne({ checkoutSessionId: sessionId })
    .select('_id')
    .lean();

  if (pending) return SESSION_STATUS.PROCESSING;

  // Expired, or never real. Deliberately the same answer for both, so this
  // cannot be used to probe for valid session ids.
  return SESSION_STATUS.UNKNOWN;
}

export default { createCheckoutSession, getSessionStatus };
