import mongoose from 'mongoose';
import {
  EVENT_TYPE_MAX,
  PAYMENT_PLATFORM_VALUES,
  PLATFORM_EVENT_ID_MAX,
  PLATFORM_SUBSCRIPTION_ID_MAX,
} from '../constants/payments.js';

// `paymentEvents` — the immutable, append-only ledger of every payment webhook
// received. Master spec §10.14.
//
// THIS IS THE PERMANENT RECORD FOR DISPUTE RESOLUTION. `subscriptions` holds
// current state and changes; this holds history and never does. Storing webhook
// data as a field on `subscriptions` was considered and rejected in §10.14
// because a renewal would overwrite exactly the trail a chargeback needs.
//
// Every write path Mongoose exposes is blocked below except creation. Read the
// guard's own comment for the one hole that remains.

export class AppendOnlyViolationError extends Error {
  constructor(operation) {
    super(
      `paymentEvents is an append-only ledger — "${operation}" is not allowed. ` +
        'It is the permanent record for payment disputes and must never be edited or deleted.',
    );
    this.name = 'AppendOnlyViolationError';
    this.operation = operation;
  }
}

const paymentEventSchema = new mongoose.Schema(
  {
    // BOTH OF THESE ARE OPTIONAL, AND THAT IS NOT AN OVERSIGHT.
    //
    // The backend rules require every webhook to be logged here BEFORE it is
    // acted on. On a first payment neither the user nor the subscription exists
    // yet — chunk 6.4 creates them FROM this webhook. Making either field
    // required would make the first event of a client's life impossible to log,
    // which is the one event a dispute is most likely to be about. Chunk 6.4
    // links them on the way out.
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      default: undefined,
      immutable: true,
    },

    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: undefined,
      immutable: true,
    },

    // Spec addition (11.5): the platform's subscription id, read from the
    // payload before the insert. The first payment is logged before our
    // subscription exists, so this is the only link billing history can find.
    platformSubscriptionId: {
      type: String,
      trim: true,
      maxlength: PLATFORM_SUBSCRIPTION_ID_MAX,
      default: undefined,
      immutable: true,
    },

    platform: {
      type: String,
      required: [true, 'Every payment event must name its platform.'],
      enum: {
        values: PAYMENT_PLATFORM_VALUES,
        // Mongoose does not substitute a {VALUES} token, so the list is built here.
        message: `Platform must be one of: ${PAYMENT_PLATFORM_VALUES.join(', ')}.`,
      },
      immutable: true,
    },

    // FREE TEXT, NOT AN ENUM — deliberately.
    //
    // An enum would reject any event type we had not anticipated, and the rule
    // is to log every webhook and handle unknown types gracefully. A validation
    // error here would drop the record instead of storing it, so the ledger
    // would be missing precisely the surprising events worth investigating.
    eventType: {
      type: String,
      required: [true, 'Every payment event must record its type.'],
      trim: true,
      maxlength: EVENT_TYPE_MAX,
      immutable: true,
    },

    // The idempotency key. Platforms resend webhooks, and processing one twice
    // would duplicate records or double-count money. The unique index at the
    // foot of this file is what actually enforces it — a read-then-write check
    // in a service would still race.
    platformEventId: {
      type: String,
      required: [true, 'Every payment event must carry its platform event id.'],
      trim: true,
      maxlength: PLATFORM_EVENT_ID_MAX,
      immutable: true,
    },

    // MINOR UNITS — CENTS, exactly as the platform sent them.
    // Optional: a cancellation or a subscription-updated event carries no money.
    amount: {
      type: Number,
      default: undefined,
      min: [0, 'Amount cannot be negative.'],
      validate: {
        validator: (value) => value == null || Number.isInteger(value),
        message: 'Amount is stored in cents and must be a whole number.',
      },
      immutable: true,
    },

    // Free text, unlike `subscriptions.currency`. That record is what we charge;
    // this one records what actually arrived. A payment in an unexpected
    // currency is a thing to investigate, not a thing to refuse to write down.
    currency: {
      type: String,
      default: undefined,
      trim: true,
      uppercase: true,
      immutable: true,
    },

    // The full webhook body, verbatim.
    //
    // `select: false` so no ordinary query drags it back, and it is stripped
    // from toJSON as well — a webhook body carries payment details, which are on
    // the never-log list and have no business reaching a response. Storing it
    // here is the audit trail the spec requires; that is not the same as
    // exposing it.
    rawPayload: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'The raw webhook body is the audit trail and must be stored.'],
      select: false,
      immutable: true,
    },

    receivedAt: { type: Date, required: true, default: Date.now, immutable: true },
  },
  {
    // §10.14 lists receivedAt only. Nothing here is ever updated, so an
    // updatedAt would be a field that could only ever lie.
    timestamps: false,
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        delete ret.rawPayload;
        return ret;
      },
    },
  },
);

/* ------------------------------------------------------------------------- *
 * THE APPEND-ONLY GUARD
 *
 * Creating is allowed. Every other write path throws.
 *
 * A guard on save() alone would be theatre — most accidental edits would arrive
 * through Model.updateOne or findOneAndUpdate, which never touch document
 * middleware. Each hook below is proven by its own test rather than trusted.
 *
 * THE ONE HOLE, STATED PLAINLY: the raw driver
 * (mongoose.connection.db.collection("paymentevents").updateOne) does not pass
 * through Mongoose at all and cannot be blocked from here. This guard stops
 * accidents, not somebody deliberately going around it. Enforcing it properly
 * needs a database user without update or delete rights on this collection,
 * which is a deployment concern for chunk 12.5.
 * ------------------------------------------------------------------------- */

const MUTATING_HOOKS = Object.freeze([
  'updateOne',
  'updateMany',
  'findOneAndUpdate',
  'findOneAndReplace',
  'replaceOne',
  'deleteOne',
  'deleteMany',
  'findOneAndDelete',
]);

// Every hook below THROWS rather than calling next(err). Mongoose decides how to
// invoke a middleware function partly from its declared arguments, and a hook
// written to expect `next` is not always handed one — a zero-argument hook that
// throws is unambiguous, and Kareem turns the throw into a rejected promise.

for (const hook of MUTATING_HOOKS) {
  // Both forms: `Model.updateOne(...)` is query middleware and `doc.deleteOne()`
  // is document middleware, and each would slip past a hook registered only for
  // the other.
  paymentEventSchema.pre(hook, { document: true, query: true }, function blockMutation() {
    throw new AppendOnlyViolationError(hook);
  });
}

// Re-saving an existing document. Creation has isNew === true and is allowed.
paymentEventSchema.pre('save', function blockResave() {
  if (!this.isNew) {
    throw new AppendOnlyViolationError('save');
  }
});

// bulkWrite mixes inserts and updates in one call, so it is refused outright.
// Nothing bulk-writes this collection — webhooks arrive one at a time.
paymentEventSchema.pre('bulkWrite', function blockBulkWrite() {
  throw new AppendOnlyViolationError('bulkWrite');
});

// $out and $merge let an aggregation rewrite a collection in place, which would
// edit the ledger without any of the hooks above firing. Reading is untouched.
paymentEventSchema.pre('aggregate', function blockAggregateWrites() {
  const writesBack = this.pipeline().some(
    (stage) => stage && (stage.$out !== undefined || stage.$merge !== undefined),
  );

  if (writesBack) {
    throw new AppendOnlyViolationError('aggregate $out/$merge');
  }
});

/* ------------------------------------------------------------------------- */

// IDEMPOTENCY. Compound rather than platformEventId alone, approved 2026-09-07.
//
// The brief said platformEventId by itself. If PayPal is ever added alongside
// Stripe and one of its event ids happened to equal a Stripe one, a single-field
// unique index would silently refuse a real payment event — a lost row on the
// one collection that must never lose a row. Duplicate detection is unaffected,
// because a resent webhook always carries both the same platform and the same id.
//
// CONTRACT FOR CHUNK 6.3: look duplicates up on BOTH fields, never on
// platformEventId alone.
paymentEventSchema.index(
  { platform: 1, platformEventId: 1 },
  { unique: true, name: 'one_record_per_platform_event' },
);

// Reading a subscription's payment history during a dispute.
paymentEventSchema.index({ subscriptionId: 1, receivedAt: -1 });
paymentEventSchema.index({ clientId: 1, receivedAt: -1 });
paymentEventSchema.index({ receivedAt: -1 });
// A client's billing history (11.5).
paymentEventSchema.index({ platformSubscriptionId: 1, receivedAt: -1 });

export const PaymentEvent = mongoose.model('PaymentEvent', paymentEventSchema);

export default PaymentEvent;
