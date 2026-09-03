import { DAYS } from './validation/therapistApplication.js'

/**
 * Translate form state into the body POST /api/v1/therapist-applications wants.
 *
 * THIS FUNCTION EXISTS BECAUSE THE TWO SIDES DISAGREE ON TYPES, and every
 * disagreement here would surface as a 422 on a form the applicant filled in
 * perfectly:
 *
 *   - the yes/no questions are radio STRINGS in the form and BOOLEANS in the API
 *   - years of experience arrives from a number input as a STRING
 *   - empty optional uploads must be sent as '' , never as undefined
 *
 * Kept as a plain function with no React in it so it can be executed and tested
 * directly — this translation is exactly where a silent bug would live.
 */

const yesNoToBoolean = (value) => value === 'yes'

export function toApplicationPayload(form) {
  const workingHours = { note: form.workingHours?.note?.trim() ?? '' }

  for (const day of DAYS) {
    const entry = form.workingHours?.[day.key] ?? {}
    workingHours[day.key] = entry.enabled
      ? { enabled: true, start: entry.start, end: entry.end }
      : // A disabled day sends empty times rather than whatever was last typed,
        // so a stale value cannot fail the server's format check.
        { enabled: false, start: '', end: '' }
  }

  return {
    // Step 1
    title: form.title,
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    gender: form.gender,
    dateOfBirth: form.dateOfBirth,
    email: form.email.trim().toLowerCase(),
    password: form.password,
    photoUrl: form.photoUrl,

    // Step 2
    streetAddress: form.streetAddress.trim(),
    city: form.city.trim(),
    stateProvince: form.stateProvince.trim(),
    zipPostal: form.zipPostal.trim(),
    country: form.country.trim(),
    timezone: form.timezone.trim(),
    languages: form.languages,
    workingHours,

    // Step 3
    therapistType: form.therapistType.trim(),
    credentialType: form.credentialType,
    credentialInitials: form.credentialInitials.trim(),
    yearsExperience: Number(form.yearsExperience),
    educationSummary: form.educationSummary.trim(),
    currentWorkSituation: form.currentWorkSituation.trim(),
    licenseNumber: form.licenseNumber?.trim() ?? '',
    taxpayerIdNumber: form.taxpayerIdNumber?.trim() ?? '',

    // Step 4
    specialtyTags: form.specialtyTags,
    treatmentOrientations: form.treatmentOrientations,
    bio: form.bio.trim(),
    licensingStatus: form.licensingStatus.trim(),
    disciplinaryActions: yesNoToBoolean(form.disciplinaryActions),
    // Only sent when the answer is yes — a leftover value from a changed mind
    // must not travel with a "no".
    disciplinaryDetails:
      form.disciplinaryActions === 'yes' ? (form.disciplinaryDetails?.trim() ?? '') : '',

    // Step 5
    malpracticeInsurance: yesNoToBoolean(form.malpracticeInsurance),
    insuranceDetails: form.insuranceDetails?.trim() ?? '',
    certificateUrl1: form.certificateUrl1,
    certificatePublicId1: form.certificatePublicId1 ?? '',
    certificateUrl2: form.certificateUrl2 ?? '',
    certificatePublicId2: form.certificatePublicId2 ?? '',
    licenseDocUrl: form.licenseDocUrl ?? '',
    licenseDocPublicId: form.licenseDocPublicId ?? '',
  }
}

export default toApplicationPayload
