import { Link } from 'react-router-dom'
import { Text } from '../../ui'
import { StarRow, TrendIcon } from '../../reviews/ReviewMarks'
import { ADMIN_RATINGS } from '../../../data/reviewContent'
import { formatDate } from '../../../lib/dateFormat'

/**
 * Therapist ratings on the dashboard — §9.1 and §9.6. ADMIN-ONLY.
 *
 * The average leads, as an absence when nothing is rated — never 0.0, which
 * would claim the lowest possible mark. Beside it the two ranked lists, then the
 * newest ratings.
 *
 * §9.6's CAVEAT IS BUILT IN, NOT ONLY PRINTED. It sits where the numbers are,
 * and the lists themselves obey it: a therapist is ranked only after the
 * server's minimum number of ratings, the ranked set is split at its middle so
 * no one appears in both lists, and the unranked are counted so their absence
 * is explained rather than mysterious.
 *
 * "Needs attention" is a clay dot and the words — a note for the admin, not an
 * alarm panel with a person's name in red.
 */
function RankedList({ title, rows, marker, emptyText }) {
  return (
    <div>
      <h3 className="flex items-center gap-2 font-body text-caption font-medium text-ink/70">
        {marker && <span aria-hidden="true" className="size-1.5 rounded-full bg-clay" />}
        {title}
      </h3>

      {rows.length === 0 ? (
        <Text size="caption" tone="muted" className="mt-3">
          {emptyText}
        </Text>
      ) : (
        <ol className="mt-3 flex flex-col">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex min-h-11 items-center justify-between gap-3 border-t border-ink/12 py-2 first:border-t-0"
            >
              <Link
                to={`/admin/therapists/${row.id}`}
                className="min-w-0 truncate font-body text-ui text-ink underline decoration-ink/60 underline-offset-4 transition-colors duration-200 ease-out hover:decoration-ink"
              >
                {row.name}
              </Link>
              <span className="flex shrink-0 items-center gap-2 font-body text-caption text-ink/70">
                <StarRow value={row.averageRating} size="size-3" />
                <span className="font-medium text-ink tabular-nums">
                  {row.averageRating.toFixed(1)}
                </span>
                <span className="tabular-nums">({row.reviewCount})</span>
                <span className="sr-only">
                  out of 5, from {row.reviewCount} ratings
                </span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

export default function QualityPanel({ quality }) {
  const {
    averageRating,
    reviewCount,
    writtenCount = 0,
    highestRated = [],
    needsAttention = [],
    unrankedCount = 0,
    rankingMinimum = 3,
    recentReviews = [],
  } = quality
  const rated = averageRating !== null
  const unranked = ADMIN_RATINGS.unranked(unrankedCount, rankingMinimum)

  return (
    <section
      aria-labelledby="dashboard-quality"
      className="rounded-2xl border border-ink/12 bg-paper px-5 py-5 sm:px-6 sm:py-6"
    >
      <h2 id="dashboard-quality" className="font-body text-caption text-ink/70">
        {ADMIN_RATINGS.panelTitle}
      </h2>

      {rated ? (
        <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-2">
          <p className="font-body text-[2.25rem] font-medium leading-none text-ink">
            {averageRating.toFixed(1)}
            <span className="sr-only"> out of 5</span>
          </p>
          <div className="pb-1">
            <StarRow value={averageRating} size="size-4" />
            <p className="mt-1.5 font-body text-caption text-ink/70">
              {ADMIN_RATINGS.from(reviewCount, writtenCount)}
            </p>
          </div>
        </div>
      ) : (
        <>
          <p className="mt-3 font-body text-[1.75rem] font-medium leading-none text-ink/60">
            {ADMIN_RATINGS.none}
          </p>
          <Text size="caption" tone="muted" className="mt-2">
            {ADMIN_RATINGS.noneBody}
          </Text>
        </>
      )}

      {/* The caveat, where the numbers are. */}
      <div className="mt-5 flex items-start gap-3 rounded-xl bg-mist px-4 py-3.5">
        <TrendIcon className="mt-0.5 size-5 shrink-0 text-sage-deep" />
        <div>
          <p className="font-body text-caption font-medium text-ink">
            {ADMIN_RATINGS.caveatTitle}
          </p>
          <p className="mt-0.5 font-body text-caption text-ink/70">{ADMIN_RATINGS.caveat}</p>
        </div>
      </div>

      {rated && (
        <>
          <div className="mt-5 grid gap-6 sm:grid-cols-2">
            <RankedList
              title={ADMIN_RATINGS.highest}
              rows={highestRated}
              emptyText={ADMIN_RATINGS.noneRanked(rankingMinimum)}
            />
            <RankedList
              title={ADMIN_RATINGS.attention}
              rows={needsAttention}
              marker
              emptyText={ADMIN_RATINGS.noneRanked(rankingMinimum)}
            />
          </div>
          {unranked && (
            <Text size="caption" tone="muted" className="mt-4">
              {unranked}
            </Text>
          )}
        </>
      )}

      <div className="mt-5 border-t border-ink/12 pt-4">
        <h3 className="font-body text-caption text-ink/70">{ADMIN_RATINGS.recent}</h3>

        {recentReviews.length === 0 ? (
          <Text size="caption" tone="muted" className="mt-2">
            Nothing yet.
          </Text>
        ) : (
          <ul className="mt-3 flex flex-col gap-4">
            {recentReviews.map((review) => (
              <li key={review.id}>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <StarRow value={review.stars} />
                  <span className="font-body text-caption text-ink/70">
                    {review.stars} of 5 · {formatDate(review.createdAt)}
                    {review.therapist && <> · {review.therapist.name}</>}
                  </span>
                </div>
                {review.text ? (
                  <Text size="caption" className="mt-1.5 whitespace-pre-line">
                    {review.text}
                  </Text>
                ) : (
                  <Text size="caption" tone="muted" className="mt-1">
                    {ADMIN_RATINGS.starsOnly}
                  </Text>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
