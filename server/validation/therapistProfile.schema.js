import { z } from 'zod';
import { BIO_MAX } from '../constants/therapistProfile.js';

/**
 * The therapist's own profile edit — §8.7.
 *
 * `.strict()` is the entire security property of this schema. Without it, a
 * request carrying `specialtyTags` would have that field silently dropped and
 * the therapist told the save succeeded — while the tags that decide who is
 * matched with them stayed admin-verified but the sender believed otherwise.
 * Refusing names the field instead.
 *
 * The chunk brief calls this out as CRITICAL and it is: hiding a field in the
 * UI is not access control.
 */
export const updateOwnProfileSchema = z
  .object({
    // Checked for shape here; checked for ORIGIN in the service, because a URL
    // pointing anywhere but our own Cloudinary account would be loaded by every
    // client who sees this therapist on the matching page.
    photoUrl: z.string().trim().min(1, 'A photo is required.'),
    bio: z
      .string()
      .trim()
      .min(1, 'Write a short bio — clients read this when choosing a therapist.')
      .max(BIO_MAX, `Keep your bio under ${BIO_MAX} characters.`),
  })
  .partial()
  .strict();
