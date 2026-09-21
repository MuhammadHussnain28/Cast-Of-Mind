import mongoose from 'mongoose';
import {
  BILLING_CURRENCY,
  CANCELLED_BY_VALUES,
  PLATFORM_SUBSCRIPTION_ID_MAX,
  SESSIONS_PER_CYCLE,
  SUBSCRIPTION_AMOUNT_MINOR,
  SUBSCRIPTION_STATUS,
  SUBSCRIPTION_STATUS_VALUES,
} from '../constants/payments.js';

// `subscriptions` — the current billing and access state for a booking.
// Master spec §10.6, lifecycle §13.
//
// THIS COLLECTION HOLDS CURRENT STATE AND CHANGES OVER TIME.
// `paymentEvents` holds permanent history and never changes. Keeping the two
// apart is deliberate: a webhook field on this record would be overwritten on
// every renewal, destroying exactly the audit trail a dispute needs (§10.14).
//
// Portal access is gated on `status`, checked on every login and every
// sensitive action (§13).
//
// A booking may own SEVERAL subscriptions over its life — cancel, expire,
// re-subscribe — but only one of them may be active at a time. See the partial
// unique index at the foot of this file.

const subscriptionSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'A subscription must belong to a booking.'],
    },

    // Denormalised from the booking on purpose: the client portal's access gate
    // runs on every request and should not need a join to answer "am I paid up".
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A subscription must have a client.'],
    },

    status: {
      type: String,
      enum: {
        values: SUBSCRIPTION_STATUS_VALUES,
        // Mongoose does not substitute a {VALUES} token, so the list is built here.
        message: `Status must be one of: ${SUBSCRIPTION_STATUS_VALUES.join(', ')}.`,
      },
      default: SUBSCRIPTION_STATUS.ACTIVE,
      required: true,
    },

    // Strict here, deliberately free on the ledger. This record is what WE
    // charge; the ledger records whatever actually arrived. See PaymentEvent.js.
    currency: {
      type: String,
      enum: { values: [BILLING_CURRENCY], message: `Only ${BILLING_CURRENCY} is billed.` },
      default: BILLING_CURRENCY,
      required: true,
    },

    // MINOR UNITS — CENTS. €200.00 is 20000. See constants/payments.js.
    amount: {
      type: Number,
      required: [true, 'A subscription must record what is charged.'],
      default: SUBSCRIPTION_AMOUNT_MINOR,
      min: [0, 'Amount cannot be negative.'],
      validate: {
        validator: Number.isInteger,
        message: 'Amount is stored in cents and must be a whole number.',
      },
    },

    startDate: { type: Date, required: true, default: Date.now },

    currentPeriodEnd: {
      type: Date,
      required: [true, 'A subscription must know when the paid period ends.'],
    },

    nextBillingDate: {
      type: Date,
      required: [true, 'A subscription must know when it renews.'],
    },

    // §13: 4 per cycle, reset to 4 on renewal, 0 when the subscription ends.
    // The ceiling is what makes carry-over impossible by construction rather
    // than by remembering — a client with 2 unused sessions can never reach 6.
    sessionsRemaining: {
      type: Number,
      required: true,
      default: SESSIONS_PER_CYCLE,
      min: [0, 'Sessions remaining cannot be negative.'],
      max: [SESSIONS_PER_CYCLE, `Sessions do not carry over — the ceiling is ${SESSIONS_PER_CYCLE}.`],
      validate: {
        validator: Number.isInteger,
        message: 'Sessions remaining must be a whole number.',
      },
    },

    // The Stripe/PayPal subscription id. Chunk 6.3 looks a webhook up by this.
    platformSubscriptionId: {
      type: String,
      trim: true,
      maxlength: PLATFORM_SUBSCRIPTION_ID_MAX,
      default: undefined,
    },

    // The Stripe customer, as opposed to the subscription.
    //
    // Spec addition, approved 2026-09-09 — §10.6 does not list it. Slice 11
    // needs it to let a client update a failed card or open Stripe's billing
    // portal; reaching it through platformSubscriptionId would mean an extra
    // API call on every such request.
    //
    // NOT unique: Stripe reuses one customer across a cancel-and-resubscribe,
    // so the same id legitimately appears on more than one of our records.
    platformCustomerId: {
      type: String,
      trim: true,
      maxlength: PLATFORM_SUBSCRIPTION_ID_MAX,
      default: undefined,
    },

    // The Stripe CHECKOUT SESSION that produced this subscription.
    //
    // Spec addition, approved 2026-09-10 — §10.6 does not list it. It is the
    // only link from the id Stripe puts in the /welcome URL back to the account
    // that was created: chunk 6.4 deletes the pendingCheckouts draft inside the
    // transaction, so nothing else survives to join on.
    //
    // Without it, the "is my account ready yet" poll would need a Stripe API
    // round trip on every request, or a scan inside paymentEvents.rawPayload,
    // which is select:false and unindexed.
    checkoutSessionId: {
      type: String,
      trim: true,
      maxlength: PLATFORM_SUBSCRIPTION_ID_MAX,
      default: undefined,
    },

    cancelledAt: { type: Date, default: undefined },

    // WHO stopped it — spec addition, approved 2026-09-20. §10.6 records only
    // `cancelledAt`, so a subscription Asad cancelled over a refund dispute and
    // one the client cancelled themselves are indistinguishable afterwards.
    // That distinction is exactly what a dispute asks about. Unset until a
    // cancellation happens; slice 11 sets 'client' on the self-serve path.
    cancelledBy: {
      type: String,
      enum: {
        values: CANCELLED_BY_VALUES,
        message: `Cancelled by must be one of: ${CANCELLED_BY_VALUES.join(', ')}.`,
      },
      default: undefined,
    },
  },
  {
    timestamps: true, // §10.6 lists both createdAt and updatedAt
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

/**
 * Two sanity guards.
 *
 * A period ending before it starts is a date-arithmetic bug, and it would show
 * a client an access window that had already closed. A cancelled subscription
 * with no `cancelledAt` loses the only stamp that says when the client chose to
 * stop — the churn figure on the admin dashboard falls back to `updatedAt`
 * precisely because expiry has no stamp of its own.
 *
 * `cancelledAt` deliberately SURVIVES the move to `expired` (§13: cancelled
 * keeps access until the period ends, then expires), so this is checked only on
 * the way in to `cancelled`.
 */
subscriptionSchema.pre('validate', function checkShape() {
  if (this.startDate && this.currentPeriodEnd && this.currentPeriodEnd <= this.startDate) {
    this.invalidate('currentPeriodEnd', 'The period must end after it starts.');
  }

  if (this.status === SUBSCRIPTION_STATUS.CANCELLED && this.cancelledAt == null) {
    this.invalidate('cancelledAt', 'A cancelled subscription must record when it was cancelled.');
  }
});

// The access gate: "this client's current subscription".
subscriptionSchema.index({ clientId: 1, status: 1 });
subscriptionSchema.index({ bookingId: 1 });

// The admin dashboard (chunk 4.4): MRR sums active EUR rows, churn counts ended
// rows by updatedAt, and the signups trend reads createdAt.
subscriptionSchema.index({ status: 1, currency: 1 });
subscriptionSchema.index({ status: 1, updatedAt: -1 });
subscriptionSchema.index({ createdAt: -1 });

// Slice 11: the renewal reminder sweep and the expiry sweep.
subscriptionSchema.index({ platformCustomerId: 1 });
// The /welcome status poll. Read often for a few seconds, then never again.
subscriptionSchema.index({ checkoutSessionId: 1 });
subscriptionSchema.index({ nextBillingDate: 1 });
subscriptionSchema.index({ currentPeriodEnd: 1 });

// ONE ACTIVE SUBSCRIPTION PER BOOKING.
//
// Spec addition, approved 2026-09-07. Cancelled and expired rows are exempt, so
// a re-subscribe keeps its history. If slice 11 ever genuinely needs two live
// rows on one booking, this is the index to drop.
subscriptionSchema.index(
  { bookingId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: SUBSCRIPTION_STATUS.ACTIVE },
    name: 'one_active_subscription_per_booking',
  },
);

// One platform subscription maps to one of our records.
//
// A PARTIAL index on string values rather than `sparse`, because sparse only
// skips MISSING fields — several rows explicitly holding null would still
// collide, and null is exactly what a careless insert writes.
subscriptionSchema.index(
  { platformSubscriptionId: 1 },
  {
    unique: true,
    partialFilterExpression: { platformSubscriptionId: { $type: 'string' } },
    name: 'one_subscription_per_platform_id',
  },
);

export const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;
