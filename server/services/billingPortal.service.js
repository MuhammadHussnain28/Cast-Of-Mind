import env from '../config/env.js';
import { stripe, isStripeConfigured } from '../config/stripe.js';
import { AppError } from '../utils/AppError.js';
import { findCurrentSubscription } from '../middleware/requireActiveSubscription.js';
import {
  BILLING_NOT_CONFIGURED_CODE,
  BILLING_NOT_CONFIGURED_MESSAGE,
  BILLING_PORTAL_FAILED_CODE,
  BILLING_PORTAL_FAILED_MESSAGE,
  NO_BILLING_ACCOUNT_CODE,
  NO_BILLING_ACCOUNT_MESSAGE,
} from '../constants/subscriptionLifecycle.js';
import { isStripeUrl } from '../utils/stripeUrl.js';

// Stripe's Customer Portal, where a client updates their card (11.2; 11.5 reuses).
//
// The customer id is read server-side from the client's own subscription, found
// by their token. It never reaches the browser — only a short-lived portal URL.


/** @returns {Promise<{ url: string }>} */
export async function createBillingPortalSession(userId) {
  if (!isStripeConfigured) {
    throw new AppError(BILLING_NOT_CONFIGURED_MESSAGE, 503, BILLING_NOT_CONFIGURED_CODE);
  }

  const subscription = await findCurrentSubscription(userId);
  const customer = subscription?.platformCustomerId;
  if (!customer) {
    throw new AppError(NO_BILLING_ACCOUNT_MESSAGE, 409, NO_BILLING_ACCOUNT_CODE);
  }

  let session;
  try {
    session = await stripe.billingPortal.sessions.create({
      customer,
      return_url: `${env.clientOrigin}/portal/account`,
    });
  } catch (error) {
    // Stripe's text never reaches the caller; the name only, never the message.
    console.error(`[billing] portal session failed (${error?.name ?? 'Error'})`);
    throw new AppError(BILLING_PORTAL_FAILED_MESSAGE, 502, BILLING_PORTAL_FAILED_CODE);
  }

  if (!isStripeUrl(session?.url)) {
    console.error('[billing] portal session returned an unexpected URL — refused');
    throw new AppError(BILLING_PORTAL_FAILED_MESSAGE, 502, BILLING_PORTAL_FAILED_CODE);
  }

  return { url: session.url };
}

export default createBillingPortalSession;
