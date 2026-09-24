import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { BellIcon } from './NotificationIcons'
import NotificationRow from './NotificationRow'
import { useNotifications } from '../../../../lib/notifications/notificationContext'
import { BELL } from '../../../../data/notificationContent'
import { cx } from '../../../../lib/cx'

/**
 * The bell — master spec §8.8.
 *
 * WHAT IT IS FOR: a therapist reading Client A needs to know Client B wrote,
 * without checking every client by hand. It is NOT a second unread badge —
 * the per-client counts in the list are still the per-conversation truth.
 *
 * The panel is a real popover: Escape closes it, a click outside closes it,
 * focus returns to the bell, and it is positioned `fixed` so it escapes the
 * rail's own scroll container rather than being clipped by it.
 *
 * OPENING IT MARKS NOTHING READ. Reading happens when an alert is opened, or
 * when "Mark all as read" is pressed — anything else is a count that lies.
 */
export default function NotificationBell() {
  const panelId = useId()
  const { rows, unread, failed, reload, readOne, readAll } = useNotifications()
  const [open, setOpen] = useState(false)
  const buttonRef = useRef(null)
  const panelRef = useRef(null)

  const close = useCallback(
    ({ restoreFocus = true } = {}) => {
      setOpen(false)
      if (restoreFocus) buttonRef.current?.focus()
    },
    [],
  )

  useEffect(() => {
    if (!open) return undefined

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        close()
      }
    }

    const onPointerDown = (event) => {
      if (panelRef.current?.contains(event.target)) return
      if (buttonRef.current?.contains(event.target)) return
      close({ restoreFocus: false })
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open, close])

  // Focus moves into the panel when it opens, so a keyboard user is not left
  // behind the button with a list they cannot reach.
  useEffect(() => {
    if (open) panelRef.current?.focus()
  }, [open])

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={unread > 0 ? BELL.labelWith(unread) : BELL.label}
        onClick={() => setOpen((current) => !current)}
        className={cx(
          'relative flex size-11 items-center justify-center rounded-xl',
          'transition-colors duration-200 ease-out hover:bg-paper/10',
          open ? 'bg-paper/10 text-paper' : 'text-paper/70 hover:text-paper',
        )}
      >
        <BellIcon className="size-5" />

        {/* Gold on ink is 11.08:1 — the only ground in this portal where the
            accent can carry a count. The number is in the button's accessible
            name above, so this pill is decorative. */}
        {unread > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-0.5 -top-0.5 flex min-w-4.5 items-center justify-center rounded-full bg-gold px-1 py-0.5 font-body text-[0.6875rem] font-medium leading-none text-ink tabular-nums"
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-label={BELL.panelLabel}
          tabIndex={-1}
          data-surface="dark"

          // ----------------------------

          className={cx(
            'fixed z-50 rounded-2xl bg-ink-deep p-2 shadow-2xl ring-1 ring-paper/15 focus-visible:outline-none',
            // On mobile phones: centered at the top
            'inset-x-3 top-16',
            // On desktop: floats on the right side of the 320px sidebar
            'sm:left-[328px] sm:top-5 sm:w-80 sm:inset-x-auto',
          )}



        > 
          <div className="flex items-center justify-between gap-2 px-2 py-1.5">
            <h2 className="font-body text-caption font-medium text-paper">{BELL.panelLabel}</h2>
            {unread > 0 && (
              <button
                type="button"
                onClick={readAll}
                className="min-h-11 rounded-lg px-2 font-body text-caption text-paper/70 underline decoration-paper/40 underline-offset-4 transition-colors duration-200 ease-out hover:text-paper"
              >
                {BELL.markAll}
              </button>
            )}
          </div>

          {failed ? (
            <div className="px-2 pb-3 pt-1">
              <p className="font-body text-caption text-paper/70">{BELL.failed}</p>
              <button
                type="button"
                onClick={reload}
                className="mt-2 inline-flex min-h-11 items-center rounded-xl border border-paper/40 px-4 font-body text-caption font-medium text-paper transition-colors duration-200 ease-out hover:bg-paper/10"
              >
                {BELL.retry}
              </button>
            </div>
          ) : rows.length === 0 ? (
            <div className="px-2 pb-4 pt-2">
              <p className="font-body text-ui font-medium text-paper">{BELL.empty}</p>
              <p className="mt-1 font-body text-caption text-paper/70">{BELL.emptyBody}</p>
            </div>
          ) : (
            <ul className="flex flex-col">
              {rows.map((notification) => (
                <li key={notification.id}>
                  <NotificationRow
                    notification={notification}
                    tone="dark"
                    onOpen={() => {
                      if (!notification.read) readOne(notification.id)
                      close({ restoreFocus: false })
                    }}
                  />
                </li>
              ))}
            </ul>
          )}

          <div className="border-t border-paper/12 px-2 pt-2">
            <Link
              to="/portal/notifications"
              onClick={() => close({ restoreFocus: false })}
              className="flex min-h-11 items-center rounded-xl px-3 font-body text-caption font-medium text-paper transition-colors duration-200 ease-out hover:bg-paper/10"
            >
              {BELL.seeAll}
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
