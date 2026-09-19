/**
 * A client's initials, for the monogram disc in the therapist's list.
 *
 * Its own module because a file that exports a component AND a plain function
 * breaks fast refresh for the whole file — the trap caught in StepIcons (2.5),
 * ContactIcons (2.6), CheckoutIcons (6.5) and the portal nav icons (7.1).
 *
 * "Rosa" gives R. "Marta and Joris" gives MJ — a couple is two people sharing
 * one account (§6), and one letter would silently pick a favourite. The joining
 * word is dropped so it never becomes the second initial.
 */
export function initialsFrom(name) {
  if (!name) return '?'

  const words = String(name)
    .trim()
    .split(/\s+/)
    .filter((word) => word.toLowerCase() !== 'and')

  const letters = words
    .slice(0, 2)
    .map((word) => [...word][0])
    .filter(Boolean)
    .join('')

  return letters.toUpperCase() || '?'
}

export default initialsFrom
