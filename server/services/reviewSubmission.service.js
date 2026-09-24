import { Booking } from '../models/Booking.js';
import { Review } from '../models/Review.js';
import { AppError } from '../utils/AppError.js';
import { SUBSCRIPTION_STATUS } from '../constants/payments.js';
import { findCurrentSubscription } from '../middleware/requireActiveSubscription.js';
import {
  ALREADY_REVIEWED_MESSAGE,
  REVIEW_NOT_AVAILABLE_MESSAGE,
  REVIEW_STATE,
} from '../constants/reviews.js';

/**
 * The client's side of reviews — master spec §9.6.
 *
 * THIS FILE CAN WRITE A REVIEW AND CANNOT READ ONE. The only thing it asks of
 * the collection is whether a review EXISTS for a subscription, so the portal
 * can stop offering the form. It never returns stars or text — not even the
 * client's own (approved 2026-09-21). The read path is adminReviews.service.js,
 * which no client route can reach; routes/reviews.test.js walks the imports.
 */

// Approved 2026-09-21: a client can rate once the subscription is CANCELLED —
// while they still have access and are still around to be asked — or has
// EXPIRED. Someone who cancels rarely returns after expiry, so asking only then
// would lose most ratings.
const REVIEWABLE = [SUBSCRIPTION_STATUS.CANCELLED, SUBSCRIPTION_STATUS.EXPIRED];

const isReviewable = (subscription) =>
  Boolean(subscription) && REVIEWABLE.includes(subscription.status);

/** The one fact the portal needs: whether to offer the form. */
export async function reviewStateFor(subscription) {
  if (!isReviewable(subscription)) return REVIEW_STATE.NOT_YET;

  const already = await Review.exists({ subscriptionId: subscription._id });
  return already ? REVIEW_STATE.SUBMITTED : REVIEW_STATE.ELIGIBLE;
}

/**
 * Record a rating for the client's CURRENT subscription.
 *
 * Every relationship is resolved here from the token's user: the subscription
 * from the client, the booking from the subscription, the therapist from the
 * booking. The request carries stars and words and nothing that could point
 * the rating at anyone else.
 */
export async function submitReview(userId, { stars, text }) {
  const subscription = await findCurrentSubscription(userId);

  if (!isReviewable(subscription)) {
    throw new AppError(REVIEW_NOT_AVAILABLE_MESSAGE, 409, 'REVIEW_NOT_AVAILABLE');
  }

  const booking = await Booking.findById(subscription.bookingId)
    .select('clientId therapistId')
    .lean();

  // A subscription whose booking is missing or belongs to someone else is a
  // broken record, not a reviewable one.
  if (!booking || String(booking.clientId) !== String(userId)) {
    throw new AppError(REVIEW_NOT_AVAILABLE_MESSAGE, 409, 'REVIEW_NOT_AVAILABLE');
  }

  try {
    await Review.create({
      bookingId: booking._id,
      clientId: userId,
      therapistId: booking.therapistId,
      subscriptionId: subscription._id,
      stars,
      text,
    });
  } catch (error) {
    // The unique index decides a double submission atomically — two requests
    // arriving together cannot both land.
    if (error?.code === 11000) {
      throw new AppError(ALREADY_REVIEWED_MESSAGE, 409, 'ALREADY_REVIEWED');
    }
    throw error;
  }

  // Deliberately nothing else. Not the stars, not the text, not an id.
  return { submitted: true };
}
