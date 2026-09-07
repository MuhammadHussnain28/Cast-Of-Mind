import { Text } from '../ui'
import { ADMIN_NAV } from '../../data/adminNav'

/**
 * Stands in for a section the admin portal does not have yet.
 *
 * Says which chunk builds it and what will be here — an honest placeholder
 * rather than a blank pane or, worse, a screen of invented numbers that reads
 * as real data.
 */
export default function AdminSectionPlaceholder({ to }) {
  const section = ADMIN_NAV.find((item) => item.to === to)
  if (!section) return null

  return (
    <div className="max-w-measure rounded-2xl border border-ink/12 bg-mist px-5 py-6 sm:px-6 sm:py-7">
      <Text size="ui">{section.summary}</Text>
      <Text size="caption" tone="muted" className="mt-3">
        Not built yet — this section arrives in chunk {section.chunk}.
      </Text>
    </div>
  )
}
