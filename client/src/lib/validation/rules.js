import { z } from 'zod'

/**
 * Only universally reusable pieces live here — not a loginSchema or a
 * questionnaireSchema. Those belong to the chunks that build those forms;
 * inventing them now would be building ahead of the fields they cover.
 */

export const emailField = z.string().trim().min(1, 'Enter an email address.').email(
  'Enter a valid email address.',
)

export function requiredString(label, { min = 1, max } = {}) {
  let schema = z.string().trim().min(min, `${label} is required.`)
  if (max) {
    schema = schema.max(max, `${label} must be ${max} characters or fewer.`)
  }
  return schema
}
