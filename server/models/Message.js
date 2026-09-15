import mongoose from 'mongoose';
import { MESSAGE_TYPE, MESSAGE_TYPE_VALUES, MESSAGE_TEXT_MAX } from '../constants/chat.js';

// `messages` — individual chat messages. Master spec §10.7, architecture §14.
//
// Client and therapist do not connect to each other. Both read and write the
// same bookingId-scoped thread: the client portal asks for "my booking", the
// therapist portal for "the selected client's booking". Same rows, two
// viewpoints, no sync mechanism.
//
// THE DATABASE IS THE RECORD. Socket.io (7.3) is delivery only — a message is
// persisted first and emitted second, so a dropped socket loses nothing.
//
// NO NAME IS STORED HERE, only `senderId`. Names live on the profile
// collections and are read live, per the store-IDs-only rule (§10). A copied
// name goes stale the moment someone is renamed.

const messageSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'A message must belong to a booking.'],
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A message must have a sender.'],
    },

    text: {
      type: String,
      required: [true, 'A message cannot be empty.'],
      trim: true,
      maxlength: [MESSAGE_TEXT_MAX, `A message must be ${MESSAGE_TEXT_MAX} characters or fewer.`],
    },

    type: {
      type: String,
      enum: {
        values: MESSAGE_TYPE_VALUES,
        // Built here rather than with Mongoose's {VALUES} token, which it does
        // not substitute — the message would reach a caller verbatim (6.1).
        message: `Type must be one of: ${MESSAGE_TYPE_VALUES.join(', ')}.`,
      },
      default: MESSAGE_TYPE.TEXT,
      required: true,
    },

    /**
     * ONE BOOLEAN, AND THAT ONLY WORKS BECAUSE CHAT IS STRICTLY 1:1.
     *
     * A booking links exactly two people (§10.5), so a message has exactly one
     * recipient and one flag is enough — §14 defines the badge as "messages in
     * this booking where read is false and senderId is not me".
     *
     * If a third party is ever added to a booking this breaks SILENTLY: the
     * first reader would clear the flag for everyone. That change would need a
     * per-recipient read model, not another boolean.
     */
    read: { type: Boolean, default: false, required: true },
  },
  {
    // §10.7 lists createdAt only. A message is never edited, so an updatedAt
    // could only ever lie about one.
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

// The conversation fetch, newest first then reversed for display. Compound and
// ordered so the cursor's `createdAt` then `_id` tiebreak is served by the
// index rather than by an in-memory sort.
messageSchema.index({ bookingId: 1, createdAt: -1, _id: -1 });

// The unread badge (§14). Ordered so the equality fields lead.
messageSchema.index({ bookingId: 1, read: 1, senderId: 1 });

// "Has this person written in this booking?" — the mandatory first message
// check (§7.1), which runs on every send. The index above has `read` between
// the two fields this needs, so it would scan rather than seek.
messageSchema.index({ bookingId: 1, senderId: 1 });

export const Message = mongoose.model('Message', messageSchema);

export default Message;
