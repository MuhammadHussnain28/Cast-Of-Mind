// Only an https URL on Stripe's own domain is ever handed to a browser to follow
// (11.2, 11.4). `.stripe.com` with the dot, so `evilstripe.com` and
// `stripe.com.evil.example` are both refused.
export function isStripeUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname.endsWith('.stripe.com');
  } catch {
    return false;
  }
}

export default isStripeUrl;
