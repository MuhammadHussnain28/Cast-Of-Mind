/**
 * Turns a Zod validation error into { fieldName: message }, so it can be
 * spread straight onto the `error` prop the Input/Textarea/Select components
 * already accept (see components/ui/Field.jsx).
 *
 * const result = schema.safeParse(values)
 * if (!result.success) setErrors(zodErrorsToFieldMap(result.error))
 */
export function zodErrorsToFieldMap(zodError) {
  const fieldErrors = {}
  for (const issue of zodError.issues) {
    const key = issue.path.join('.') || '_root'
    if (!fieldErrors[key]) fieldErrors[key] = issue.message
  }
  return fieldErrors
}
