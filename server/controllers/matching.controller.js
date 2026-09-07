import { asyncHandler } from '../middleware/asyncHandler.js';
import { findMatches } from '../services/matching.service.js';

/**
 * POST /api/v1/matching — public, read-only, writes nothing.
 *
 * POST rather than GET for a read on purpose: concern tags in a query string
 * end up in access logs, browser history and Referer headers, and those are
 * somebody's mental health concerns. The body keeps them out of all three.
 */
export const getMatches = asyncHandler(async (req, res) => {
  const { concernTags, therapistGenderPreference, limit, offset } = req.body;

  const { therapists, total, usedFallback } = await findMatches({
    concernTags,
    therapistGenderPreference,
    limit,
    offset,
  });

  if (usedFallback) {
    // Anonymous by construction: a count and nothing else. NEVER the tags —
    // therapy content must not reach a log file. Worth having because "how
    // often does nobody match" is a real signal about the therapist roster.
    console.log(`[matching] no specialty overlap — returned ${total} therapists`);
  }

  // THE RESPONSE IS IDENTICAL IN SHAPE ON BOTH PATHS. No `fallback`, no
  // `matched`, nothing a UI could render as "no exact match found" — §15 rules
  // that message out, and the surest way to keep it out is to never send the
  // fact that would justify it.
  res.status(200).json({
    data: therapists,
    meta: { total, limit, offset },
  });
});

export default { getMatches };
