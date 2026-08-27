import mongoose from 'mongoose';
import { ROLE_VALUES, USER_STATUS, USER_STATUS_VALUES } from '../constants/roles.js';

// `users` — identity and login for every person on the platform, all three roles.
// Master spec Section 10.1.
//
// Deliberately small: it answers only "who is logging in, what is their password,
// what is their role". Role-specific detail lives in separate profile collections
// linked by userId, which keeps login queries fast and avoids one collection of
// wildly different-shaped documents.
//
// Records are created by the system, never by self-registration:
//   client    -> when the payment webhook confirms (four-document transaction)
//   therapist -> when an admin approves their application (two-document transaction)
//   admin     -> once, manually, via scripts/seedAdmin.js

// Basic shape check only. Deep email validation belongs to the request-validation
// layer; this exists so a malformed address cannot be written by a script that
// bypasses a route.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required.'],
      unique: true, // creates the unique index — see the note on init() below
      lowercase: true,
      trim: true,
      match: [EMAIL_PATTERN, 'Email must be a valid address.'],
    },

    // bcrypt hash only — a plaintext password is never stored, logged, or returned.
    // select: false keeps it out of every query result unless a caller explicitly
    // asks for it (login does: .select('+passwordHash')).
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required.'],
      select: false,
    },

    // Refresh token state lives directly on the user, not in its own collection —
    // confirmed by Asad (master spec Section 10.1). One active refresh session per
    // user: logging in on a new device overwrites this hash and silently ends the
    // previous session. Declared now so chunks 1.2/1.3 need no migration; nothing
    // in this chunk writes to either field.
    refreshTokenHash: {
      type: String,
      select: false,
      default: null,
    },

    refreshTokenExpiresAt: {
      type: Date,
      select: false,
      default: null,
    },

    // Password reset, added in chunk 1.5. NOT in master spec §10.1's original
    // 8-field list - recorded as a deliberate schema addition in docs/ongoing.md.
    // Placed on `users` for the same reason the refresh token is (decision #4):
    // a separate collection was already considered and rejected for that, and
    // one user can only have one live reset request anyway.
    //
    // Only the HASH is stored, so a database leak hands out no usable reset
    // links. Cleared the moment a reset succeeds, which is what makes the token
    // single-use.
    resetTokenHash: {
      type: String,
      select: false,
      default: null,
    },

    resetTokenExpiresAt: {
      type: Date,
      select: false,
      default: null,
    },

    role: {
      type: String,
      required: [true, 'Role is required.'],
      enum: {
        values: ROLE_VALUES,
        message: 'Role must be one of: {VALUES}.',
      },
    },

    status: {
      type: String,
      required: true,
      enum: {
        values: USER_STATUS_VALUES,
        message: 'Status must be one of: {VALUES}.',
      },
      default: USER_STATUS.ACTIVE,
    },
  },
  {
    // Provides createdAt and updatedAt, both stored in UTC by MongoDB.
    timestamps: true,

    toJSON: {
      // Second line of defence. select: false already keeps these out of normal
      // queries; this guarantees that even a document fetched WITH them selected
      // cannot leak a hash into a response body via res.json().
      transform(_doc, ret) {
        delete ret.passwordHash;
        delete ret.refreshTokenHash;
        delete ret.refreshTokenExpiresAt;
        delete ret.resetTokenHash;
        delete ret.resetTokenExpiresAt;
        delete ret.__v;
        return ret;
      },
    },
  },
);

// NOTE for anyone writing tests or a first-run script: `unique: true` above is a
// MongoDB INDEX, not a Mongoose validator. It is enforced by the database on
// write (error code 11000), and only once the index actually exists. Mongoose
// builds it in the background, so call `await User.init()` before relying on it
// in a fresh database — otherwise a duplicate insert can succeed and a test
// asserting rejection will pass for the wrong reason.

export const User = mongoose.model('User', userSchema);

export default User;
