import mongoose from 'mongoose';
import { JOURNAL_TEXT_MAX, MOOD_TAG_MAX } from '../constants/journal.js';

// `journals` — master spec §10.9. Written by the client, always readable by
// their therapist (§7.3). This is NOT `privateNotes`; the two never meet.

const journalSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'An entry must belong to a booking.'],
    },

    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'An entry must have an author.'],
    },

    text: {
      type: String,
      required: [true, 'An entry needs some words.'],
      trim: true,
      minlength: [1, 'An entry needs some words.'],
      maxlength: [JOURNAL_TEXT_MAX, `An entry must be ${JOURNAL_TEXT_MAX} characters or fewer.`],
    },

    // Optional and free-form: eight presets on screen, or the client's own word.
    moodTag: {
      type: String,
      trim: true,
      maxlength: [MOOD_TAG_MAX, `A mood must be ${MOOD_TAG_MAX} characters or fewer.`],
      default: undefined,
    },

    // Spec addition (8.6, approved): the therapist sees an entry was changed.
    // There is deliberately no read stamp — the client never learns it was read.
    editedAt: { type: Date, default: undefined },
  },
  {
    // §10.9 names only the creation stamp.
    timestamps: { createdAt: 'createdAt', updatedAt: false },
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

// An empty mood is absent, never a stored empty string.
journalSchema.pre('validate', function normaliseMood() {
  if (typeof this.moodTag === 'string' && this.moodTag.trim() === '') this.moodTag = undefined;
});

// A booking's entries, newest first — the only read either portal makes.
journalSchema.index({ bookingId: 1, createdAt: -1, _id: -1 });

export const Journal = mongoose.model('Journal', journalSchema);

export default Journal;
