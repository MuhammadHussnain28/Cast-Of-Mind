import mongoose from 'mongoose';
import { REVIEW_TEXT_MAX, STARS_MAX, STARS_MIN } from '../constants/reviews.js';

// `reviews` — an end-of-subscription rating. Master spec §10.12, §9.6.
//
// ADMIN-ONLY. See constants/reviews.js: no client, therapist or public route
// may read this collection, and the one file that does is walked by a test.
//
// `therapistId` and `clientId` are USER ids, as §10.12 lists them. Both are set
// by the server from the client's own booking — never from a request — so a
// client cannot choose whom they rate.

const reviewSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'A review must belong to a booking.'],
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A review must have a client.'],
    },
    therapistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A review must name the therapist it is about.'],
    },

    // Spec addition, approved 2026-09-21: ONE RATING PER SUBSCRIPTION. §10.12
    // keys a review to the booking only, which would let a returning client
    // never rate again — or, without a guard, rate the same period twice. The
    // unique index below makes a double submission impossible, not just unlikely.
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      required: [true, 'A review must belong to the subscription it rates.'],
    },

    // §9.6: MANDATORY.
    stars: {
      type: Number,
      required: [true, 'Choose a rating from one to five stars.'],
      min: [STARS_MIN, `A rating is at least ${STARS_MIN} star.`],
      max: [STARS_MAX, `A rating is at most ${STARS_MAX} stars.`],
      validate: { validator: Number.isInteger, message: 'A rating is a whole number of stars.' },
    },

    // §9.6: OPTIONAL. Most ratings will arrive without it, which is exactly the
    // caveat the admin screens carry.
    text: {
      type: String,
      trim: true,
      maxlength: [REVIEW_TEXT_MAX, `Keep it under ${REVIEW_TEXT_MAX} characters.`],
      default: undefined,
    },
  },
  {
    // §10.12 lists createdAt only. A review is a record, not a draft — nothing
    // edits one, so an updatedAt would only ever equal it.
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

// An empty or whitespace-only answer is no answer. Stored as absent, so the
// "written" count means somebody actually wrote something.
reviewSchema.pre('validate', function dropEmptyText() {
  if (typeof this.text === 'string' && this.text.trim() === '') this.text = undefined;
});

reviewSchema.index({ subscriptionId: 1 }, { unique: true, name: 'one_review_per_subscription' });
// The therapist's review list and every per-therapist average.
reviewSchema.index({ therapistId: 1, createdAt: -1 });
// The dashboard's recent feed.
reviewSchema.index({ createdAt: -1 });

export const Review = mongoose.model('Review', reviewSchema);

export default Review;
