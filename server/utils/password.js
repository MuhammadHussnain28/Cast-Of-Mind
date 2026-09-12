import crypto from 'node:crypto';
import bcrypt from 'bcrypt';

// bcrypt password hashing — master spec Sections 11 and 18.
//
// PRIVACY RULE: nothing in this file may ever log, print, or return a plaintext
// password, and no caller should either. Hashes are one-way; the only recovery
// path is reset, never retrieval.

// Cost factor. The spec mandates bcrypt but does not name a cost — 12 is the
// current sane default (~250ms per hash on typical hardware), slow enough to
// make offline brute-forcing expensive, fast enough not to stall a login.
export const BCRYPT_COST = 12;

// bcrypt silently truncates input beyond 72 BYTES (not characters — a multi-byte
// character eats several). Two passwords sharing their first 72 bytes would hash
// identically, so length must be capped at the validation layer rather than
// discovered here. Exported for the schemas in later auth chunks to enforce.
export const MAX_PASSWORD_BYTES = 72;

// Minimum length for any password this system sets, for EVERY role including
// admin. Developer's decision, 2026-08-24: one universal rule rather than a
// role-aware one, chosen for simplicity and predictability.
//
// 8 is the NIST floor. Deliberately NO complexity rules and NO common-password
// blocklist - also the developer's call, for user freedom.
//
// Everything reads from this one constant: the admin seed script, password
// reset, and the therapist application form in slice 3. Change it here and the
// whole platform follows.
//
// Only checked when a password is being SET. Existing passwords are untouched,
// and login never re-applies the rule.
export const MIN_PASSWORD_LENGTH = 8;

/**
 * Hash a plaintext password for storage.
 * @param {string} plain
 * @returns {Promise<string>} bcrypt hash, safe to persist
 */
export async function hashPassword(plain) {
  if (typeof plain !== 'string' || plain.length === 0) {
    // Message deliberately describes the failure without echoing the value.
    throw new TypeError('Password to hash must be a non-empty string.');
  }

  return bcrypt.hash(plain, BCRYPT_COST);
}

/**
 * Compare a plaintext password against a stored hash.
 *
 * Returns false rather than throwing on malformed or missing input, so a
 * corrupt/absent hash in the database fails the login cleanly instead of
 * surfacing a 500 that would tell an attacker the record is unusual.
 *
 * @param {string} plain
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
export async function comparePassword(plain, hash) {
  if (typeof plain !== 'string' || typeof hash !== 'string' || plain.length === 0 || hash.length === 0) {
    return false;
  }

  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    // bcrypt throws on an unparseable hash string. Treat it as "does not match".
    return false;
  }
}

/**
 * A temporary password for a newly paid client.
 *
 * A client never chooses a password — there is no password field anywhere in
 * the questionnaire, because no account exists until the money does (§12). So
 * one is generated here and emailed to them (§16: "Welcome + login credentials").
 *
 * `crypto.randomInt` rather than `randomBytes % length`: the modulo version is
 * biased toward the first characters of the alphabet whenever 256 does not
 * divide evenly, which quietly shrinks the keyspace.
 *
 * The alphabet omits characters that are misread when copied out of an email —
 * 0/O, 1/l/I — because this password is read by a person, not a machine.
 *
 * NEVER LOG THE RETURN VALUE. It is a live credential until the client changes
 * it, and it exists in exactly two places: the email, and the bcrypt hash.
 */
const TEMPORARY_PASSWORD_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

// 16 characters of a 55-character alphabet is about 92 bits of entropy — far
// beyond anything guessable, and still short enough to retype by hand.
export const TEMPORARY_PASSWORD_LENGTH = 16;

export function generateTemporaryPassword(length = TEMPORARY_PASSWORD_LENGTH) {
  let password = '';

  for (let i = 0; i < length; i += 1) {
    password += TEMPORARY_PASSWORD_ALPHABET[
      crypto.randomInt(TEMPORARY_PASSWORD_ALPHABET.length)
    ];
  }

  return password;
}
