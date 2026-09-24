/**
 * Copy for the dashboard's system status card (10.6).
 *
 * The server sends fixed state and detail codes, never a vendor's own words;
 * everything the admin reads is written here.
 */

export const SERVICE_STATE = {
  OPERATIONAL: 'operational',
  ATTENTION: 'attention',
  DOWN: 'down',
  NOT_CONFIGURED: 'not_configured',
}

export const SERVICES = {
  database: { name: 'Database', provider: 'MongoDB Atlas' },
  payments: { name: 'Payments', provider: 'Stripe' },
  email: { name: 'Email', provider: 'Resend' },
  storage: { name: 'File storage', provider: 'Cloudinary' },
}

export const STATE_LABEL = {
  operational: 'Working',
  attention: 'Needs attention',
  down: 'Not responding',
  not_configured: 'Not set up',
}

export const DETAIL = {
  test_mode: 'Test mode, so no real card is charged',
  live_mode: 'Live mode',
  test_sender: 'Test sender, so email only reaches the Resend account owner',
  domain_verified: 'Sending domain verified',
  domain_unverified: 'Sending domain not verified in Resend yet',
  sending_key: 'Sending-only key, so the domain can’t be checked from here',
}

// Shown when a state arrives without a detail code.
export const STATE_NOTE = {
  operational: 'Answered the check',
  attention: 'Answered, with something to fix',
  down: 'Didn’t answer the check',
  not_configured: 'No key is set on the server',
}

export const STATUS_CARD = {
  heading: 'System status',
  checking: 'Checking the platform’s services…',
  failed: 'The services couldn’t be checked just now.',
  checkAgain: 'Check again',
  checkedAt: (time) => `Checked at ${time}`,
  latency: (ms) => `${ms} ms`,
  latencyLabel: 'response time',
  scope: 'Database, payments, email and file storage',
}

/** One sentence for the whole card, most serious state first. */
export function summaryFor(services) {
  const count = (state) => services.filter((s) => s.state === state).length
  const down = count(SERVICE_STATE.DOWN)
  const attention = count(SERVICE_STATE.ATTENTION)
  const unset = count(SERVICE_STATE.NOT_CONFIGURED)

  if (down) {
    const verb = down === 1 ? 'service is' : 'services are'
    return { state: SERVICE_STATE.DOWN, text: `${down} ${verb} not responding` }
  }
  if (attention) {
    const verb = attention === 1 ? 'service needs' : 'services need'
    return { state: SERVICE_STATE.ATTENTION, text: `${attention} ${verb} attention` }
  }
  if (unset) {
    const verb = unset === 1 ? 'service is' : 'services are'
    return { state: SERVICE_STATE.NOT_CONFIGURED, text: `${unset} ${verb} not set up` }
  }
  return { state: SERVICE_STATE.OPERATIONAL, text: 'Everything is working' }
}
