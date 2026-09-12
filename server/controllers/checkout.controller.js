import { asyncHandler } from '../middleware/asyncHandler.js';
import { createCheckoutSession, getSessionStatus } from '../services/checkout.service.js';

/**
 * POST /api/v1/checkout/create-session — public, unauthenticated.
 *
 * Public because it has to be: a client has no account until payment succeeds
 * (§10.1), so there is no token to check. That single fact drives the rate
 * limit, the strict schema and the pre-payment email check.
 *
 * NOTHING IS LOGGED FROM THE BODY. It carries concern tags, an email and, for a
 * couple, two people's names and ages — none of which belongs in a log file.
 */
export const createSession = asyncHandler(async (req, res) => {
  const { email, therapistProfileId, questionnaire } = req.body;

  const { url } = await createCheckoutSession({ email, therapistProfileId, questionnaire });

  // Only the redirect URL. The pending reference stays server-side: it is the
  // key the webhook trusts, and there is nothing the browser can do with it.
  res.status(201).json({ url });
});

/**
 * GET /api/v1/checkout/session-status — what /welcome polls.
 *
 * THIS ENDPOINT CREATES NOTHING. It exists so the welcome page can say
 * "setting up your account" honestly instead of guessing, and it is read-only
 * by construction — §12's golden rule keeps creation behind the webhook.
 *
 * ONE KEY IN THE RESPONSE. A payment confirmation page is a link people paste
 * and screenshot; nothing about the person belongs in it.
 */
export const sessionStatus = asyncHandler(async (req, res) => {
  const status = await getSessionStatus(req.validatedQuery.sessionId);

  res.status(200).json({ status });
});

export default { createSession, sessionStatus };
