import { forwardRef } from 'react'
import { Heading, Text } from '../ui'

/**
 * One screen: the question, one line of reassurance, the answer.
 *
 * No eyebrow above the heading. The step label already sits in the progress
 * panel, so a second copy of it would be a label the heading does not need.
 *
 * The heading takes focus on each step change, which is why it accepts a ref
 * and carries tabIndex -1.
 */
const QuestionScreen = forwardRef(function QuestionScreen(
  { heading, reassurance, marker, children },
  ref,
) {
  return (
    <div>
      <Heading
        level={1}
        size="section"
        ref={ref}
        tabIndex={-1}
        className="max-w-measure focus-visible:outline-none"
      >
        {heading}
      </Heading>

      {/* Below the heading, never above it — see ScopeMarker. */}
      {marker}

      {reassurance && (
        <Text tone="muted" className="mt-4 max-w-measure">
          {reassurance}
        </Text>
      )}

      <div className="mt-9">{children}</div>
    </div>
  )
})

export default QuestionScreen
