/** Join class names, skipping anything falsy. Keeps JSX readable. */
export function cx(...parts) {
  return parts.filter(Boolean).join(' ')
}
