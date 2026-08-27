import { z } from 'zod';
import { MIN_PASSWORD_LENGTH, MAX_PASSWORD_BYTES } from '../utils/password.js';

// Input rules for the auth routes. The `validate` middleware replaces req.body
// with the parsed result, so the trim and lowercase below are what actually
// reach the service layer.

export const loginSchema = z.object({
  // Lowercased before the lookup, because `users.email` is stored lowercase.
  // Without this, "Asad@Example.com" would simply not be found and the user
  // would be told their password is wrong.
  email: z
    .string({ error: 'Enter your email address.' })
    .trim()
    .toLowerCase()
    .pipe(z.email('Enter a valid email address.')),

  // Only "not empty" is checked. No minimum length rule here on purpose: login
  // must accept whatever password the account already has. Enforcing a policy
  // at login would lock out existing users and quietly leak what the policy is.
  password: z
    .string({ error: 'Enter your password.' })
    .min(1, 'Enter your password.')
    .max(200, 'Password is too long.'),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string({ error: 'Enter your email address.' })
    .trim()
    .toLowerCase()
    .pipe(z.email('Enter a valid email address.')),
});

export const resetPasswordSchema = z.object({
  // 64 hex characters — 32 random bytes. Checked for shape here so obvious junk
  // never reaches a database query.
  token: z
    .string({ error: 'This reset link is not valid.' })
    .regex(/^[0-9a-f]{64}$/, 'This reset link is not valid.'),

  // Unlike login, a NEW password must satisfy the platform rule.
  //
  // The byte cap is not cosmetic: bcrypt silently truncates past 72 bytes, so
  // without it two different long passwords could hash identically. Measured in
  // bytes, not characters, because one emoji or accented letter costs several.
  password: z
    .string({ error: 'Enter a new password.' })
    .min(MIN_PASSWORD_LENGTH, `Use at least ${MIN_PASSWORD_LENGTH} characters.`)
    .refine(
      (value) => Buffer.byteLength(value, 'utf8') <= MAX_PASSWORD_BYTES,
      `Password is too long (maximum ${MAX_PASSWORD_BYTES} bytes).`,
    ),
});
