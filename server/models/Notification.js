import mongoose from 'mongoose';
import {
  NOTIFICATION_TYPE_VALUES,
  RETENTION_SECONDS,
} from '../constants/notifications.js';

// `notifications` — the bell's feed. Master spec §10.13, §8.8.
//
// ONE OPEN ALERT PER CLIENT PER KIND, not one per event (approved 2026-09-23).
// A client sending twelve messages produces one row reading "12 new messages",
// not twelve rows — otherwise the bell becomes a wall of identical lines and
// simply repeats the sidebar badge, which is the one thing §8.8 is not for.
//
// `count` and `lastAt` are spec additions that make that grouping possible.

const notificationSchema = new mongoose.Schema(
  {
    // The recipient. In v1 this is always a therapist (approved): clients have
    // their own unread badge and worksheet dot, and §8.8 is a therapist feature.
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A notification must have a recipient.'],
    },

    type: {
      type: String,
      enum: {
        values: NOTIFICATION_TYPE_VALUES,
        message: `Type must be one of: ${NOTIFICATION_TYPE_VALUES.join(', ')}.`,
      },
      required: [true, 'A notification must have a type.'],
    },

    // Which relationship it belongs to — and what the bell navigates to.
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'A notification must belong to a booking.'],
    },

    read: { type: Boolean, default: false, required: true },

    // How many events this one alert stands for. Spec addition.
    count: {
      type: Number,
      default: 1,
      min: [1, 'A notification stands for at least one event.'],
      validate: { validator: Number.isInteger, message: 'Count must be a whole number.' },
    },

    // The most recent of them. Spec addition: the feed sorts by this, and the
    // TTL below expires from it, so a group still in use does not disappear.
    lastAt: { type: Date, default: Date.now, required: true },
  },
  {
    // §10.13 lists createdAt only — when the group opened.
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

// The feed, and the bell's unread count.
notificationSchema.index({ userId: 1, read: 1, lastAt: -1 });

/**
 * ONE OPEN GROUP PER RECIPIENT, BOOKING AND KIND.
 *
 * Partial on `read: false`, so read alerts stay as history and the next event
 * opens a fresh group. This is what makes the grouping upsert atomic: two
 * messages arriving together cannot both insert.
 */
notificationSchema.index(
  { userId: 1, bookingId: 1, type: 1 },
  { unique: true, partialFilterExpression: { read: false }, name: 'one_open_alert_per_kind' },
);

// Retention — see constants/notifications.js for why a TTL is safe here and was
// not in 1.3.
notificationSchema.index({ lastAt: 1 }, { expireAfterSeconds: RETENTION_SECONDS });

export const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
