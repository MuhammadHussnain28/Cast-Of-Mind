/**
 * Number formatting for the admin dashboard.
 *
 * Kept out of the component files so fast refresh keeps working, and in one
 * place so two figures can never disagree on how a number is written.
 */

const counts = new Intl.NumberFormat('en-GB')

export const formatCount = (value) => counts.format(value ?? 0)

/**
 * §2: billing is EUR, €200/month.
 *
 * OPEN ITEM for slice 6: §10.6 types `amount` as a Number without saying
 * whether it holds euros or cents. This formats it as whole euros. When slice 6
 * decides, check this — it cannot be wrong today because there are no
 * subscriptions, and it would be very wrong later.
 */
export function formatMoney(value, currency = 'EUR') {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value ?? 0)
}

/**
 * A signed comparison against a named period.
 *
 * Returns null when there is nothing to compare — the first month of the
 * platform's life has no previous month, and "+0" would imply one existed.
 */
export function formatDelta(current, previous) {
  if (previous === 0 && current === 0) return null

  const difference = (current ?? 0) - (previous ?? 0)
  if (difference === 0) return { label: 'Level with last month', direction: 'flat' }

  return {
    label: `${difference > 0 ? '+' : '−'}${formatCount(Math.abs(difference))} vs last month`,
    direction: difference > 0 ? 'up' : 'down',
  }
}
