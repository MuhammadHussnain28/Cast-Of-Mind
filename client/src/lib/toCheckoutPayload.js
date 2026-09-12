/**
 * Questionnaire answers → the shape POST /checkout/create-session expects.
 *
 * THE ONE SHAPE DIFFERENCE THIS FLOW HAS, carried in docs/ongoing.md since
 * chunk 5.3: the Redux slice holds `partner1` / `partner2` FLAT, because that
 * is what a form binds to. The API nests them under `coupleData`, because that
 * is how §10.2 stores them. Chunk 6.2's schema is `.strict()`-adjacent on the
 * branch guard, so a couple sent flat is a 422 every single time.
 *
 * Kept free of React so it can be executed directly against the real server
 * schema — the same reason `toApplicationPayload` exists for the therapist form,
 * where exactly this class of mismatch shipped in chunk 3.5.
 */

const trim = (value) => (typeof value === 'string' ? value.trim() : value)

/** A number input hands back a string. The API wants a number. */
const toAge = (value) => {
  const age = Number(value)
  return Number.isFinite(age) ? age : value
}

const partner = (source = {}) => ({
  name: trim(source.name),
  age: toAge(source.age),
  gender: source.gender,
})

export function toCheckoutPayload(answers, therapistProfileId) {
  const shared = {
    type: answers.type,
    country: trim(answers.country),
    city: trim(answers.city),
    relationshipStatus: answers.relationshipStatus,
    concernTags: [...(answers.concernTags ?? [])],
    therapistGenderPreference: answers.therapistGenderPreference,
  }

  // Each branch carries ITS OWN fields and NOT the other's. A payload holding
  // both is one the server cannot resolve, and its branch guard rejects it.
  const questionnaire =
    answers.type === 'couple'
      ? {
          ...shared,
          coupleData: {
            partner1: partner(answers.partner1),
            partner2: partner(answers.partner2),
          },
        }
      : {
          ...shared,
          name: trim(answers.name),
          age: toAge(answers.age),
          gender: answers.gender,
        }

  return {
    // Lowercased server-side too, but doing it here means the address shown on
    // the review screen is the address that becomes the login.
    email: trim(answers.email)?.toLowerCase(),
    therapistProfileId,
    questionnaire,
  }
}

export default toCheckoutPayload
