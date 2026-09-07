import mongoose from 'mongoose';
import {
  CLIENT_TYPE,
  CLIENT_TYPE_VALUES,
  CLIENT_GENDERS,
  THERAPIST_GENDER_PREFERENCE_VALUES,
  RELATIONSHIP_STATUSES,
  CONCERN_TAGS,
  CONCERN_TAGS_MIN,
  CONCERN_TAGS_MAX,
  MIN_CLIENT_AGE,
  MAX_CLIENT_AGE,
  CLIENT_NAME_MAX,
  CLIENT_PLACE_MAX,
} from '../constants/clientProfile.js';
import { fixedListValidator } from './fixedListValidator.js';

// `clientProfiles` — a client's questionnaire answers. Master spec §10.2.
//
// CREATED ONLY BY THE PAYMENT WEBHOOK (slice 6), inside the four-document
// transaction with `users`, `bookings` and `subscriptions`. Nothing writes this
// collection yet; the questionnaire holds its answers in the browser until
// payment is confirmed, because an account must never exist before the money is.
//
// A COUPLE IS ONE PROFILE, NOT TWO (§6, confirmed by Asad). One users record,
// one clientProfile carrying both partners, one booking, one subscription. That
// is why partner data nests here instead of becoming a second document.
//
// THERE IS DELIBERATELY NO `email` FIELD. §6 lists email as a questionnaire
// question, but §10.2 has no field for it and email belongs to `users` — one
// address, one account, one unique index. The questionnaire carries it in
// browser state through to checkout, and it lands on `users` at payment.

const partnerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Each partner needs a name.'],
      trim: true,
      maxlength: [CLIENT_NAME_MAX, `Name must be ${CLIENT_NAME_MAX} characters or fewer.`],
    },
    age: {
      type: Number,
      required: [true, 'Each partner needs an age.'],
      min: [MIN_CLIENT_AGE, `Age must be at least ${MIN_CLIENT_AGE}.`],
      max: [MAX_CLIENT_AGE, `Age must be ${MAX_CLIENT_AGE} or under.`],
      validate: {
        validator: Number.isInteger,
        message: 'Age must be a whole number.',
      },
    },
    gender: {
      type: String,
      required: [true, 'Each partner needs a gender.'],
      enum: { values: CLIENT_GENDERS, message: 'Gender must be one of: {VALUES}.' },
    },
  },
  { _id: false },
);

const coupleDataSchema = new mongoose.Schema(
  {
    partner1: { type: partnerSchema, required: [true, 'Partner 1 details are required.'] },
    partner2: { type: partnerSchema, required: [true, 'Partner 2 details are required.'] },
  },
  { _id: false },
);

const clientProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A client profile must belong to a user.'],
      unique: true, // one profile per account — a couple shares the one account
    },

    type: {
      type: String,
      required: [true, 'Tell us whether this is for an individual or a couple.'],
      enum: { values: CLIENT_TYPE_VALUES, message: 'Type must be one of: {VALUES}.' },
    },

    // Collected for records and for showing session times in the right zone.
    // NEVER a matching filter — §15 is explicit that country and timezone do
    // not narrow who a client can be matched with.
    country: {
      type: String,
      required: [true, 'Country is required.'],
      trim: true,
      maxlength: CLIENT_PLACE_MAX,
    },

    city: {
      type: String,
      required: [true, 'City is required.'],
      trim: true,
      maxlength: CLIENT_PLACE_MAX,
    },

    relationshipStatus: {
      type: String,
      required: [true, 'Relationship status is required.'],
      enum: { values: RELATIONSHIP_STATUSES, message: 'Relationship status must be one of: {VALUES}.' },
    },

    // THE ONLY FIELD THAT DRIVES MATCHING (§15). Overlap with a therapist's
    // specialtyTags is the entire mechanism. Stored 1–4; the screen asks for 3–4.
    concernTags: {
      type: [String],
      required: true,
      validate: fixedListValidator({
        allowed: CONCERN_TAGS,
        min: CONCERN_TAGS_MIN,
        max: CONCERN_TAGS_MAX,
        label: 'concerns',
      }),
    },

    // A soft sort, never a filter. Preferred-gender therapists appear first and
    // everyone else still appears below (§15) — this must not hide anyone.
    therapistGenderPreference: {
      type: String,
      required: [true, 'A therapist gender preference is required.'],
      enum: {
        values: THERAPIST_GENDER_PREFERENCE_VALUES,
        message: 'Therapist gender preference must be one of: {VALUES}.',
      },
    },

    // ---------- Individual only ----------
    name: { type: String, trim: true, maxlength: CLIENT_NAME_MAX },
    age: {
      type: Number,
      min: [MIN_CLIENT_AGE, `Age must be at least ${MIN_CLIENT_AGE}.`],
      max: [MAX_CLIENT_AGE, `Age must be ${MAX_CLIENT_AGE} or under.`],
      validate: {
        validator: (value) => value == null || Number.isInteger(value),
        message: 'Age must be a whole number.',
      },
    },
    gender: {
      type: String,
      enum: { values: CLIENT_GENDERS, message: 'Gender must be one of: {VALUES}.' },
    },

    // ---------- Couple only ----------
    // `default: undefined` so an individual profile genuinely has no coupleData,
    // rather than an empty object Mongoose invented.
    coupleData: { type: coupleDataSchema, default: undefined },
  },
  {
    // §10.2 lists createdAt only.
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

/**
 * The branch guard.
 *
 * Each shape must carry ITS OWN fields and NOT the other's. Rejecting a document
 * that holds both is the point: a profile with a `name` and a `coupleData` is one
 * where nobody can say which is true, and every screen reading it would have to
 * guess. The questionnaire keeps both branches' answers while someone switches
 * back and forth; only the active branch is ever sent.
 */
clientProfileSchema.pre('validate', function checkBranchShape() {
  const isCouple = this.type === CLIENT_TYPE.COUPLE;
  const isIndividual = this.type === CLIENT_TYPE.INDIVIDUAL;

  if (isIndividual) {
    if (!this.name) this.invalidate('name', 'Name is required for an individual.');
    if (this.age == null) this.invalidate('age', 'Age is required for an individual.');
    if (!this.gender) this.invalidate('gender', 'Gender is required for an individual.');
    if (this.coupleData != null) {
      this.invalidate('coupleData', 'An individual profile must not carry couple details.');
    }
  }

  if (isCouple) {
    if (this.coupleData == null) {
      this.invalidate('coupleData', 'Details for both partners are required for a couple.');
    }
    if (this.name || this.age != null || this.gender) {
      this.invalidate(
        'type',
        'A couple profile must not carry individual details — both partners live in coupleData.',
      );
    }
  }
});

// Admin client list (chunk 10.1): newest first.
clientProfileSchema.index({ createdAt: -1 });

export const ClientProfile = mongoose.model('ClientProfile', clientProfileSchema);

export default ClientProfile;
