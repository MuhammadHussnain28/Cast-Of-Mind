import Stripe from 'stripe';
import env from './env.js';

// Stripe client — master spec §12.
//
// THE APPLICATION NEVER TOUCHES RAW CARD DETAILS. We create a Checkout Session
// and hand the browser a URL; the card is entered on Stripe's own hosted page.
// Nothing in this codebase accepts, stores, logs or forwards a card number, and
// no Stripe.js runs in our frontend — which is why there is no publishable key
// anywhere in this project.
//
// Configuration is REQUIRED IN PRODUCTION (checked at startup in config/env.js)
// and optional in development, the same pattern Resend and Cloudinary use, so
// someone working on chat is not forced to hold payment credentials. When it is
// unconfigured the checkout endpoint returns a clear 503 rather than failing
// somewhere deeper with a confusing error.

export const isStripeConfigured = Boolean(env.stripeSecretKey);

export const stripe = isStripeConfigured
  ? new Stripe(env.stripeSecretKey, {

      // Pinned rather than floating, and pinned to the version THIS SDK ships
      // with (stripe 22.6.1). Stripe rolls its API forward, and an unpinned
      // client changes shape on their schedule instead of ours — on the one
      // integration where a surprise costs money.
      //
      // If the stripe package is ever upgraded, bump this deliberately to match
      // the new bundled version. Pinning to a version the SDK does not expect is
      // worse than not pinning at all, because the request and the types disagree.
      
      apiVersion: '2026-08-26.dahlia',
      appInfo: { name: 'Cast of Minds', version: '1.0.0' },
      // Stripe retries idempotently on network errors; two is enough to ride
      // out a blip without leaving a checkout hanging for a person watching it.
      maxNetworkRetries: 2,
      timeout: 20000,
    })
  : null;

/**
 * True when the key is a TEST key.
 *
 * Used to log loudly in development if a LIVE key is ever loaded on a developer
 * machine — the moment that happens, a mistaken click charges a real card.
 */
export const isTestKey = Boolean(env.stripeSecretKey?.startsWith('sk_test_'));

if (isStripeConfigured && !env.isProduction && !isTestKey) {
  console.warn('[stripe] WARNING: a LIVE secret key is loaded outside production.');
  console.warn('[stripe] Real cards will be charged. Swap it for an sk_test_ key.');
}

export default stripe;
