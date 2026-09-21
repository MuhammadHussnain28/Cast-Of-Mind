import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Text } from '../../components/ui'
import DataTable from '../../components/admin/DataTable'
import { fetchTherapists } from '../../lib/api/adminTherapistsApi'
import { toApiError } from '../../lib/api/ApiError'
import { formatDate } from '../../lib/dateFormat'
import { cx } from '../../lib/cx'

const PAGE_SIZE = 20

const FILTERS = [
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Deactivated' },
  { key: 'all', label: 'All' },
]

/**
 * Everyone onboarded — master spec §9.3.
 *
 * Opens on Active, because that is the working roster. The same segmented
 * control and spacing rhythm as the applications list, so moving between the
 * two admin lists never feels like moving between two products.
 */
export default function Therapists() {
  const [status, setStatus] = useState('active')
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

    fetchTherapists({ status, q: query, page, limit: PAGE_SIZE })
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

  const columns = [
    {
      key: 'name',
      header: 'Therapist',
      priority: 'primary',
      render: (row) => (
        <Link
          to={`/admin/therapists/${row._id}`}
          className="font-medium text-ink underline decoration-ink/60 underline-offset-4 transition-colors duration-200 ease-out hover:decoration-ink"
        >
          {row.title} {row.firstName} {row.lastName}
        </Link>
      ),
    },
    { key: 'therapistType', header: 'Professional title' },
    { key: 'email', header: 'Email' },
    {
      key: 'specialtyTags',
      header: 'Specialties',
      render: (row) => row.specialtyTags.join(' · '),
    },
    { key: 'activeClients', header: 'Clients', align: 'end' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge tone={row.status === 'active' ? 'success' : 'neutral'}>
          {row.status === 'active' ? 'Active' : 'Deactivated'}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Onboarded',
      render: (row) => formatDate(row.createdAt),
    },
  ]

  return (
    <div className="flex flex-col gap-8">
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
                  setStatus(filter.key)
                  setTableQuery((q) => ({ ...q, page: 1 }))
                }}
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

        <Text size="caption" tone="muted">
          Therapists only join by applying — approving an application is the single way in.
        </Text>
      </div>

      <DataTable
        caption="Onboarded therapists"
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
        searchLabel="Search therapists by name or email"
        searchPlaceholder="Search by name or email"
        emptyTitle={
          status === 'inactive' ? 'No deactivated therapists' : 'No therapists yet'
        }
        emptyBody="A therapist appears here once you approve their application."
      />
    </div>
  )
}
