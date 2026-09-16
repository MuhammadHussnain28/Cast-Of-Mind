import { useEffect, useState } from 'react'
import { badgeLabel } from './unreadStore'

// A badge already on the front of the title, so it is stripped rather than
// stacked. Matches the `9+` form as well as a plain number.
const EXISTING_BADGE = /^\(\d+\+?\)\s+/

const withoutBadge = (title) => title.replace(EXISTING_BADGE, '')

/**
 * `(3) Cast of Mind` while the tab is in the background.
 *
 * NOTHING ABOUT THE MESSAGE GOES IN THE TITLE — not the text, not the
 * therapist's name, not even the word "therapist". A tab title is visible in a
 * tab strip, over someone's shoulder, in a screenshot and in browser history,
 * which makes it the least private surface the product has. A number is enough
 * to bring someone back, and it discloses nothing about who they are talking to
 * or why.
 *
 * ONLY WHILE THE TAB IS HIDDEN. Someone looking at the conversation does not
 * need their own tab shouting a count at them, and the count is about to be
 * zero anyway because reading it marks it read.
 *
 * The base title is re-derived from the live `document.title` on every pass
 * rather than captured once, so a later chunk adding per-page titles cannot
 * find this hook holding a stale one.
 */
export function useUnreadTabTitle(total) {
  const [hidden, setHidden] = useState(() =>
    typeof document === 'undefined' ? false : document.hidden,
  )

  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden)
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  useEffect(() => {
    const base = withoutBadge(document.title)
    const label = hidden ? badgeLabel(total) : null

    document.title = label ? `(${label}) ${base}` : base

    // Leaving the portal must never leave a count behind on the marketing site.
    return () => {
      document.title = withoutBadge(document.title)
    }
  }, [total, hidden])
}
