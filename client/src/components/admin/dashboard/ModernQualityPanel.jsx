import { Link } from 'react-router-dom'
import { Text } from '../../ui'
import { StarRow } from '../../reviews/ReviewMarks'
import { ADMIN_RATINGS } from '../../../data/reviewContent'
import { formatDate } from '../../../lib/dateFormat'
import { cx } from '../../../lib/cx'

/**
 * ModernQualityPanel — Executive Therapist Quality & Feedback Showcase for the Admin Dashboard.
 *
 * Full-width executive layout:
 * - Large score hero + stars + compact caveat pill (replaces the long essay disclaimer).
 * - Side-by-side leaderboard columns for Highest Rated and Needs Attention with clear badges.
 * - Responsive 2-column Recent Client Reviews feed with verified client stamps and ratings.
 * - 100% faithful to existing data contracts and master spec §9.1 / §9.6.
 */
export default function ModernQualityPanel({ quality }) {
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
      className="rounded-2xl border border-ink/12 bg-paper p-5 sm:p-7 shadow-xs space-y-6"
    >
      {/* =========================================================
          1. HEADER ROW: Score Hero + Compact Executive Caveat
          ========================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-6 border-b border-ink/8">
        <div>
          <h2 id="dashboard-quality" className="font-body text-xs font-semibold uppercase tracking-wider text-ink/60">
            {ADMIN_RATINGS.panelTitle}
          </h2>

          {rated ? (
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-baseline gap-1.5">
                <span className="font-body text-4xl sm:text-5xl font-extrabold tracking-tight text-ink tabular-nums">
                  {averageRating.toFixed(1)}
                </span>
                <span className="font-body text-caption font-semibold text-ink/40">/ 5.0</span>
              </div>

              <div className="space-y-1">
                <StarRow value={averageRating} size="size-4 sm:size-5" />
                <p className="font-body text-caption text-ink/70">
                  {ADMIN_RATINGS.from(reviewCount, writtenCount)}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-2">
              <p className="font-body text-2xl font-bold text-ink/60">{ADMIN_RATINGS.none}</p>
              <Text size="caption" tone="muted" className="mt-1">
                {ADMIN_RATINGS.noneBody}
              </Text>
            </div>
          )}
        </div>

        {/* Compact Executive Caveat Badge (Replaces the bulky text box) */}
        <div className="flex items-center gap-3 rounded-xl border border-ink/8 bg-mist px-4 py-2.5 font-body text-caption text-ink/75 max-w-md">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-sage/20 text-sage-deep">
            <svg
              className="size-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </span>
          <p className="leading-snug">
            <strong className="font-semibold text-ink">{ADMIN_RATINGS.caveatTitle}:</strong>{' '}
            Trend across client ratings. Minimum {rankingMinimum} reviews needed to qualify for leaderboard ranking.
          </p>
        </div>
      </div>

      {/* =========================================================
          2. MIDDLE ROW: TWO EXECUTIVE RANKING COLUMNS
          ========================================================= */}
      {rated && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* COLUMN A: HIGHEST RATED */}
          <div className="rounded-xl border border-ink/8 bg-mist/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-gold" aria-hidden="true" />
                <h3 className="font-body text-caption font-bold uppercase tracking-wider text-ink/70">
                  {ADMIN_RATINGS.highest}
                </h3>
              </div>
              <span className="font-body text-[11px] font-bold px-2 py-0.5 rounded-full bg-gold/20 text-ink border border-gold/30">
                {highestRated.length} {highestRated.length === 1 ? 'Qualified' : 'Qualified'}
              </span>
            </div>

            {highestRated.length === 0 ? (
              <Text size="caption" tone="muted" className="py-2">
                {ADMIN_RATINGS.noneRanked(rankingMinimum)}
              </Text>
            ) : (
              <div className="flex flex-col gap-2">
                {highestRated.map((row) => (
                  <div
                    key={row.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-ink/8 bg-paper p-3 transition-all hover:border-ink/25 shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sage/20 border border-sage/30 font-body text-xs font-bold text-sage-deep">
                        {row.name
                          ? row.name
                              .split(' ')
                              .filter(Boolean)
                              .slice(-2)
                              .map((n) => n[0])
                              .join('')
                          : 'TP'}
                      </div>
                      <Link
                        to={`/admin/therapists/${row.id}`}
                        className="truncate font-body text-ui font-medium text-ink underline decoration-ink/40 underline-offset-4 transition-colors hover:decoration-ink"
                      >
                        {row.name}
                      </Link>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5 font-body text-caption text-ink/70">
                      <StarRow value={row.averageRating} size="size-3" />
                      <span className="font-bold text-ink tabular-nums">{row.averageRating.toFixed(1)}</span>
                      <span className="tabular-nums text-ink/50">({row.reviewCount})</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {unranked && (
              <p className="font-body text-[11px] text-ink pt-1">
                {unranked}
              </p>
            )}
          </div>

          {/* COLUMN B: NEEDS ATTENTION */}
          <div className="rounded-xl border border-ink/8 bg-mist/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={cx(
                    'size-2 rounded-full',
                    needsAttention.length > 0 ? 'bg-clay' : 'bg-emerald-500',
                  )}
                  aria-hidden="true"
                />
                <h3 className="font-body text-caption font-bold uppercase tracking-wider text-ink/70">
                  {ADMIN_RATINGS.attention}
                </h3>
              </div>

              {needsAttention.length > 0 ? (
                <span className="font-body text-[11px] font-bold px-2 py-0.5 rounded-full bg-clay/15 text-clay border border-clay/30">
                  {needsAttention.length} Needs Review
                </span>
              ) : (
                <span className="font-body text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Clean Record
                </span>
              )}
            </div>

            {needsAttention.length === 0 ? (
              <div className="flex items-center gap-3 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/50 p-3.5">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
                  <svg
                    className="size-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <div>
                  <p className="font-body text-caption font-semibold text-emerald-950">
                    All therapists in good standing
                  </p>
                  <p className="font-body text-[11px] text-emerald-800/80">
                    No therapists have fallen below performance thresholds.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {needsAttention.map((row) => (
                  <div
                    key={row.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-clay/25 bg-clay/[0.04] p-3 transition-all hover:border-clay/40 shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-clay/15 font-body text-xs font-bold text-clay">
                        {row.name
                          ? row.name
                              .split(' ')
                              .filter(Boolean)
                              .slice(-2)
                              .map((n) => n[0])
                              .join('')
                          : 'TP'}
                      </div>
                      <Link
                        to={`/admin/therapists/${row.id}`}
                        className="truncate font-body text-ui font-medium text-clay hover:underline decoration-clay"
                      >
                        {row.name}
                      </Link>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5 font-body text-caption text-clay">
                      <StarRow value={row.averageRating} size="size-3" />
                      <span className="font-bold tabular-nums">{row.averageRating.toFixed(1)}</span>
                      <span className="tabular-nums text-clay/70">({row.reviewCount})</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="font-body text-[11px] text-ink pt-1">
              Minimum {rankingMinimum} ratings required before a therapist can enter attention status.
            </p>
          </div>
        </div>
      )}

      {/* =========================================================
          3. BOTTOM ROW: RECENT CLIENT REVIEWS (2-COLUMN GRID)
          ========================================================= */}
      <div className="pt-5 border-t border-ink/8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-body text-caption font-bold uppercase tracking-wider text-ink/70">
              {ADMIN_RATINGS.recent}
            </h3>
            <p className="font-body text-caption text-ink/50">
              Real-time feedback submitted upon subscription conclusion
            </p>
          </div>
          <span className="font-body text-caption font-medium text-ink/60 bg-mist px-2.5 py-1 rounded-lg border border-ink/8">
            {recentReviews.length} Reviews
          </span>
        </div>

        {recentReviews.length === 0 ? (
          <Text size="caption" tone="muted" className="mt-2">
            Nothing yet.
          </Text>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {recentReviews.map((review) => (
              <div
                key={review.id}
                className="flex flex-col justify-between rounded-xl border border-ink/8 bg-mist/50 p-4 transition-all hover:border-ink/20 hover:bg-paper shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-body text-caption font-bold text-ink truncate">
                      {review.therapist ? review.therapist.name : 'Platform Session'}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-body text-[11px] font-bold bg-gold/20 text-ink border border-gold/30 shrink-0">
                      ★ {review.stars.toFixed(1)}
                    </span>
                  </div>

                  {review.text ? (
                    <p className="font-body text-caption text-ink/85 italic leading-relaxed whitespace-pre-line">
                      "{review.text}"
                    </p>
                  ) : (
                    <p className="font-body text-caption text-ink/50 italic">
                      {ADMIN_RATINGS.starsOnly}
                    </p>
                  )}
                </div>

                <div className="mt-3 pt-2.5 border-t border-ink/6 flex items-center justify-between font-body text-[11px] text-ink">
                  <span>{review.client ? review.client.displayName : 'Verified Client'}</span>
                  <span>{formatDate(review.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
