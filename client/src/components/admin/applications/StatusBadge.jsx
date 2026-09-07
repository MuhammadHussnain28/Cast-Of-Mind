import { Badge } from '../../ui'

// Pending is the action item (§9.1), so it is the one that carries the accent.
// Approved and rejected are settled states and stay quiet.
const TONES = {
  pending: 'accent',
  approved: 'success',
  rejected: 'danger',
}

const LABELS = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
}

export default function StatusBadge({ status }) {
  return <Badge tone={TONES[status] ?? 'neutral'}>{LABELS[status] ?? status}</Badge>
}
