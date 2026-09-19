import mongoose from 'mongoose';
import { NOTE_TEXT_MAX } from '../constants/journal.js';

/**
 * `privateNotes` — master spec §10.10. THE THERAPIST'S CLINICAL NOTES.
 *
 * NEVER VISIBLE TO THE CLIENT, AND THAT IS ARCHITECTURAL, NOT A FILTER.
 * This model is imported by exactly one service — `privateNotes.service.js` —
 * which is reached only from the `/api/v1/therapist` router. No client-facing
 * service, controller or route imports this file, and a test walks the client
 * request path's source to prove it. Its physical separation from `journals`
 * is the safety guarantee (§8.5/8.6), so do not merge them and do not join them.
 */

const privateNoteSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'A note must belong to a booking.'],
    },

    // Scoped per author, so one therapist can never read another's notes.
    therapistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A note must have an author.'],
    },

    text: {
      type: String,
      required: [true, 'A note needs some words.'],
      trim: true,
      minlength: [1, 'A note needs some words.'],
      maxlength: [NOTE_TEXT_MAX, `A note must be ${NOTE_TEXT_MAX} characters or fewer.`],
    },
  },
  {
    // §10.10 carries both stamps.
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Every read is "this therapist's notes on this booking", newest first.
privateNoteSchema.index({ bookingId: 1, therapistId: 1, createdAt: -1, _id: -1 });

export const PrivateNote = mongoose.model('PrivateNote', privateNoteSchema);

export default PrivateNote;
