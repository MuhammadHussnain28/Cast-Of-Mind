import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Text } from '../../components/ui'
import DataTable from '../../components/admin/DataTable'
import { CoupleIcon } from '../../components/admin/clients/ClientIcons'
import { fetchClients } from '../../lib/api/adminClientsApi'
import { toApiError } from '../../lib/api/ApiError'
import { formatDate } from '../../lib/dateFormat'
import { LIST } from '../../data/adminClientContent'
import { STATUS_FILTERS, subscriptionState } from '../../data/subscriptionStates'
import { cx } from '../../lib/cx'

const PAGE_SIZE = 20

/**
 * Everyone who has paid — master spec §9.4.
 *
 * OPENS ON ALL, not on Active, which is the opposite of the therapist list.
 * The therapist list is a roster and the working set is the point; this one is
 * almost always reached with a person in mind — the client who has just phoned
 * about a refund — and that person is precisely the one a default Active filter
 * would hide. The counts sit in the control, so the shape of the business is
 * still readable without choosing a filter.
 *
 * The same segmented control, table and spacing rhythm as the other two admin
 * lists, so moving between them never feels like moving between products.
 */
export default function Clients() {
  const [status, setStatus] = useState('all')
  const [tableQuery, setTableQuery] = useState({ page: 1, query: '' })
  const [reloadToken, setReloadToken] = useState(0)
  const [result, setResult] = useState(null)

  const handleQueryChange = useCallback(({ page, query }) => {
    setTableQuery({ page, query })
  }, [])

  const { page, query } = tableQuery
  const requestKey = `${status}|${query}|${page}|${reloadToken}`
  const loading = result?.key !== requestKey
  const error = result?.key === requestKey ? result.error : null

  useEffect(() => {
    let cancelled = false

    fetchClients({ status, q: query, page, limit: PAGE_SIZE })
      .then((data) => {
        if (!cancelled) setResult({ key: requestKey, data, error: null })
      })
      .catch((err) => {
        if (!cancelled) setResult({ key: requestKey, data: null, error: toApiError(err).message })
      })

    return () => {
      cancelled = true
    }
  }, [requestKey, status, query, page])

  const counts = result?.data?.meta.counts ?? null
  const total = result?.data?.meta.total ?? 0

  const columns = [
    {
      key: 'displayName',
      header: 'Client',
      priority: 'primary',
      render: (row) => (
        <span className="inline-flex items-center gap-2">
          {/* The icon is aria-hidden, so the word carries it for a screen
              reader — a marker nobody can hear is only half a marker. */}
          {row.type === 'couple' && (
            <>
              <CoupleIcon className="size-4 shrink-0 text-ink/70" />
              <span className="sr-only">Couple: </span>
            </>
          )}
          <Link
            to={`/admin/clients/${row._id}`}
            className="font-medium text-ink underline decoration-ink/60 underline-offset-4 transition-colors duration-200 ease-out hover:decoration-ink"
          >
            {row.displayName ?? 'Unnamed account'}
          </Link>
        </span>
      ),
    },
    { key: 'email', header: 'Email' },
    {
      key: 'therapist',
      header: 'Therapist',
      render: (row) => row.therapist?.name ?? '—',
    },
    {
      key: 'subscriptionStatus',
      header: 'Subscription',
      render: (row) => {
        const state = subscriptionState(row.subscriptionStatus)
        return <Badge tone={state.tone}>{state.label}</Badge>
      },
    },
    {
      key: 'nextBillingDate',
      header: 'Next payment',
      render: (row) => {
        if (row.subscriptionStatus === 'active' || row.subscriptionStatus === 'past_due') {
          return row.nextBillingDate ? formatDate(row.nextBillingDate) : '—'
        }
        if (row.subscriptionStatus === 'cancelled' && row.currentPeriodEnd) {
          return (
            <span className="text-ink/70">Ends {formatDate(row.currentPeriodEnd)}</span>
          )
        }
        return <span className="text-ink/70">—</span>
      },
    },
    {
      key: 'createdAt',
      header: 'Client since',
      render: (row) => formatDate(row.createdAt),
    },
  ]

  const filters = STATUS_FILTERS.filter(
    (filter) => !filter.onlyWhenPresent || (counts?.[filter.key] ?? 0) > 0,
  )

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <div
          className="flex flex-wrap gap-1 self-start rounded-full border border-ink/12 bg-mist p-1"
          role="group"
          aria-label="Filter by subscription status"
        >
          {filters.map((filter) => {
            const isActive = filter.key === status
            const count = filter.key === 'all' ? total : counts?.[filter.key]
            // Clay on a live count only. A permanent red zero would read as an
            // alarm about nothing, which is the shape a dark pattern takes.
            const alarming = filter.key === 'past_due' && (counts?.past_due ?? 0) > 0

            return (
              <button
                key={filter.key}
                type="button"
                aria-pressed={isActive}
                onClick={() => {
                  setStatus(filter.key)
                  setTableQuery((q) => ({ ...q, page: 1 }))
                }}
                className={cx(
                  'inline-flex min-h-11 items-center gap-2 rounded-full px-4',
                  'font-body text-caption font-medium transition-colors duration-200 ease-out',
                  isActive ? 'bg-ink text-paper' : 'text-ink hover:bg-paper',
                )}
              >
                {alarming && !isActive && (
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-clay" />
                )}
                {filter.label}
                {count !== undefined && count !== null && (
                  <span className={cx('tabular-nums', isActive ? 'text-paper/75' : 'text-ink/70')}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <Text size="caption" tone="muted">
          {LIST.note}
        </Text>
      </div>

      <DataTable
        caption="Clients"
        columns={columns}
        rows={result?.data?.data ?? []}
        getRowKey={(row) => row._id}
        mode="server"
        total={total}
        pageSize={PAGE_SIZE}
        loading={loading}
        error={error}
        onRetry={() => setReloadToken((n) => n + 1)}
        onQueryChange={handleQueryChange}
        resetKey={status}
        searchLabel={LIST.searchLabel}
        searchPlaceholder={LIST.searchPlaceholder}
        emptyTitle={status === 'all' ? LIST.emptyTitle : 'Nothing in this state'}
        emptyBody={status === 'all' ? LIST.emptyBody : LIST.filteredEmptyBody}
      />
    </div>
  )
}
