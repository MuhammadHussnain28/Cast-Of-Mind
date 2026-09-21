import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Text } from '../../components/ui'
import DataTable from '../../components/admin/DataTable'
import StatusBadge from '../../components/admin/applications/StatusBadge'
import { fetchApplications } from '../../lib/api/adminApplicationsApi'
import { toApiError } from '../../lib/api/ApiError'
import { formatDate } from '../../lib/dateFormat'
import { cx } from '../../lib/cx'

const PAGE_SIZE = 20

const FILTERS = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'all', label: 'All' },
]

/**
 * The applications review list — master spec §9.2.
 *
 * Opens on Pending, because that is the only status carrying work. The counts
 * come back with the results, so the badge and the chips cost no extra request.
 */
export default function Applications() {
  const [status, setStatus] = useState('pending')
  const [tableQuery, setTableQuery] = useState({ page: 1, query: '' })
  const [reloadToken, setReloadToken] = useState(0)
  const [result, setResult] = useState(null)

  // Memoised, or DataTable's effect would re-fire on every render of this page.
  const handleQueryChange = useCallback(({ page, query }) => {
    setTableQuery({ page, query })
  }, [])

  const { page, query } = tableQuery

  // One key describing the request currently wanted. `loading` is DERIVED from
  // whether the stored result matches it, rather than being switched on inside
  // the effect — a synchronous setState there costs an extra render pass and is
  // what the React Compiler rule objects to. Same root fix as useApi in 0.6.
  const requestKey = `${status}|${query}|${page}|${reloadToken}`
  const loading = result?.key !== requestKey
  const error = result?.key === requestKey ? result.error : null

  useEffect(() => {
    let cancelled = false

    fetchApplications({ status, q: query, page, limit: PAGE_SIZE })
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

  // Kept from the last successful load, so the chips and the badge do not blink
  // empty every time a page or a filter changes.
  const counts = result?.data?.meta.counts ?? null

  const columns = [
    {
      key: 'name',
      header: 'Applicant',
      priority: 'primary',
      render: (row) => (
        <Link
          to={`/admin/applications/${row._id}`}
          className="font-medium text-ink underline decoration-ink/60 underline-offset-4 transition-colors duration-200 ease-out hover:decoration-ink"
        >
          {row.title} {row.firstName} {row.lastName}
        </Link>
      ),
    },
    { key: 'email', header: 'Email' },
    { key: 'therapistType', header: 'Type' },
    { key: 'country', header: 'Country' },
    {
      key: 'submittedAt',
      header: 'Submitted',
      render: (row) => formatDate(row.submittedAt),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ]

  return (
    <div className="flex flex-col gap-8">
      {/* Filter and summary belong together, so they sit tight; the table gets
          generous separation below. Even spacing everywhere reads as
          unconsidered rather than calm. */}
      <div className="flex flex-col gap-3">
        <div
          className="flex flex-wrap gap-1 self-start rounded-full border border-ink/12 bg-mist p-1"
          role="group"
          aria-label="Filter by status"
        >
          {FILTERS.map((filter) => {
            const active = filter.key === status
            const count = counts?.[filter.key]

            return (
              <button
                key={filter.key}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  // The table resets its own page via resetKey, but it reports
                  // that back a render later. Resetting here too keeps both in
                  // step, so changing filter while on page 3 does not fire a
                  // throwaway request for page 3 of the new filter first.
                  setStatus(filter.key)
                  setTableQuery((q) => ({ ...q, page: 1 }))
                }}
                // A segmented control rather than four outlined pills: only the
                // selected segment carries weight, and an unselected one is
                // identified by its own label — which needs no border, because
                // WCAG 1.4.11 does not apply to text.
                className={cx(
                  'inline-flex min-h-11 items-center gap-2 rounded-full px-4',
                  'font-body text-caption font-medium transition-colors duration-200 ease-out',
                  active ? 'bg-ink text-paper' : 'text-ink hover:bg-paper',
                )}
              >
                {filter.label}
                {count !== undefined && (
                  <span className={cx('tabular-nums', active ? 'text-paper/75' : 'text-ink/70')}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {counts?.pending > 0 && (
          <Text size="ui">
            {counts.pending} {counts.pending === 1 ? 'application is' : 'applications are'}{' '}
            waiting for review.
          </Text>
        )}
      </div>

      <DataTable
        caption="Therapist applications"
        columns={columns}
        rows={result?.data?.data ?? []}
        getRowKey={(row) => row._id}
        mode="server"
        total={result?.data?.meta.total ?? 0}
        pageSize={PAGE_SIZE}
        loading={loading}
        error={error}
        onRetry={() => setReloadToken((n) => n + 1)}
        onQueryChange={handleQueryChange}
        resetKey={status}
        searchLabel="Search applications by name or email"
        searchPlaceholder="Search by name or email"
        emptyTitle={
          status === 'all'
            ? 'No applications yet'
            : `No ${status} applications`
        }
        emptyBody="Applications appear here when a therapist submits the form on the Join as a therapist page. It is the only way therapists enter the platform."
      />
    </div>
  )
}
