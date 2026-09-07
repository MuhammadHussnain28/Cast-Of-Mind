import { TherapistProfile } from '../models/TherapistProfile.js';
import { USER_STATUS } from '../constants/roles.js';
import {
  PUBLIC_THERAPIST_FIELDS,
  GENDER_PREFERENCE,
  MATCHING_PAGE_SIZE,
} from '../constants/matching.js';

/**
 * The matching engine — master spec §15.
 *
 * Specialty-tag overlap decides WHO appears. Gender preference decides only the
 * ORDER. Nothing else takes part: country, timezone, availability and treatment
 * orientations are collected and displayed, never filtered on.
 */

/** `$project` built from the allowlist, so one edit changes what may leave. */
function publicProjection() {
  const projection = { _id: 0, id: { $toString: '$_id' } };
  for (const field of PUBLIC_THERAPIST_FIELDS) projection[field] = 1;
  return projection;
}

/**
 * Ranking, in order:
 *   1. preferred gender first — a SORT KEY, never a query condition, which is
 *      what makes it structurally impossible for it to hide anyone;
 *   2. more overlapping concerns first — still tags only, just degree of fit;
 *   3. `_id` — a stable tiebreak, so a refresh does not reshuffle the list.
 */
function rankingStages(concernTags, preference) {
  const wantsGender =
    preference && preference !== GENDER_PREFERENCE.NO_PREFERENCE;

  return [
    {
      $addFields: {
        overlapCount: {
          $size: { $setIntersection: ['$specialtyTags', concernTags] },
        },
        // 0 sorts above 1. With no preference every therapist scores 0, so the
        // key is present but inert rather than branching the pipeline.
        genderRank: wantsGender
          ? { $cond: [{ $eq: ['$gender', preference] }, 0, 1] }
          : 0,
      },
    },
    { $sort: { genderRank: 1, overlapCount: -1, _id: 1 } },
  ];
}

async function run({ match, concernTags, preference, limit, offset }) {
  const [result] = await TherapistProfile.aggregate([
    { $match: match },
    ...rankingStages(concernTags, preference),
    {
      $facet: {
        data: [{ $skip: offset }, { $limit: limit }, { $project: publicProjection() }],
        total: [{ $count: 'value' }],
      },
    },
  ]);

  return {
    therapists: result?.data ?? [],
    total: result?.total?.[0]?.value ?? 0,
  };
}

/**
 * @returns {{ therapists: object[], total: number, usedFallback: boolean }}
 *
 * `usedFallback` IS FOR THE SERVER ONLY. The controller uses it for one
 * anonymous log line and never puts it in the response — §15 requires the
 * fallback to be silent, and a flag in the payload is how a "no exact match"
 * banner gets built later by someone who never read the spec.
 */
export async function findMatches({
  concernTags,
  therapistGenderPreference,
  limit = MATCHING_PAGE_SIZE,
  offset = 0,
}) {
  const active = { status: USER_STATUS.ACTIVE };
  const preference = therapistGenderPreference;

  // Specialty overlap. The ONLY condition that decides who is eligible.
  const matched = await run({
    match: { ...active, specialtyTags: { $in: concernTags } },
    concernTags,
    preference,
    limit,
    offset,
  });

  if (matched.total > 0) {
    return { ...matched, usedFallback: false };
  }

  // §15's no-match fallback: every active therapist, ordered by preference if
  // one was stated. An anxious visitor told "we could not find a match" is
  // likely to abandon the flow — a deliberate client decision, recorded in the
  // spec as one not to reintroduce.
  const all = await run({
    match: active,
    concernTags,
    preference,
    limit,
    offset,
  });

  return { ...all, usedFallback: true };
}

export default { findMatches };
