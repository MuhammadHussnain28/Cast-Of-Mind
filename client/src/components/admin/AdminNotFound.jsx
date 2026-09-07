import { Link } from 'react-router-dom'
import { Text } from '../ui'

/**
 * The public 404 cannot be reused inside the portal. It renders its own
 * <main> — and a document may only have one, so nesting it inside the admin
 * shell's main breaks the landmark a screen reader navigates by. It is also
 * full-viewport-height, and its only way out is the marketing homepage, which
 * is the wrong destination for someone working in the portal.
 */
export default function AdminNotFound() {
  return (
    <div className="max-w-measure rounded-2xl border border-ink/12 bg-mist px-5 py-6 sm:px-6 sm:py-7">
      <Text size="ui">There is no admin section at this address.</Text>
      <Text size="caption" tone="muted" className="mt-3">
        The link may be out of date, or the address slightly off.
      </Text>
      <Link
        to="/admin"
        className="mt-5 inline-flex min-h-11 items-center rounded-full bg-ink px-6 font-body text-caption font-medium text-paper transition-colors duration-200 ease-out hover:bg-ink-deep"
      >
        Back to the dashboard
      </Link>
    </div>
  )
}
