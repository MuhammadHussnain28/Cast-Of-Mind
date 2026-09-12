import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { PENDING_CHECKOUT_TTL_HOURS } from '../constants/checkout.js';

// `pendingCheckouts` — questionnaire answers held between "checkout started"
// and "webhook confirms payment". Chunk 6.2.
//
// A FIFTEENTH COLLECTION. Master spec §10 fixes the schema at 14, so this is a
// spec addition, approved 2026-09-07 — the same footing as the reset-token
// fields in 1.5 and the two fields in 4.3.
//
// WHY IT HAS TO EXIST. §12's golden rule is that the account is created only
// when the webhook confirms payment. The questionnaire is answered minutes
// earlier, in a browser, and must survive until then. The alternative was
// Stripe's Checkout Session `metadata`, rejected for two reasons: it caps values
// at 500 characters, which a couple's answers would breach, and it would put
// somebody's mental health concerns on a third party's servers for no reason.
//
// NOTHING HERE IS AN ACCOUNT. No user, no booking, no subscription — this is a
// draft that either becomes those four documents at 6.4 or expires unread.

const pendingCheckoutSchema = new mongoose.Schema(
  {
    /**
     * Our own key, generated before Stripe is called.
     *
     * Travels to Stripe as `client_reference_id` and comes back on the webhook.
     * It exists because the Stripe session id is not known until after the
     * session is created: if that write-back failed, a record keyed only by
     * session id would be unreachable and a paying client would be stranded.
     * 32 random bytes, so it is not guessable from another one.
     */
    reference: {
      type: String,
      required: true,
      unique: true,
      default: () => crypto.randomBytes(32).toString('hex'),
      immutable: true,
    },

    // Written back immediately after Stripe returns. Absent only in the tiny
    // window between the two calls, or if the Stripe call failed outright.
    checkoutSessionId: { type: String, default: undefined, trim: true },

    // Lowercased at validation. Becomes `users.email` at 6.4.
    email: {
      type: String,
      required: [true, 'An email address is required.'],
      trim: true,
      lowercase: true,
    },

    // The therapistProfiles id the client chose. Re-verified as active at 6.4
    // as well as here — a therapist can be deactivated while a checkout is open.
    therapistProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TherapistProfile',
      required: [true, 'A therapist must be chosen before checkout.'],
    },

    /**
     * The questionnaire, in the exact shape `clientProfiles` stores.
     *
     * Deliberately Mixed rather than a second copy of the ClientProfile schema.
     * A duplicated schema is how two definitions drift until one accepts what
     * the other rejects — the mistake models/workingHours.js and
     * models/fixedListValidator.js were extracted to prevent. Instead the
     * service validates this against the REAL ClientProfile schema before
     * storing it, so we can never take money for answers that will not persist.
     */
    questionnaire: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'The questionnaire answers are required.'],
    },

    /**
     * THE TTL, AND WHY IT IS SAFE HERE.
     *
     * Chunk 1.3 recorded a warning never to put a TTL index on
     * `refreshTokenExpiresAt`. That was right, and this is the opposite case.
     * There, the expiring value lived ON the users record, so a TTL index would
     * have deleted entire client and therapist accounts. Here the whole document
     * IS the temporary thing, and deleting all of it is precisely the intent.
     *
     * The distinction is the field's owner, not the index: TTL deletes the
     * document, so it is correct exactly when the document is disposable.
     */
    expiresAt: { type: Date, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        // Nothing here is ever serialised to a client, but if a future endpoint
        // did, the answers must not ride along.
        delete ret.questionnaire;
        return ret;
      },
    },
  },
);

pendingCheckoutSchema.statics.expiryFromNow = function expiryFromNow(now = Date.now()) {
  return new Date(now + PENDING_CHECKOUT_TTL_HOURS * 60 * 60 * 1000);
};

// MongoDB sweeps expired documents about once a minute, so removal is
// approximate. That is fine: the margin over Stripe's own 24-hour session
// expiry is two hours.
pendingCheckoutSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// The webhook's lookup at 6.4, by whichever key it has.
pendingCheckoutSchema.index({ checkoutSessionId: 1 });

export const PendingCheckout = mongoose.model('PendingCheckout', pendingCheckoutSchema);

export default PendingCheckout;
