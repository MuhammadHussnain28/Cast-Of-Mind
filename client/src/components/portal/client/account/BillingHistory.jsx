import { useEffect, useState } from 'react'
import { cx } from '../../../../lib/cx'
import { formatMoney } from '../../../../lib/dashboardFormat'
import { isoOf } from '../../../../lib/client/accessDates'
import { fetchBillingHistory } from '../../../../lib/api/clientPortalApi'
import { ACCOUNT } from '../../../../data/clientPortalContent'
import { ReceiptIcon, TickIcon } from '../ClientPortalIcons'

/**
 * Billing history (11.5): a ledger of the client's own payments, one row per
 * invoice. A payment that took a retry reads as one paid month. Status is a
 * drawn mark AND a word — never colour alone.
 */

const COPY = ACCOUNT.history
const shortDate = (value) =>
  new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value))
const dayMonth = (value) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(new Date(value))

function Mark({ paid }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        'relative z-10 grid size-9 shrink-0 place-items-center rounded-full ring-4 ring-paper',
        paid ? 'bg-sage/15 text-sage-deep' : 'bg-clay/10 text-clay',
      )}
    >
      {paid ? <TickIcon size={16} /> : <span className="size-3 rounded-full border-2 border-current" />}
    </span>
  )
}

function Row({ row }) {
  const paid = row.status === 'paid'
  const period = row.periodStart && row.periodEnd ? `${dayMonth(row.periodStart)} – ${dayMonth(row.periodEnd)}` : null
  return (
    <li className="relative flex items-start gap-4 py-3.5">
      <Mark paid={paid} />
      <div className="min-w-0 flex-1">
        <p className="font-body text-ui font-medium text-ink-deep">
          <time dateTime={isoOf(row.date)}>{shortDate(row.date)}</time>
        </p>
        <p className="font-body text-caption text-ink/70">
          {COPY.item}
          {period ? ` · ${period}` : ''}
        </p>
        <p className={cx('mt-0.5 font-body text-caption font-medium', paid ? 'text-sage-deep' : 'text-clay')}>
          {paid ? (row.retried ? COPY.retried : COPY.paid) : COPY.failed}
        </p>
      </div>
      <p className="shrink-0 pt-0.5 font-body text-ui font-medium tabular-nums text-ink-deep">
        {row.amount != null ? formatMoney(row.amount, row.currency ?? 'EUR') : ''}
      </p>
    </li>
  )
}

function Skeleton() {
  return (
    <div role="status" aria-label={COPY.loading} className="py-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-4 py-3.5">
          <span className="size-9 rounded-full bg-ink/8 motion-safe:animate-pulse" />
          <span className="h-3.5 flex-1 rounded-full bg-ink/8 motion-safe:animate-pulse" />
          <span className="h-3.5 w-14 rounded-full bg-ink/8 motion-safe:animate-pulse" />
        </div>
      ))}
    </div>
  )
}

export default function BillingHistory() {
  const [rows, setRows] = useState([])
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [attempt, setAttempt] = useState(0)

  // One page at a time, appended. State changes only once the request settles.
  useEffect(() => {
    let cancelled = false
    fetchBillingHistory(page)
      .then((result) => {
        if (cancelled) return
        setRows((current) => (page === 1 ? result.data : [...current, ...result.data]))
        setMeta(result.meta)
        setError(null)
        setLoading(false)
      })
      .catch((failure) => {
        if (cancelled) return
        setError(failure)
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [page, attempt])

  function more() {
    setLoading(true)
    setPage((n) => n + 1)
  }

  function retry() {
    setLoading(true)
    setError(null)
    setAttempt((n) => n + 1)
  }

  return (
    <section
      aria-labelledby="billing-history-heading"
      className="rounded-2xl bg-paper px-5 py-6 shadow-[0_12px_32px_-20px_rgb(25_18_43/0.35)] sm:px-7"
    >
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-sage/15 text-sage-deep">
          <ReceiptIcon size={20} />
        </span>
        <h2 id="billing-history-heading" className="font-body text-ui font-medium text-ink-deep">
          {COPY.heading}
        </h2>
      </div>

      {rows.length > 0 && (
        // The ledger's spine: a hairline the marks sit on, drawn behind them.
        <ol className="relative mt-3">
          <span aria-hidden="true" className="absolute top-6 bottom-6 left-[1.125rem] w-px bg-ink/12" />
          {rows.map((row) => (
            <Row key={row.id} row={row} />
          ))}
        </ol>
      )}

      {loading && <Skeleton />}

      {!loading && error && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <p role="alert" className="font-body text-caption text-clay">
            {COPY.failedToLoad}
          </p>
          <button
            type="button"
            onClick={retry}
            className="inline-flex min-h-11 items-center rounded-full border border-ink/50 px-5 font-body text-caption font-medium text-ink hover:bg-mist focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            {COPY.retry}
          </button>
        </div>
      )}

      {!loading && !error && rows.length === 0 && (
        <p className="mt-5 flex items-center gap-3 rounded-xl bg-mist px-4 py-4 font-body text-ui text-ink/70">
          <ReceiptIcon size={18} className="shrink-0 text-sage-deep" />
          {COPY.empty}
        </p>
      )}

      {!loading && meta?.hasMore && (
        <button
          type="button"
          onClick={more}
          className="mt-3 inline-flex min-h-11 items-center rounded-full border border-ink/50 px-5 font-body text-caption font-medium text-ink transition-colors duration-200 hover:bg-mist focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          {COPY.more}
        </button>
      )}
    </section>
  )
}
