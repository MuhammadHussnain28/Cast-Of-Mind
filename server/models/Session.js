import mongoose from 'mongoose';
import {
  SESSION_STATUS,
  SESSION_STATUS_VALUES,
  SESSION_NOTE_MAX,
  MEETING_LINK_MAX,
  MEETING_LINK_MESSAGE,
} from '../constants/sessions.js';
import { isAllowedMeetingLink } from '../utils/meetingLink.js';

// `sessions` — master spec §10.11. `scheduledAt` is a UTC instant; no local time is stored.
// Spec additions: `updatedAt`, `cancelledAt` (9.1); `countedAt`, `notHeldAt` (9.5);
// `timeSetAt` and `reminders` (9.6).

// One reminder's record (9.6). `for` is the session time it was sent about, so a
// moved session is reminded about again and an unmoved one never twice.
const reminderSchema = new mongoose.Schema(
  {
    for: { type: Date, required: true },
    claimedAt: { type: Date, required: true },
    clientSentAt: { type: Date, default: undefined },
    therapistSentAt: { type: Date, default: undefined },
  },
  { _id: false },
);

const sessionSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'A session must belong to a booking.'],
    },

    scheduledAt: {
      type: Date,
      required: [true, 'A session needs a date and time.'],
    },

    // Named per §10.11; also holds Google Meet links (decision 2026-09-19).
    // Holds the meeting passcode, so it is never logged.
    zoomLink: {
      type: String,
      required: [true, 'A session needs a meeting link.'],
      trim: true,
      maxlength: [MEETING_LINK_MAX, MEETING_LINK_MESSAGE],
      validate: { validator: isAllowedMeetingLink, message: MEETING_LINK_MESSAGE },
    },

    // Visible to the client (decision 2026-09-19). Clinical thoughts belong in privateNotes.
    note: {
      type: String,
      trim: true,
      maxlength: [SESSION_NOTE_MAX, `A note must be ${SESSION_NOTE_MAX} characters or fewer.`],
      default: undefined,
    },

    status: {
      type: String,
      enum: {
        values: SESSION_STATUS_VALUES,
        message: `Status must be one of: ${SESSION_STATUS_VALUES.join(', ')}.`,
      },
      default: SESSION_STATUS.SCHEDULED,
      required: true,
    },

    cancelledAt: { type: Date, default: undefined },

    // When completion took one of the client's sessions (9.5). Absent if it
    // completed with none left, so "didn't take place" never restores a credit
    // that was never taken.
    countedAt: { type: Date, default: undefined },

    // Marked by the therapist as not having taken place (9.5); status is cancelled.
    notHeldAt: { type: Date, default: undefined },

    // When the CURRENT time was set (9.6). A reminder is only sent if the session
    // was on the calendar at least that reminder's notice ahead of it.
    timeSetAt: { type: Date, default: Date.now },

    reminders: {
      day: { type: reminderSchema, default: undefined },
      hour: { type: reminderSchema, default: undefined },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

sessionSchema.pre('validate', function checkCancellation() {
  const cancelled = this.status === SESSION_STATUS.CANCELLED;
  if (cancelled && !this.cancelledAt) {
    this.invalidate('cancelledAt', 'A cancelled session must record when it was cancelled.');
  }
  if (!cancelled && this.cancelledAt) {
    this.invalidate('cancelledAt', 'Only a cancelled session can carry a cancellation date.');
  }
  if (this.notHeldAt && !cancelled) {
    this.invalidate('notHeldAt', 'Only a session marked as not held can carry that date.');
  }
  if (this.countedAt && this.status !== SESSION_STATUS.COMPLETED) {
    this.invalidate('countedAt', 'Only a completed session counts against the client.');
  }
});

// A booking's sessions in time order, both directions — upcoming and history.
sessionSchema.index({ bookingId: 1, scheduledAt: 1, _id: 1 });
// The reminder sweep (9.6) runs every 5 minutes across ALL bookings (12.4).
sessionSchema.index({ status: 1, scheduledAt: 1 });

export const Session = mongoose.model('Session', sessionSchema);

export default Session;
