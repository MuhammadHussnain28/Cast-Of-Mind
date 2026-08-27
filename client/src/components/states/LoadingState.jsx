import Spinner from '../ui/Spinner'
import Text from '../ui/Text'

/** min-h keeps the layout from collapsing to nothing while data loads. */
export default function LoadingState({ label = 'Loading…', className }) {
  return (
    <div
      role="status"
      className={`flex min-h-[40vh] flex-col items-center justify-center gap-3 ${className || ''}`}
    >
      <Spinner size="md" className="text-ink/60" />
      <Text size="caption" tone="muted">
        {label}
      </Text>
    </div>
  )
}
