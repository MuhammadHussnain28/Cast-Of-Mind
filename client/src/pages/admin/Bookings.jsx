import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Text } from '../../components/ui'
import DataTable from '../../components/admin/DataTable'
import StatusLedger from '../../components/admin/bookings/StatusLedger'
import { OpenRowIcon } from '../../components/admin/AdminIcons'
import { CoupleIcon } from '../../components/admin/clients/ClientIcons'
import { fetchBookings } from '../../lib/api/adminBookingsApi'
import { toApiError } from '../../lib/api/ApiError'
import { formatDate } from '../../lib/dateFormat'
import { subscriptionState } from '../../data/subscriptionStates'
import { COLUMNS, MARKERS, TABLE } from '../../data/adminBookingContent'
import { cx } from '../../lib/cx'

const PAGE_SIZE = 25

// What the server applies when no sort is sent. Handed to the table as its
// starting state, so the header marks the order the rows are genuinely in.
const INITIAL_SORT = { key: 'pairedSince', direction: 'descending' }

const LIVE = new Set(['active', 'past_due'])

const linkClass =
  'font-medium text-ink underline decoration-ink/60 underline-offset-4 transition-colors duration-200 ease-out hover:decoration-ink'

/** A flag on a row, in words — never a coloured dot alone. */
function Marker({ children }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-body text-caption text-clay">
      <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-clay" />
      {children}
    </span>
  )
}

/**
 * Who is paired with whom, right now — master spec §9.5.
 *
 * AN OPERATOR'S SWITCHBOARD, NOT A REPORT. It opens on the ledger — the mix of
 * every pairing, and the control that filters it — then the table, where any
 * row opens that client's screen and every action on the pairing sits there.
 * Nothing on this page duplicates the dashboard: no money, no month comparison,
 * no trend.
 *
 * The flags are the point of reading it: a therapist who has been deactivated
 * while a client is still paying for them, a client who cannot sign in. Both are
 * said in words on the row, not left to a colour.
 */
export default function Bookings() {
  const [status, setStatus] = useState('all')
  const [tableQuery, setTableQuery] = useState({ page: 1, query: '', sort: INITIAL_SORT })
  const [reloadToken, setReloadToken] = useState(0)
  const [result, setResult] = useState(null)

  const handleQueryChange = useCallback(({ page, query, sort }) => {
    setTableQuery({ page, query, sort })
  }, [])

  const { page, query, sort } = tableQuery
  const sortKey = sort?.key
  const direction = sort ? (sort.direction === 'ascending' ? 'asc' : 'desc') : undefined
  const requestKey = `${status}|${query}|${page}|${sortKey}|${direction}|${reloadToken}`
  const loading = result?.key !== requestKey
  const error = result?.key === requestKey ? result.error : null

  useEffect(() => {
    let cancelled = false

    fetchBookings({ status, q: query, page, limit: PAGE_SIZE, sort: sortKey, direction })
      .then((data) => {
        if (!cancelled) setResult({ key: requestKey, data, error: null })
      })
      .catch((err) => {
        if (!cancelled) setResult({ key: requestKey, data: null, error: toApiError(err).message })
      })

    return () => {
      cancelled = true
    }
  }, [requestKey, status, query, page, sortKey, direction])

  const counts = result?.data?.meta.counts ?? null
  const total = result?.data?.meta.total ?? 0

  const columns = [
    {
      key: 'client',
      header: COLUMNS.client,
      priority: 'primary',
      sortable: true,
      render: (row) =>
        row.client ? (
          <span className="flex min-w-0 flex-col gap-1">
            <span className="inline-flex items-center gap-2">
              {/* The icon is aria-hidden, so the word carries it for a screen
                  reader — a marker nobody can hear is only half a marker. */}
              {row.client.type === 'couple' && (
                <>
                  <CoupleIcon className="size-4 shrink-0 text-ink/70" />
                  <span className="sr-only">Couple: </span>
                </>
              )}
              <Link to={`/admin/clients/${row.client.id}`} className={linkClass}>
                {row.client.displayName ?? 'Unnamed account'}
              </Link>
            </span>
            {row.client.accountStatus === 'inactive' && <Marker>{MARKERS.deactivated}</Marker>}
            {row.bookingStatus === 'ended' && (
              <span className="font-body text-caption text-ink/70">{MARKERS.pairingEnded}</span>
            )}
          </span>
        ) : (
          '—'
        ),
    },
    {
      key: 'therapist',
      header: COLUMNS.therapist,
      sortable: true,
      render: (row) =>
        row.therapist ? (
          <span className="flex min-w-0 flex-col gap-1">
            <Link to={`/admin/therapists/${row.therapist.id}`} className={linkClass}>
              {row.therapist.name}
            </Link>
            {row.therapist.status === 'inactive' && (
              <Marker>{MARKERS.therapistDeactivated}</Marker>
            )}
          </span>
        ) : (
          <Marker>{MARKERS.noTherapist}</Marker>
        ),
    },
    {
      key: 'status',
      header: COLUMNS.status,
      sortable: true,
      render: (row) => {
        const state = subscriptionState(row.subscriptionStatus)
        return <Badge tone={state.tone}>{state.label}</Badge>
      },
    },
    {
      key: 'pairedSince',
      header: COLUMNS.pairedSince,
      sortable: true,
      render: (row) => <span className="tabular-nums">{formatDate(row.pairedSince)}</span>,
    },
    {
      key: 'nextPayment',
      header: COLUMNS.nextPayment,
      sortable: true,
      render: (row) => {
        let value
        if (LIVE.has(row.subscriptionStatus) && row.nextPayment) {
          value = <span className="tabular-nums">{formatDate(row.nextPayment)}</span>
        } else if (row.subscriptionStatus === 'cancelled' && row.currentPeriodEnd) {
          value = (
            <span className="text-ink/70">
              {MARKERS.accessEnds(formatDate(row.currentPeriodEnd))}
            </span>
          )
        } else {
          value = <span className="text-ink/70">—</span>
        }

        return (
          <span className="flex items-center justify-between gap-4">
            {value}
            {/* Says the row goes somewhere. Nudges on hover and holds still
                under reduced motion — a state cue, not decoration. */}
            <OpenRowIcon
              className={cx(
                'hidden size-4 shrink-0 text-ink/50 md:block',
                'transition-transform duration-200 ease-out motion-safe:group-hover:translate-x-0.5',
              )}
            />
          </span>
        )
      },
    },
  ]

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <StatusLedger
          counts={counts}
          status={status}
          searching={query.length > 0}
          onSelect={(key) => {
            setStatus(key)
            setTableQuery((q) => ({ ...q, page: 1 }))
          }}
        />

        <Text size="caption" tone="muted">
          {TABLE.note}
        </Text>
      </div>

      <DataTable
        caption={TABLE.caption}
        columns={columns}
        rows={result?.data?.data ?? []}
        getRowKey={(row) => row._id}
        rowHref={(row) => (row.client ? `/admin/clients/${row.client.id}` : null)}
        initialSort={INITIAL_SORT}
        mode="server"
        total={total}
        pageSize={PAGE_SIZE}
        loading={loading}
        error={error}
        onRetry={() => setReloadToken((n) => n + 1)}
        onQueryChange={handleQueryChange}
        resetKey={status}
        searchLabel={TABLE.searchLabel}
        searchPlaceholder={TABLE.searchPlaceholder}
        emptyTitle={status === 'all' ? TABLE.emptyTitle : TABLE.filteredEmptyTitle}
        emptyBody={status === 'all' ? TABLE.emptyBody : TABLE.filteredEmptyBody}
      />
    </div>
  )
}
