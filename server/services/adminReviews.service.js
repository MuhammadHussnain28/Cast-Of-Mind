import { ClientProfile } from '../models/ClientProfile.js';
import { Review } from '../models/Review.js';
import { TherapistProfile } from '../models/TherapistProfile.js';
import { AppError } from '../utils/AppError.js';
import { USER_STATUS } from '../constants/roles.js';
import { clientDisplayName } from '../utils/clientDisplayName.js';
import {
  RANKED_LIST_SIZE,
  RANKING_MIN_RATINGS,
  RECENT_REVIEWS_LIMIT,
  STARS_MAX,
  STARS_MIN,
  THERAPIST_NOT_FOUND_MESSAGE,
} from '../constants/reviews.js';

/**
 * THE ONLY FILE THAT READS REVIEWS — master spec §9.6.
 *
 * Admin-only. It may be imported from the admin router and from nothing a
 * client, a therapist or the public can reach. `routes/reviews.test.js` walks
 * the import graph from every one of those routers and fails if this file is
 * found — the same architectural boundary 8.6 drew around private notes.
 *
 * No user id leaves: people are named by their PROFILE ids, the handle the
 * admin's client and therapist screens already share.
 */

const round1 = (value) => (value == null ? null : Math.round(value * 10) / 10);

const therapistName = (profile) =>
  profile ? `${profile.title} ${profile.firstName} ${profile.lastName}` : null;

// "Wrote something" means non-empty text. The model stores an empty answer as
// absent, but this also holds for any row written before that rule.
const WROTE_SOMETHING = {
  $cond: [{ $gt: [{ $strLenCP: { $ifNull: ['$text', ''] } }, 0] }, 1, 0],
};

async function therapistUserId(profileId) {
  const profile = await TherapistProfile.findById(profileId).select('userId').lean();
  if (!profile) throw new AppError(THERAPIST_NOT_FOUND_MESSAGE, 404, 'THERAPIST_NOT_FOUND');
  return profile.userId;
}

/**
 * One therapist's standing: average, count, how many came with words, and the
 * count at each star from 5 down to 1 — the shape of the ratings, not only
 * their mean. `averageRating` is null when nothing is rated, never 0: zero
 * would claim the lowest possible mark.
 */
export async function ratingSummary(userId) {
  const [row] = await Review.aggregate([
    { $match: { therapistId: userId } },
    {
      $group: {
        _id: null,
        average: { $avg: '$stars' },
        count: { $sum: 1 },
        written: { $sum: WROTE_SOMETHING },
        stars: { $push: '$stars' },
      },
    },
  ]);

  const distribution = {};
  for (let star = STARS_MAX; star >= STARS_MIN; star -= 1) distribution[star] = 0;
  for (const star of row?.stars ?? []) distribution[star] += 1;

  return {
    averageRating: round1(row?.average ?? null),
    reviewCount: row?.count ?? 0,
    writtenCount: row?.written ?? 0,
    distribution,
  };
}

/** Name the people on a page of reviews in two lookups, whatever its size. */
async function presentReviews(rows) {
  const clientIds = [...new Set(rows.map((r) => String(r.clientId)))];
  const therapistIds = [...new Set(rows.map((r) => String(r.therapistId)))];

  const [clients, therapists] = await Promise.all([
    ClientProfile.find({ userId: { $in: clientIds } })
      .select('userId type name coupleData')
      .lean(),
    TherapistProfile.find({ userId: { $in: therapistIds } })
      .select('userId title firstName lastName')
      .lean(),
  ]);

  const clientBy = new Map(clients.map((c) => [String(c.userId), c]));
  const therapistBy = new Map(therapists.map((t) => [String(t.userId), t]));

  return rows.map((review) => {
    const client = clientBy.get(String(review.clientId));
    const therapist = therapistBy.get(String(review.therapistId));

    return {
      id: String(review._id),
      stars: review.stars,
      text: review.text ?? '',
      createdAt: review.createdAt,
      // Approved 2026-09-21: the admin sees who wrote it, and the form tells
      // the client so before they send it.
      client: client ? { id: String(client._id), displayName: clientDisplayName(client) } : null,
      therapist: therapist ? { id: String(therapist._id), name: therapistName(therapist) } : null,
    };
  });
}

/** Reviews, newest first — for one therapist, or across the platform. */
export async function listReviews({ therapistId, page, limit }) {
  const filter = therapistId ? { therapistId: await therapistUserId(therapistId) } : {};

  const [rows, total] = await Promise.all([
    Review.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Review.countDocuments(filter),
  ]);

  return {
    data: await presentReviews(rows),
    meta: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
  };
}

/**
 * The dashboard's quality picture — §9.1 and §9.6.
 *
 * RANKING RULES, each one a reason not to mislead:
 *  - Only ACTIVE therapists are ranked. "Needs attention" on someone who has
 *    already left is noise on a screen meant for action.
 *  - Only therapists with at least RANKING_MIN_RATINGS ratings are ranked;
 *    the rest are counted, so their absence from the lists is explained.
 *  - The ranked set is split at its middle: "highest rated" takes the top half
 *    and "needs attention" the bottom half, at most five each. Two lists of the
 *    same five names — or a below-average therapist shown as "highest rated"
 *    because only two are ranked — would both be false.
 */
export async function platformQuality() {
  const [overall, perTherapist, recentRows, activeTherapists] = await Promise.all([
    Review.aggregate([
      {
        $group: {
          _id: null,
          average: { $avg: '$stars' },
          count: { $sum: 1 },
          written: { $sum: WROTE_SOMETHING },
        },
      },
    ]),
    Review.aggregate([
      { $group: { _id: '$therapistId', average: { $avg: '$stars' }, count: { $sum: 1 } } },
    ]),
    Review.find().sort({ createdAt: -1, _id: -1 }).limit(RECENT_REVIEWS_LIMIT).lean(),
    TherapistProfile.find({ status: USER_STATUS.ACTIVE })
      .select('userId title firstName lastName')
      .lean(),
  ]);

  const statsBy = new Map(perTherapist.map((row) => [String(row._id), row]));

  const ranked = activeTherapists
    .map((profile) => ({ profile, stats: statsBy.get(String(profile.userId)) }))
    .filter(({ stats }) => stats && stats.count >= RANKING_MIN_RATINGS)
    .sort(
      (a, b) =>
        b.stats.average - a.stats.average ||
        b.stats.count - a.stats.count ||
        therapistName(a.profile).localeCompare(therapistName(b.profile)),
    )
    .map(({ profile, stats }) => ({
      id: String(profile._id),
      name: therapistName(profile),
      averageRating: round1(stats.average),
      reviewCount: stats.count,
    }));

  const top = Math.min(RANKED_LIST_SIZE, Math.ceil(ranked.length / 2));
  const bottom = Math.min(RANKED_LIST_SIZE, Math.floor(ranked.length / 2));

  return {
    averageRating: round1(overall[0]?.average ?? null),
    reviewCount: overall[0]?.count ?? 0,
    writtenCount: overall[0]?.written ?? 0,
    rankingMinimum: RANKING_MIN_RATINGS,
    highestRated: ranked.slice(0, top),
    // Lowest first — the name most worth a look leads.
    needsAttention: ranked.slice(ranked.length - bottom).reverse(),
    unrankedCount: activeTherapists.filter(
      (profile) => (statsBy.get(String(profile.userId))?.count ?? 0) < RANKING_MIN_RATINGS,
    ).length,
    recentReviews: await presentReviews(recentRows),
  };
}
