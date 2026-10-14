import { useCallback, useEffect, useState } from 'react'
import { Button, Text } from '../../../components/ui'
import NotificationRow from '../../../components/portal/therapist/notifications/NotificationRow'
import { BellIcon } from '../../../components/portal/therapist/notifications/NotificationIcons'
import { useNotifications } from '../../../lib/notifications/notificationContext'
import { fetchNotifications } from '../../../lib/api/notificationsApi'
import { toApiError } from '../../../lib/api/ApiError'
import { BELL, FEED } from '../../../data/notificationContent'

const PAGE = 20

/** Today / Yesterday / Earlier, in the reader's own clock. */
function groupOf(when) {
  const day = new Date(when)
  const today = new Date()
  const sameDay = (a, b) => a.toDateString() === b.toDateString()

  if (sameDay(day, today)) return FEED.today
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  return sameDay(day, yesterday) ? FEED.yesterday : FEED.earlier
}

/**
 * The whole feed — master spec §8.8.
 *
 * The bell's panel answers "anything else?"; this answers "what have I missed?"
 * — the same rows, grouped by day, paged rather than loaded whole.
 *
 * Reading still happens by opening an alert, never by arriving here: a page
 * view is not the same as having read something.
 */
export default function Notifications() {
  const { readOne, unread, readAll } = useNotifications()
  const [page, setPage] = useState({ rows: [], total: 0, number: 0 })
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const loadPage = useCallback((number) => {
    return fetchNotifications({ page: number, limit: PAGE }).then(({ data, meta }) => {
      setPage((current) => ({
        rows: number === 1 ? data : [...current.rows, ...data],
        total: meta.total,
        number,
      }))
      setError(null)
    })
  }, [])

  useEffect(() => {
    let cancelled = false

    fetchNotifications({ page: 1, limit: PAGE })
      .then(({ data, meta }) => {
        if (!cancelled) setPage({ rows: data, total: meta.total, number: 1 })
      })
      .catch((err) => {
        if (!cancelled) setError(toApiError(err).message || BELL.failed)
      })

    return () => {
      cancelled = true
    }
  }, [])

  async function loadMore() {
    setBusy(true)
    try {
      await loadPage(page.number + 1)
    } catch (err) {
      setError(toApiError(err).message || BELL.failed)
    } finally {
      setBusy(false)
    }
  }

  const loading = page.number === 0 && !error
  const more = page.rows.length < page.total

  // The day heading is DERIVED, by comparing each row with the one before it.
  // A mutable `lastGroup` carried through the map is the React Compiler
  // objection this project fixes at the root rather than silences (0.6, 7.4).
  const grouped = page.rows.map((notification, index) => {
    const group = groupOf(notification.lastAt)
    const previous = index > 0 ? groupOf(page.rows[index - 1].lastAt) : null
    return { notification, heading: group === previous ? null : group }
  })

  return (
    <div className="flex w-full max-w-4xl flex-1 flex-col pt-6 sm:pt-8 lg:pt-10 ">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-body text-subsection  text-ink italic tracking-wide">{FEED.title}</h1>
          <p className="mt-3 max-w-measure font-body text-ui leading-relaxed text-ink/70">
            {FEED.lead}
          </p>
        </div>
        {unread > 0 && (
          <Button variant="secondary" size="sm" onClick={readAll}>
            {BELL.markAll}
          </Button>
        )}
      </header>

      <section className="relative mt-8 overflow-hidden rounded-2xl bg-paper px-3 py-3 shadow-[0_18px_50px_-28px_rgba(25,18,43,0.35)] sm:px-4 sm:py-4">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-16 -top-16 size-56 rounded-full bg-sage/10 blur-[130px]"
        />

        {loading && (
          <>
            <p role="status" className="sr-only">
              Loading notifications
            </p>
            <div className="relative flex flex-col gap-4 p-3" aria-hidden="true">
              {[0, 1, 2].map((n) => (
                <div key={n} className="flex items-center gap-3">
                  <span className="size-9 shrink-0 rounded-xl bg-ink/10 motion-safe:animate-pulse" />
                  <span className="h-3 w-48 rounded-full bg-ink/10 motion-safe:animate-pulse" />
                </div>
              ))}
            </div>
          </>
        )}

        {error && (
          <div className="relative p-3" role="alert">
            <Text size="ui" tone="error">
              {error}
            </Text>
          </div>
        )}

        {!loading && !error && page.rows.length === 0 && (
          <div className="relative px-3 py-8">
            <span
              aria-hidden="true"
              className="inline-flex size-10 items-center justify-center rounded-full bg-sage/15 text-sage-deep"
            >
              <BellIcon className="size-5" />
            </span>
            <h2 className="mt-4 font-body text-ui font-medium text-ink">{FEED.emptyTitle}</h2>
            <Text size="caption" tone="muted" className="mt-2 max-w-measure">
              {FEED.emptyBody}
            </Text>
          </div>
        )}

        {page.rows.length > 0 && (
          <ul className="relative flex flex-col">
            {grouped.map(({ notification, heading }) => (
              <li key={notification.id}>
                {heading && (
                  <h2 className="px-3 pb-1.5 pt-4 font-body text-caption font-medium text-ink/70 first:pt-1">
                    {heading}
                  </h2>
                )}
                <NotificationRow
                  notification={notification}
                  tone="light"
                  onOpen={() => {
                    if (!notification.read) readOne(notification.id)
                  }}
                />
              </li>
            ))}
          </ul>
        )}

        {more && !error && (
          <div className="relative px-3 pb-2 pt-3">
            <Button variant="secondary" loading={busy} onClick={loadMore}>
              {FEED.loadEarlier}
            </Button>
          </div>
        )}
      </section>

      <Text size="caption" tone="muted" className="mt-4 max-w-measure">
        {FEED.note}
      </Text>
    </div>
  )
}
