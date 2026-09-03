import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Scrolls to `#anchor` after a route change.
 *
 * WHY THIS HAS TO EXIST. React Router does not scroll to a hash on navigation —
 * it changes `location.hash` and stops there. Without this, `/team` redirecting
 * to `/about#team` lands the visitor at the top of the About page and the
 * anchor silently does nothing. The redirect looks like it worked and did not,
 * which is the worst kind of broken.
 *
 * THE ELEMENT USUALLY IS NOT THERE YET. On a fresh navigation this effect can
 * run before the target has painted, so a single `getElementById` misses. It
 * retries across a few animation frames and then gives up rather than looping —
 * a hash pointing at nothing is a bad link, not a reason to spin.
 *
 * REDUCED MOTION. A smooth scroll across a long page is exactly the kind of
 * movement §24.4 disables. Anyone who has asked for less motion is jumped
 * straight there instead.
 *
 * Offset is handled in CSS by `scroll-mt-*` on the target, so the sticky navbar
 * does not cover the heading it just scrolled to.
 */
export default function ScrollToHash() {
  const { hash } = useLocation()

  useEffect(() => {
    if (!hash) return undefined

    const id = decodeURIComponent(hash.slice(1))
    if (!id) return undefined

    const prefersReduced = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    ).matches

    let frame
    let attempts = 0

    const tryScroll = () => {
      const target = document.getElementById(id)
      if (target) {
        target.scrollIntoView({
          behavior: prefersReduced ? 'auto' : 'smooth',
          block: 'start',
        })
        return
      }
      // ~10 frames is enough for a route's first paint. Then stop.
      if (attempts < 10) {
        attempts += 1
        frame = requestAnimationFrame(tryScroll)
      }
    }

    frame = requestAnimationFrame(tryScroll)
    return () => cancelAnimationFrame(frame)
  }, [hash])

  return null
}
