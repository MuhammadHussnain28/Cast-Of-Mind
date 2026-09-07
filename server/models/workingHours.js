import mongoose from 'mongoose';

// The structured availability grid, shared by therapistApplications (§10.4) and
// therapistProfiles (§10.3).
//
// Extracted in chunk 4.3 rather than copied. The approval flow builds a profile
// from an application, so the two shapes must agree exactly — and a duplicated
// forty-line validator is precisely the sort of thing that drifts once and then
// silently accepts a week on one model that the other would reject.

export const DAYS = Object.freeze([
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]);

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/; // 24-hour HH:MM

// Times are wall-clock strings in the therapist's own timezone (stored
// separately as an IANA identifier), NOT timestamps — so the UTC storage rule
// does not apply here. "09:00 on Mondays" is a recurring local intention, not a
// moment in time.
const daySchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: false },
    start: { type: String, default: null },
    end: { type: String, default: null },
  },
  { _id: false },
);

const dayFields = DAYS.reduce((fields, day) => {
  fields[day] = { type: daySchema, default: () => ({}) };
  return fields;
}, {});

export const workingHoursSchema = new mongoose.Schema(
  {
    ...dayFields,
    // Free text escape hatch, so no therapist is blocked by a rigid grid —
    // overnight availability, alternating weeks, "by arrangement".
    note: { type: String, trim: true, maxlength: 500, default: '' },
  },
  { _id: false },
);

/**
 * Document-level validation, because these checks span several fields at once.
 *
 * Call from a `pre('validate')` hook with the document as `this`.
 */
export function validateWorkingHours(doc) {
  const hours = doc.workingHours;

  if (!hours) {
    doc.invalidate('workingHours', 'Working hours are required.');
    return;
  }

  const enabledDays = DAYS.filter((day) => hours[day]?.enabled);

  if (enabledDays.length === 0) {
    doc.invalidate('workingHours', 'Select at least one day you are available.');
    return;
  }

  for (const day of enabledDays) {
    const { start, end } = hours[day];

    if (!TIME_PATTERN.test(start ?? '') || !TIME_PATTERN.test(end ?? '')) {
      doc.invalidate(
        `workingHours.${day}`,
        `Enter a start and end time for ${day} in 24-hour format, for example 09:00.`,
      );
      continue;
    }

    // Rejecting end <= start catches the common typo. Availability that
    // genuinely crosses midnight goes in the note field, and the message says
    // so rather than leaving the applicant stuck.
    if (end <= start) {
      doc.invalidate(
        `workingHours.${day}`,
        `End time must be after start time on ${day}. For hours that cross midnight, use the notes field.`,
      );
    }
  }
}
