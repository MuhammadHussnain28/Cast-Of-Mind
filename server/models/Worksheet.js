import mongoose from 'mongoose';
import {
  WORKSHEET_STATUS,
  WORKSHEET_STATUS_VALUES,
  WORKSHEET_TITLE_MAX,
  WORKSHEET_FILE_FORMATS,
} from '../constants/worksheets.js';

// `worksheets` — master spec §10.8. File upload/download only (§7.2).
// Storage ids sit beside each URL (as 3.1 did) so files can be signed and deleted.
// The URLs and public ids never leave the server; see services/worksheet.service.js.

const fileFields = (prefix) => ({
  [`${prefix}FileUrl`]: { type: String, default: undefined },
  [`${prefix}FilePublicId`]: { type: String, default: undefined },
  [`${prefix}FileResourceType`]: { type: String, default: undefined },
  [`${prefix}FileFormat`]: {
    type: String,
    enum: { values: WORKSHEET_FILE_FORMATS, message: `Format must be one of: ${WORKSHEET_FILE_FORMATS.join(', ')}.` },
    default: undefined,
  },
  [`${prefix}FileBytes`]: { type: Number, min: 0, default: undefined },
});

const worksheetSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'A worksheet must belong to a booking.'],
    },

    title: {
      type: String,
      required: [true, 'A worksheet needs a title.'],
      trim: true,
      minlength: [1, 'A worksheet needs a title.'],
      maxlength: [WORKSHEET_TITLE_MAX, `A title must be ${WORKSHEET_TITLE_MAX} characters or fewer.`],
    },

    ...fileFields('assigned'),
    ...fileFields('completed'),

    status: {
      type: String,
      enum: {
        values: WORKSHEET_STATUS_VALUES,
        message: `Status must be one of: ${WORKSHEET_STATUS_VALUES.join(', ')}.`,
      },
      default: WORKSHEET_STATUS.ASSIGNED,
      required: true,
    },

    completedAt: { type: Date, default: undefined },

    // Spec addition (8.5): set by the therapist; ends the client's chance to replace.
    reviewedAt: { type: Date, default: undefined },
  },
  {
    // §10.8 names the creation stamp `assignedAt`.
    timestamps: { createdAt: 'assignedAt', updatedAt: false },
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

// A record nobody can read confidently is refused at write time.
worksheetSchema.pre('validate', function checkShape() {
  if (!this.assignedFileUrl || !this.assignedFilePublicId) {
    this.invalidate('assignedFileUrl', 'A worksheet must have its file.');
  }

  const hasCompletedFile = Boolean(this.completedFileUrl && this.completedFilePublicId);

  if (this.status === WORKSHEET_STATUS.COMPLETED && (!hasCompletedFile || !this.completedAt)) {
    this.invalidate('completedFileUrl', 'A completed worksheet must have the returned file and its date.');
  }

  if (this.reviewedAt && this.status !== WORKSHEET_STATUS.COMPLETED) {
    this.invalidate('reviewedAt', 'Only a returned worksheet can be reviewed.');
  }

  if (this.status === WORKSHEET_STATUS.ASSIGNED && (this.completedFileUrl || this.completedAt)) {
    this.invalidate('completedFileUrl', 'An assigned worksheet cannot carry a returned file yet.');
  }
});

// A booking's worksheets, newest first — the workspace list.
worksheetSchema.index({ bookingId: 1, assignedAt: -1, _id: -1 });

export const Worksheet = mongoose.model('Worksheet', worksheetSchema);

export default Worksheet;
