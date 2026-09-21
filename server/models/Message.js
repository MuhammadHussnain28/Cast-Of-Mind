import mongoose from 'mongoose';
import {
  MESSAGE_TYPE,
  MESSAGE_TYPE_VALUES,
  MESSAGE_TEXT_MAX,
  SESSION_NOTICE_EVENT,
  SESSION_NOTICE_EVENT_VALUES,
} from '../constants/chat.js';

// A session notice's data (9.3). Times are UTC instants, formatted by each reader.
const sessionNoticeSchema = new mongoose.Schema(
  {
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
    event: {
      type: String,
      required: true,
      enum: {
        values: SESSION_NOTICE_EVENT_VALUES,
        message: `Event must be one of: ${SESSION_NOTICE_EVENT_VALUES.join(', ')}.`,
      },
    },
    scheduledAt: { type: Date, required: true },
    previousScheduledAt: { type: Date, default: undefined },
  },
  { _id: false },
);

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

    // Spec addition (9.3): the data behind a session notice. System messages only.
    session: { type: sessionNoticeSchema, default: undefined },
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

// A person's message never carries session data; a platform notice always does.
messageSchema.pre('validate', function checkSessionNotice() {
  const system = this.type === MESSAGE_TYPE.SYSTEM;
  if (!system && this.session) {
    this.invalidate('session', 'Only a system message can carry session data.');
  }
  if (system && !this.session) {
    this.invalidate('session', 'A system message must carry its session data.');
  }
  if (
    this.session?.previousScheduledAt &&
    this.session.event !== SESSION_NOTICE_EVENT.RESCHEDULED
  ) {
    this.invalidate('session', 'Only a moved session has a previous time.');
  }
});

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
