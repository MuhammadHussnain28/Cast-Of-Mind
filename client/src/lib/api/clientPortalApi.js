import { apiClient } from './client'
import { toApiError } from './ApiError'

/**
 * The client portal's own state — profile, booking, therapist basics and
 * subscription (§7).
 *
 * This endpoint sits OUTSIDE the server's subscription gate on purpose, so it
 * answers for a client whose subscription has ended. `access` in the response
 * is what decides whether the portal or the re-subscribe screen renders.
 */
export async function fetchClientMe() {
  try {
    const { data } = await apiClient.get('/client/me')
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

// "Update your card" (11.2): a short-lived Stripe Customer Portal link. The
// customer id stays on the server; only the URL comes back.
export async function openBillingPortal() {
  try {
    const { data } = await apiClient.post('/client/billing/portal')
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

// Cancel and reactivate (11.3). No body: the server finds the subscription from
// the token.
export async function cancelMySubscription() {
  try {
    const { data } = await apiClient.post('/client/subscription/cancel')
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

export async function reactivateMySubscription() {
  try {
    const { data } = await apiClient.post('/client/subscription/reactivate')
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

// Re-subscribe after expiry (11.4): a Stripe page for the same booking. No body.
export async function startResubscription() {
  try {
    const { data } = await apiClient.post('/client/subscription/resubscribe')
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

// Billing history (11.5): the client's own payments, one row per invoice.
export async function fetchBillingHistory(page = 1) {
  try {
    const { data } = await apiClient.get('/client/billing/history', { params: { page } })
    return data
  } catch (error) {
    throw toApiError(error)
  }
}

// The browser's own zone (9.2), so the therapist can see when a session lands.
export async function saveClientTimezone(timezone) {
  try {
    const { data } = await apiClient.patch('/client/timezone', { timezone })
    return data
  } catch (error) {
    throw toApiError(error)
  }
}
