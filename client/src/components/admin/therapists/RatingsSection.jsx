import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Text } from '../../ui'
import { StarRow, StarShape, TrendIcon } from '../../reviews/ReviewMarks'
import { ADMIN_RATINGS } from '../../../data/reviewContent'
import { fetchReviews } from '../../../lib/api/adminReviewsApi'
import { toApiError } from '../../../lib/api/ApiError'
import { formatDate } from '../../../lib/dateFormat'

const PAGE = 10
const STARS_DOWN = [5, 4, 3, 2, 1]

/**
 * One therapist's ratings — §9.6's "in therapist management" half. ADMIN-ONLY.
 *
 * The SHAPE leads, not only the mean: an average of 3.5 is a different story
 * when it is two fives and two twos than when it is four threes and a four.
 * Five bars show it, each with its count written beside it — the bars are
 * aria-hidden and the counts carry the meaning.
 *
 * Every review then follows, newest first, paged rather than loaded whole. A
 * rating without words SAYS so on the row — §9.6's caveat on every entry,
 * rather than a note at the top that the eye skips.
 */
function Distribution({ distribution, total }) {
  return (
    <dl className="flex flex-col gap-2.5">
      {STARS_DOWN.map((star) => {
        const count = distribution?.[star] ?? 0
        const share = total > 0 ? (count / total) * 100 : 0

        return (
          <div key={star} className="grid grid-cols-[4.5rem_1fr_2.5rem] items-center gap-3">
            <dt className="flex items-center gap-1.5 font-body text-caption text-ink/70">
              <StarShape filled className="size-3.5" />
              {ADMIN_RATINGS.distributionLabel(star)}
            </dt>
            {/* Share of all ratings, from a zero baseline. Thin, 4px data end. */}
            <dd aria-hidden="true" className="h-2.5 overflow-hidden rounded-sm bg-mist">
              <span
                className="block h-full rounded-sm bg-sage-deep transition-[width] duration-200 ease-out motion-reduce:transition-none"
                style={{ width: count > 0 ? `max(${share}%, 0.25rem)` : '0%' }}
              />
            </dd>
            <dd className="text-right font-body text-caption font-medium text-ink tabular-nums">
              {count}
            </dd>
          </div>
        )
      })}
    </dl>
  )
}

export default function RatingsSection({ therapist }) {
  const { _id: id, averageRating, reviewCount = 0, writtenCount = 0, distribution } = therapist
  const rated = averageRating !== null && reviewCount > 0

  // Keyed on the therapist, so one person's reviews can never show a frame
  // under another's name (the 8.2 rule). The first page's loading state is
  // DERIVED from "no page for this therapist yet", not stored — setting it
  // from the effect is the React Compiler objection this project fixes at the
  // root rather than silences (0.6, 7.4, 7.6).
  const [pages, setPages] = useState({ key: null, rows: [], total: 0, page: 0 })
  const [failure, setFailure] = useState(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!rated) return undefined
    let cancelled = false

    fetchReviews({ therapistId: id, page: 1, limit: PAGE })
      .then(({ data, meta }) => {
        if (!cancelled) setPages({ key: id, rows: data, total: meta.total, page: 1 })
      })
      .catch((err) => {
        if (!cancelled) {
          setFailure({ key: id, message: toApiError(err).message || ADMIN_RATINGS.loadFailed })
        }
      })

    return () => {
      cancelled = true
    }
  }, [rated, id, attempt])

  const loadMore = useCallback(async () => {
    setLoadingMore(true)
    setFailure(null)
    try {
      const { data, meta } = await fetchReviews({ therapistId: id, page: pages.page + 1, limit: PAGE })
      setPages((current) =>
        current.key === id
          ? { ...current, rows: [...current.rows, ...data], total: meta.total, page: current.page + 1 }
          : current,
      )
    } catch (err) {
      setFailure({ key: id, message: toApiError(err).message || ADMIN_RATINGS.loadFailed })
    } finally {
      setLoadingMore(false)
    }
  }, [id, pages.page])

  const mine = pages.key === id
  const rows = mine ? pages.rows : []
  const failed = failure?.key === id
  const firstLoading = rated && !mine && !failed
  const more = mine && rows.length < pages.total

  function retry() {
    if (mine) {
      loadMore()
    } else {
      setFailure(null)
      setAttempt((n) => n + 1)
    }
  }

  return (
    <section
      aria-labelledby="therapist-ratings"
      className="rounded-2xl border border-ink/12 bg-paper"
    >
      <div className="px-5 pt-5 sm:px-6 sm:pt-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 id="therapist-ratings" className="font-body text-caption font-medium text-ink/70">
            {ADMIN_RATINGS.sectionTitle}
          </h2>
          <Text size="caption" tone="muted">
            {ADMIN_RATINGS.sectionNote}
          </Text>
        </div>
      </div>

      {!rated ? (
        <div className="px-5 pb-6 pt-4 sm:px-6">
          <p className="font-body text-subsection font-medium text-ink/60">{ADMIN_RATINGS.none}</p>
          <Text size="caption" tone="muted" className="mt-2">
            {ADMIN_RATINGS.noneBody}
          </Text>
        </div>
      ) : (
        <>
          <div className="grid gap-6 px-5 pb-6 pt-4 sm:px-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-10">
            <div>
              <p className="font-body text-[2.25rem] font-medium leading-none text-ink">
                {averageRating.toFixed(1)}
                <span className="sr-only"> out of 5</span>
              </p>
              <StarRow value={averageRating} size="size-4" className="mt-2.5" />
              <p className="mt-2 font-body text-caption text-ink/70">
                {ADMIN_RATINGS.from(reviewCount, writtenCount)}
              </p>

              <div className="mt-5 flex items-start gap-3 rounded-xl bg-mist px-4 py-3.5">
                <TrendIcon className="mt-0.5 size-5 shrink-0 text-sage-deep" />
                <p className="font-body text-caption text-ink/70">{ADMIN_RATINGS.caveat}</p>
              </div>
            </div>

            <Distribution distribution={distribution} total={reviewCount} />
          </div>

          <div className="border-t border-ink/12 px-5 py-5 sm:px-6 sm:py-6">
            <h3 className="font-body text-caption font-medium text-ink/70">
              {ADMIN_RATINGS.everyReview}
            </h3>

            {/* Said, not only drawn: the skeleton is aria-hidden, so without
                this a screen reader hears nothing while the list loads (the
                gap 9.2 found in the worksheets skeleton). */}
            {firstLoading && <p role="status" className="sr-only">Loading reviews</p>}
            {firstLoading && (
              <div className="mt-4 flex flex-col gap-4" aria-hidden="true">
                {[0, 1].map((n) => (
                  <div key={n}>
                    <span className="block h-3 w-40 rounded-full bg-ink/10 motion-safe:animate-pulse" />
                    <span className="mt-2.5 block h-3 w-4/5 rounded-full bg-ink/10 motion-safe:animate-pulse" />
                  </div>
                ))}
              </div>
            )}

            {rows.length > 0 && (
              <ol className="mt-4 flex flex-col">
                {rows.map((review) => (
                  <li key={review.id} className="border-t border-ink/12 py-4 first:border-t-0 first:pt-1">
                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
                      <span className="flex items-center gap-2">
                        <StarRow value={review.stars} />
                        <span className="font-body text-caption text-ink/70">
                          <span className="font-medium text-ink">{review.stars} of 5</span> ·{' '}
                          {formatDate(review.createdAt)}
                        </span>
                      </span>
                      {review.client ? (
                        <Link
                          to={`/admin/clients/${review.client.id}`}
                          className="font-body text-caption text-ink underline decoration-ink/60 underline-offset-4 transition-colors duration-200 ease-out hover:decoration-ink"
                        >
                          {review.client.displayName}
                        </Link>
                      ) : (
                        <span className="font-body text-caption text-ink/70">
                          {ADMIN_RATINGS.unknownClient}
                        </span>
                      )}
                    </div>
                    {review.text ? (
                      <Text size="ui" className="mt-2 max-w-measure whitespace-pre-line">
                        {review.text}
                      </Text>
                    ) : (
                      <Text size="caption" tone="muted" className="mt-1.5">
                        {ADMIN_RATINGS.starsOnly}
                      </Text>
                    )}
                  </li>
                ))}
              </ol>
            )}

            {failed && (
              <div className="mt-4 flex flex-wrap items-center gap-3" role="alert">
                <Text size="caption" tone="error">
                  {failure.message}
                </Text>
                <Button variant="secondary" size="sm" onClick={retry}>
                  {ADMIN_RATINGS.retry}
                </Button>
              </div>
            )}

            {more && !failed && (
              <Button
                variant="secondary"
                className="mt-4"
                loading={loadingMore}
                onClick={loadMore}
              >
                {ADMIN_RATINGS.loadEarlier}
              </Button>
            )}
          </div>
        </>
      )}
    </section>
  )
}
