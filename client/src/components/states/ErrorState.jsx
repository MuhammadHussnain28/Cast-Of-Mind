import Button from '../ui/Button'
import Text from '../ui/Text'

/**
 * `message` should already be a safe, user-facing string — ApiError's
 * `.message` is built for exactly this, never a raw error or stack trace.
 */
export default function ErrorState({
  message = 'Something went wrong. Please try again.',
  onRetry,
  className,
}) {
  return (
    <div
      role="alert"
      className={`flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center ${className || ''}`}
    >
      <Text tone="error" className="max-w-measure">
        {message}
      </Text>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}
