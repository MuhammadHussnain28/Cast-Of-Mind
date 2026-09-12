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
 * TAKES MINOR UNITS — CENTS. €200.00 arrives as 20000.
 *
 * Resolved in chunk 6.1, closing the open item 4.4 recorded: money is stored in
 * cents everywhere, because Stripe speaks cents and the payment ledger has to
 * match Stripe exactly for disputes. This is the one place in the client that
 * knows about the 100.
 *
 * Fractions are dropped because every figure on this dashboard is a whole-euro
 * subscription total; a stray ".00" on a headline number reads as noise.
 */
const MINOR_UNITS_PER_MAJOR = 100

export function formatMoney(minorUnits, currency = 'EUR') {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format((minorUnits ?? 0) / MINOR_UNITS_PER_MAJOR)
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
