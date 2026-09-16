import { useEffect, useState } from 'react'

// How much shorter the visual viewport has to get before we call it a keyboard
// rather than a toolbar collapsing on scroll. Mobile browser chrome moves by
// roughly 50-90px; a software keyboard takes 250px or more.
const KEYBOARD_THRESHOLD_PX = 150

/**
 * The height actually visible while a software keyboard is open.
 *
 * THE PROBLEM. The portal shell is `h-dvh` with `overflow-hidden`, which is
 * what gives the chat a definite height to scroll inside (chunk 7.4). But on
 * iOS the keyboard is drawn OVER the viewport rather than shrinking it: `dvh`
 * does not change, so the composer — pinned to the bottom of a box that is
 * still full-screen tall — ends up underneath the keyboard, and someone typing
 * cannot see what they are writing.
 *
 * `visualViewport` is the only API that reports what is genuinely on screen.
 * Returns null whenever no keyboard is up, so the layout falls straight back to
 * `dvh` and nothing is overridden in the ordinary case.
 *
 * Android Chrome is handled declaratively by `interactive-widget=resizes-content`
 * in index.html; this is what covers iOS, where that meta is ignored.
 */
export function useKeyboardViewportHeight() {
  const [height, setHeight] = useState(null)

  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return undefined

    const apply = () => {
      const covered = window.innerHeight - viewport.height
      setHeight(covered > KEYBOARD_THRESHOLD_PX ? viewport.height : null)

      // iOS scrolls the whole page up to reveal the focused field, which drags
      // the fixed shell half off screen. Putting the document back means the
      // height above is measured against a page that has not moved.
      if (covered > KEYBOARD_THRESHOLD_PX && window.scrollY !== 0) window.scrollTo(0, 0)
    }

    apply()
    viewport.addEventListener('resize', apply)
    viewport.addEventListener('scroll', apply)

    return () => {
      viewport.removeEventListener('resize', apply)
      viewport.removeEventListener('scroll', apply)
    }
  }, [])

  return height
}
