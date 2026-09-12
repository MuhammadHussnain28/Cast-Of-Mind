import { apiClient } from './client'
import { toApiError } from './ApiError'

/**
 * Ask the server for a Stripe checkout session.
 *
 * The browser NEVER sees a card field. This returns a URL on Stripe's own
 * hosted page, and the redirect is the whole handover — nothing in this
 * application touches, stores or forwards card details.
 *
 * NO ACCOUNT EXISTS AFTER THIS CALL. Per §12's golden rule, the account is
 * created only when the webhook confirms payment, never when the browser comes
 * back to a success page.
 */
export async function createCheckoutSession(payload) {
  try {
    const { data } = await apiClient.post('/checkout/create-session', payload)
    return data.url
  } catch (error) {
    throw toApiError(error)
  }
}

/**
 * Has the webhook finished creating the account for this session?
 *
 * READ-ONLY. /welcome polls this so it can say "setting up your account"
 * honestly rather than guessing — it never creates anything, and the server
 * returns one word and nothing about the person.
 */
export async function fetchSessionStatus(sessionId) {
  try {
    const { data } = await apiClient.get('/checkout/session-status', { params: { sessionId } })
    return data.status
  } catch (error) {
    throw toApiError(error)
  }
}
