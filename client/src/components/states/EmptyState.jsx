import Heading from '../ui/Heading'
import Text from '../ui/Text'

/**
 * Deliberately plain — §24.8: empty states are designed, never blank, but
 * stay honest and plain. No motivational copy, no gamification, no
 * "get started" prompts invented here. The therapist portal's minimal empty
 * state ("No clients yet…") is the model this follows.
 */
export default function EmptyState({ title, description, action, className }) {
  return (
    <div className={`flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center ${className || ''}`}>
      <Heading level={3} size="subsection" className="text-ink">
        {title}
      </Heading>
      {description && (
        <Text tone="muted" className="max-w-measure">
          {description}
        </Text>
      )}
      {action}
    </div>
  )
}
