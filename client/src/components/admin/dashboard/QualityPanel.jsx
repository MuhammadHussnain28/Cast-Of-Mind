import { Text } from '../../ui'
import { formatCount } from '../../../lib/dashboardFormat'
import { formatDate } from '../../../lib/dateFormat'

/**
 * §9.6: reviews are admin-only and never shown publicly.
 *
 * The average is rendered as an absence when nothing has been rated, never as
 * 0.0 — zero would say every therapist scored the lowest possible mark, which
 * is a different and damaging claim.
 *
 * Worth keeping in view (§9.6's own caveat): stars are mandatory and written
 * reviews optional, so most ratings arrive with no context. The caption says so
 * rather than letting a single number look like a verdict.
 */
function Stars({ value }) {
  return (
    <span className="inline-flex items-center gap-1" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((step) => (
        <svg key={step} width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 3.5l2.6 5.3 5.9.85-4.25 4.15 1 5.85L12 16.9l-5.25 2.75 1-5.85L3.5 9.65l5.9-.85L12 3.5Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
            className="text-sage-deep"
            fill={step <= Math.round(value) ? 'currentColor' : 'none'}
          />
        </svg>
      ))}
    </span>
  )
}

export default function QualityPanel({ quality }) {
  const { averageRating, reviewCount, recentReviews } = quality
  const rated = averageRating !== null

  return (
    <section
      aria-labelledby="dashboard-quality"
      className="rounded-2xl border border-ink/12 bg-paper px-5 py-5 sm:px-6"
    >
      <h2 id="dashboard-quality" className="font-body text-caption text-ink/70">
        Therapist ratings
      </h2>

      {rated ? (
        <>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="font-body text-[1.75rem] font-medium leading-none text-ink">
              {averageRating.toFixed(1)}
            </span>
            <Stars value={averageRating} />
            <span className="sr-only">out of 5</span>
          </div>
          <Text size="caption" tone="muted" className="mt-2">
            Across {formatCount(reviewCount)}{' '}
            {reviewCount === 1 ? 'rating' : 'ratings'}. Read it as a trend, not a
            verdict — written reviews are optional, so most arrive without context.
          </Text>
        </>
      ) : (
        <>
          <p className="mt-3 font-body text-[1.75rem] font-medium leading-none text-ink/60">
            No ratings yet
          </p>
          <Text size="caption" tone="muted" className="mt-2">
            Clients are asked to rate their therapist when a subscription ends.
          </Text>
        </>
      )}

      <div className="mt-5 border-t border-ink/12 pt-4">
        <h3 className="font-body text-caption text-ink/70">Recent reviews</h3>

        {recentReviews.length === 0 ? (
          <Text size="caption" tone="muted" className="mt-2">
            Nothing yet.
          </Text>
        ) : (
          <ul className="mt-3 flex flex-col gap-4">
            {recentReviews.map((review) => (
              <li key={review.id}>
                <div className="flex items-center gap-2">
                  <Stars value={review.stars} />
                  <span className="font-body text-caption text-ink/70">
                    {review.stars} of 5 · {formatDate(review.createdAt)}
                  </span>
                </div>
                {review.text && (
                  <Text size="caption" className="mt-1.5">
                    {review.text}
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
