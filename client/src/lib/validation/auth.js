import { z } from 'zod'
import { emailField } from './rules'

/**
 * Client-side rules for the auth forms.
 *
 * These exist to catch a typo before a round trip, NOT to protect anything.
 * The server validates every field again — a browser can be edited by whoever
 * is using it, so frontend validation is a convenience and never a control
 * (master spec §18: validate on both sides, trust neither alone).
 */

export const loginSchema = z.object({
  email: emailField,
  // Only "did you type anything". No length rule on login: it must accept
  // whatever password the account already has, and a rule here would lock out
  // existing users while quietly announcing what the policy is.
  password: z.string().min(1, 'Enter your password.'),
})

export const forgotPasswordSchema = z.object({
  email: emailField,
})

// Mirrors the server's rule (server/utils/password.js): at least 8
// characters, at most 72 bytes.
export const MIN_PASSWORD_LENGTH = 8

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(MIN_PASSWORD_LENGTH, `Use at least ${MIN_PASSWORD_LENGTH} characters.`)
      .refine(
        (value) => new TextEncoder().encode(value).length <= 72,
        'That password is too long. Try a shorter one.',
      ),
    confirmPassword: z.string().min(1, 'Type your new password again.'),
  })
  // Not a server rule — the server never sees this field. It is here because
  // the person cannot see what they typed, and getting it wrong would lock
  // them out of an account they were in the middle of recovering.
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'These do not match. Check both boxes.',
  })
