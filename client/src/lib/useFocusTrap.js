import { useCallback, useEffect, useRef } from 'react'

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Keeps keyboard focus inside one element while it is open.
 *
 * Used by both the Modal and the mobile menu, so the behaviour is written
 * once instead of twice. It does four things people rely on:
 *   1. Tab and Shift+Tab loop inside the container
 *   2. Escape closes
 *   3. focus moves into the container when it opens
 *   4. focus goes back to whatever opened it when it closes
 *
 * `lockScroll` stops the page behind from scrolling.
 */
export function useFocusTrap({ active, containerRef, onClose, lockScroll = true }) {
  const returnFocusRef = useRef(null)

  const onKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose?.()
        return
      }
      if (e.key !== 'Tab') return

      const nodes = containerRef.current?.querySelectorAll(FOCUSABLE)
      if (!nodes || nodes.length === 0) {
        e.preventDefault()
        return
      }
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    },
    [containerRef, onClose],
  )

  useEffect(() => {
    if (!active) return
    returnFocusRef.current = document.activeElement

    let previousOverflow
    if (lockScroll) {
      previousOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
    }

    const t = window.setTimeout(() => {
      const nodes = containerRef.current?.querySelectorAll(FOCUSABLE)
      if (nodes && nodes.length) nodes[0].focus()
      else containerRef.current?.focus()
    }, 0)

    return () => {
      window.clearTimeout(t)
      if (lockScroll) document.body.style.overflow = previousOverflow
      returnFocusRef.current?.focus?.()
    }
  }, [active, containerRef, lockScroll])

  return { onKeyDown }
}
