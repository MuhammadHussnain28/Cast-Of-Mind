import mongoose from 'mongoose';
import { BOOKING_STATUS, BOOKING_STATUS_VALUES } from '../constants/payments.js';

// `bookings` — the link between one client and one therapist. Master spec §10.5.
//
// THE CENTRAL RECORD BOTH PORTALS READ FROM. The client portal queries by
// clientId to find their therapist; the therapist portal queries by therapistId
// to build their client list. Messages, worksheets, sessions, journals, private
// notes and reviews all hang off this id. There is no separate sync mechanism.
//
// CREATED ONLY BY THE PAYMENT WEBHOOK (chunk 6.4), inside the four-document
// transaction with `users`, `clientProfiles` and `subscriptions`.
//
// Re-subscribing REUSES this record rather than creating a second one (§13:
// "everything resumes exactly where it left off"), which is what keeps the chat
// history and the therapeutic relationship intact.

const bookingSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A booking must have a client.'],
    },

    therapistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A booking must have a therapist.'],
    },

    status: {
      type: String,
      enum: {
        values: BOOKING_STATUS_VALUES,
        // Interpolated here rather than with Mongoose's {VALUES} token, which it
        // does not substitute — the message would reach a caller verbatim.
        message: `Status must be one of: ${BOOKING_STATUS_VALUES.join(', ')}.`,
      },
      default: BOOKING_STATUS.ACTIVE,
      required: true,
    },

    endedAt: { type: Date, default: undefined },
  },
  {
    // §10.5 names the creation stamp `matchedAt` and lists no updatedAt.
    timestamps: { createdAt: 'matchedAt', updatedAt: false },
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

/**
 * Two shape guards.
 *
 * A booking that links someone to themselves is never legitimate, and would
 * mean a bug upstream had put one id in both slots. An active booking carrying
 * an end date, or an ended one without, is a record nobody can read confidently
 * — and the therapist client list and the admin bookings table both trust
 * `status` alone.
 */
bookingSchema.pre('validate', function checkShape() {
  if (this.clientId && this.therapistId && String(this.clientId) === String(this.therapistId)) {
    this.invalidate('therapistId', 'A booking cannot link a person to themselves.');
  }

  if (this.status === BOOKING_STATUS.ENDED && this.endedAt == null) {
    this.invalidate('endedAt', 'An ended booking must record when it ended.');
  }

  if (this.status === BOOKING_STATUS.ACTIVE && this.endedAt != null) {
    this.invalidate('endedAt', 'An active booking must not carry an end date.');
  }
});

// The therapist's client list, and the client's "who is my therapist" lookup.
// Compound because both screens filter on status as well as the person.
bookingSchema.index({ therapistId: 1, status: 1 });
bookingSchema.index({ clientId: 1, status: 1 });

// Admin bookings overview (chunk 10.2): newest pairing first.
bookingSchema.index({ matchedAt: -1 });

// ONE ACTIVE BOOKING PER CLIENT.
//
// Spec addition, approved 2026-09-07 — §10.5 does not state it, but §6 gives a
// client exactly one therapist and reassignment is deferred to v2. Without this
// index, a re-subscribe that failed to reuse the existing booking would create a
// second active one, and the client portal would silently pick whichever came
// back first. Ended bookings are exempt, so the history survives.
bookingSchema.index(
  { clientId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: BOOKING_STATUS.ACTIVE },
    name: 'one_active_booking_per_client',
  },
);

export const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
