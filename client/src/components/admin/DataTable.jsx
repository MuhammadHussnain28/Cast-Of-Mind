import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Input, Text } from '../ui'
import { cx } from '../../lib/cx'
import { SortArrowIcon, SortableIcon } from './AdminIcons'

/**
 * The admin portal's one table.
 *
 * Client mode filters, sorts and pages in memory — right for a list that
 * arrives whole. Server mode does none of that and reports every change through
 * `onQueryChange` instead, because the backend rules require every list
 * endpoint to paginate and a few hundred therapists should not travel to the
 * browser to be sliced there. Chunk 4.2 switches by passing mode="server".
 *
 * Columns:
 *   key        field name, or any unique id when `render` is used
 *   header     column heading
 *   sortable   adds the sort control
 *   sortValue  (row) => comparable value; defaults to row[key]
 *   searchable (row) => string to match; defaults to row[key]
 *   render     (row) => node
 *   align      'start' | 'end'
 *   priority   'primary' shows as the card title below md
 */

const DEBOUNCE_MS = 250

function defaultCell(row, column) {
  const value = row[column.key]
  return value === null || value === undefined || value === '' ? '—' : String(value)
}

function compare(a, b) {
  if (a === b) return 0
  if (a === null || a === undefined) return 1
  if (b === null || b === undefined) return -1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b), undefined, { numeric: true })
}

function SkeletonRows({ columns, rows }) {
  return Array.from({ length: rows }, (_, rowIndex) => (
    <tr key={rowIndex} className="border-t border-ink/12">
      {columns.map((column) => (
        <td key={column.key} className="px-4 py-3.5">
          <span
            className="block h-3 rounded-full bg-ink/10 motion-safe:animate-pulse"
            // Uneven widths so it reads as content arriving, not as a bar chart.
            style={{ width: `${55 + ((rowIndex + column.key.length) % 4) * 10}%` }}
          />
        </td>
      ))}
    </tr>
  ))
}

export default function DataTable({
  columns,
  rows = [],
  getRowKey = (row, index) => row.id ?? index,
  caption,
  mode = 'client',
  total,
  loading = false,
  error = null,
  onRetry,
  onQueryChange,
  resetKey,
  searchLabel = 'Search',
  searchPlaceholder = 'Search',
  searchable = true,
  pageSize = 10,
  emptyTitle = 'Nothing here yet',
  emptyBody,
  actions,
}) {
  const isServer = mode === 'server'

  const [searchInput, setSearchInput] = useState('')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState(null)
  const [page, setPage] = useState(1)

  // Held in a ref so a parent passing an inline arrow does not re-fire the
  // reporting effect on every one of its own renders — the same reason
  // useIdleTimer keeps onTimeout in one.
  const onQueryChangeRef = useRef(onQueryChange)
  useEffect(() => {
    onQueryChangeRef.current = onQueryChange
  }, [onQueryChange])

  // A filter owned by the parent (a status chip, say) has to send the table
  // back to page 1 — page 4 of the previous filter is usually an empty screen.
  // Adjusting state during render is React's documented pattern for reacting to
  // a changed prop; an effect here would re-render twice and flash the old page.
  const [previousResetKey, setPreviousResetKey] = useState(resetKey)
  if (resetKey !== previousResetKey) {
    setPreviousResetKey(resetKey)
    setPage(1)
  }

  // One debounce for both modes: in server mode it stops a request per
  // keystroke, in client mode it stops a long list re-filtering per keystroke.
  //
  // The page reset rides along with it rather than living in its own effect on
  // [query]. Both changes belong to the same event, and doing it here keeps the
  // effect body free of synchronous setState — the state changes happen in the
  // timeout callback, which is what the React Compiler rule is asking for.
  // A new search must start at page 1: staying on page 4 of a two-page result
  // is an empty screen that looks like a bug.
  useEffect(() => {
    const id = window.setTimeout(() => {
      setQuery(searchInput.trim())
      setPage(1)
    }, DEBOUNCE_MS)

    return () => window.clearTimeout(id)
  }, [searchInput])

  useEffect(() => {
    if (!isServer) return
    onQueryChangeRef.current?.({ page, query, sort })
  }, [isServer, page, query, sort])

  const filtered = useMemo(() => {
    if (isServer || !query) return rows
    const needle = query.toLowerCase()

    return rows.filter((row) =>
      columns.some((column) => {
        if (column.searchable === false) return false
        const value = column.searchable ? column.searchable(row) : row[column.key]
        return value != null && String(value).toLowerCase().includes(needle)
      }),
    )
  }, [columns, isServer, query, rows])

  const sorted = useMemo(() => {
    if (isServer || !sort) return filtered
    const column = columns.find((c) => c.key === sort.key)
    if (!column) return filtered

    const read = column.sortValue ?? ((row) => row[column.key])
    const factor = sort.direction === 'descending' ? -1 : 1

    return [...filtered].sort((a, b) => compare(read(a), read(b)) * factor)
  }, [columns, filtered, isServer, sort])

  const resultCount = isServer ? (total ?? rows.length) : sorted.length
  const pageCount = Math.max(1, Math.ceil(resultCount / pageSize))
  const currentPage = Math.min(page, pageCount)
  const pageRows = isServer
    ? rows
    : sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const firstShown = resultCount === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const lastShown = Math.min(currentPage * pageSize, resultCount)

  const hasRows = pageRows.length > 0
  // Skeletons belong to the FIRST load only. On a refetch the previous rows are
  // held at reduced opacity instead: flashing skeletons over data that is
  // already correct makes the layout jump and reads as a failure.
  const showSkeleton = loading && !hasRows
  const refreshing = loading && hasRows
  const isSearching = query.length > 0
  const primaryColumn = columns.find((column) => column.priority === 'primary') ?? columns[0]

  function toggleSort(column) {
    setSort((previous) => {
      if (previous?.key !== column.key) return { key: column.key, direction: 'ascending' }
      if (previous.direction === 'ascending') return { key: column.key, direction: 'descending' }
      // Third press clears it, so the original order is reachable again.
      return null
    })
    setPage(1)
  }

  return (
    <section className="flex flex-col gap-4">
      {(searchable || actions) && (
        <div className="flex flex-wrap items-end justify-between gap-3">
          {searchable && (
            <Input
              label={searchLabel}
              hideLabel
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={searchPlaceholder}
              className="w-full sm:max-w-xs"
            />
          )}
          {actions}
        </div>
      )}

      {/* Announced once the count settles, so a search reports its result to a
          screen reader instead of changing silently. */}
      <p role="status" aria-live="polite" className="sr-only">
        {loading
          ? 'Loading results'
          : `${resultCount} ${resultCount === 1 ? 'result' : 'results'}`}
      </p>

      {error ? (
        <div className="rounded-2xl border border-clay/40 bg-clay/5 px-5 py-6">
          <Text tone="error" size="ui">
            {error}
          </Text>
          {onRetry && (
            <Button variant="secondary" size="sm" onClick={onRetry} className="mt-4">
              Try again
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Table from md up. Exactly one of the two layouts is in the DOM, so
              nothing is announced twice. */}
          <div className="hidden overflow-x-auto rounded-2xl border border-ink/12 md:block">
            <table
              className={cx(
                'w-full border-collapse text-left transition-opacity duration-200 ease-out',
                refreshing && 'opacity-60',
              )}
              aria-busy={loading || undefined}
            >
              <caption className="sr-only">{caption}</caption>
              <thead className="bg-mist">
                <tr>
                  {columns.map((column) => {
                    const active = sort?.key === column.key
                    const ariaSort = active ? sort.direction : 'none'

                    return (
                      <th
                        key={column.key}
                        scope="col"
                        aria-sort={column.sortable ? ariaSort : undefined}
                        className={cx(
                          'px-4 py-3 font-body text-caption font-medium text-ink',
                          column.align === 'end' && 'text-right',
                        )}
                      >
                        {column.sortable ? (
                          <button
                            type="button"
                            onClick={() => toggleSort(column)}
                            className={cx(
                              'inline-flex min-h-11 items-center gap-1.5 rounded-lg py-1 font-medium',
                              'transition-colors duration-200 ease-out hover:text-ink-deep',
                              column.align === 'end' && 'flex-row-reverse',
                            )}
                          >
                            <span>{column.header}</span>
                            {active ? (
                              <SortArrowIcon
                                className={cx(
                                  'shrink-0 text-ink',
                                  sort.direction === 'ascending' && 'rotate-180',
                                )}
                              />
                            ) : (
                              <SortableIcon className="shrink-0 text-ink/60" />
                            )}
                            <span className="sr-only">
                              {active
                                ? `sorted ${sort.direction}, activate to ${
                                    sort.direction === 'ascending'
                                      ? 'sort descending'
                                      : 'clear sorting'
                                  }`
                                : 'activate to sort ascending'}
                            </span>
                          </button>
                        ) : (
                          column.header
                        )}
                      </th>
                    )
                  })}
                </tr>
              </thead>

              <tbody>
                {showSkeleton ? (
                  <SkeletonRows columns={columns} rows={Math.min(pageSize, 6)} />
                ) : hasRows ? (
                  pageRows.map((row, index) => (
                    <tr
                      key={getRowKey(row, index)}
                      className="border-t border-ink/12 transition-colors duration-200 ease-out hover:bg-mist"
                    >
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className={cx(
                            'px-4 py-3.5 font-body text-ui text-ink',
                            column.align === 'end' && 'text-right tabular-nums',
                          )}
                        >
                          {column.render ? column.render(row) : defaultCell(row, column)}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr className="border-t border-ink/12">
                    <td colSpan={columns.length} className="px-4 py-12 text-center">
                      <EmptyBody
                        isSearching={isSearching}
                        query={query}
                        title={emptyTitle}
                        body={emptyBody}
                        onClear={() => setSearchInput('')}
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Cards below md — a table cannot reflow to 360px without losing the
              row and column relationships that are the reason to use one. */}
          <div
            className={cx(
              'flex flex-col gap-3 transition-opacity duration-200 ease-out md:hidden',
              refreshing && 'opacity-60',
            )}
          >
            {showSkeleton ? (
              Array.from({ length: 3 }, (_, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-ink/12 px-4 py-4"
                  aria-hidden="true"
                >
                  <span className="block h-3 w-2/5 rounded-full bg-ink/10 motion-safe:animate-pulse" />
                  <span className="mt-3 block h-3 w-4/5 rounded-full bg-ink/10 motion-safe:animate-pulse" />
                </div>
              ))
            ) : hasRows ? (
              pageRows.map((row, index) => (
                <article
                  key={getRowKey(row, index)}
                  className="rounded-2xl border border-ink/12 px-4 py-4"
                >
                  <h3 className="font-body text-ui font-medium text-ink">
                    {primaryColumn.render
                      ? primaryColumn.render(row)
                      : defaultCell(row, primaryColumn)}
                  </h3>
                  <dl className="mt-3 flex flex-col gap-2">
                    {columns
                      .filter((column) => column.key !== primaryColumn.key)
                      .map((column) => (
                        <div key={column.key} className="flex justify-between gap-4">
                          <dt className="font-body text-caption text-ink/70">
                            {column.header}
                          </dt>
                          <dd className="text-right font-body text-caption text-ink">
                            {column.render ? column.render(row) : defaultCell(row, column)}
                          </dd>
                        </div>
                      ))}
                  </dl>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-ink/12 px-4 py-10 text-center">
                <EmptyBody
                  isSearching={isSearching}
                  query={query}
                  title={emptyTitle}
                  body={emptyBody}
                  onClear={() => setSearchInput('')}
                />
              </div>
            )}
          </div>

          {!showSkeleton && resultCount > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Text size="caption" tone="muted" className="tabular-nums">
                Showing {firstShown}–{lastShown} of {resultCount}
              </Text>

              {pageCount > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Text size="caption" tone="muted" className="tabular-nums">
                    Page {currentPage} of {pageCount}
                  </Text>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={currentPage >= pageCount}
                    onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  )
}

/**
 * Two different states, deliberately not merged. "No results for that search"
 * needs a way to clear the search; "nothing here yet" needs to explain what
 * will appear and when. Showing the first when the truth is the second reads
 * as a broken filter.
 */
function EmptyBody({ isSearching, query, title, body, onClear }) {
  if (isSearching) {
    return (
      <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
        <Text size="ui">No results for “{query}”.</Text>
        <Button variant="ghost" size="sm" onClick={onClear}>
          Clear search
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-2">
      <Text size="ui">{title}</Text>
      {body && (
        <Text size="caption" tone="muted">
          {body}
        </Text>
      )}
    </div>
  )
}
