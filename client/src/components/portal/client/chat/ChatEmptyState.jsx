import { Heading, Text } from '../../../ui'
import { chat } from '../../../../data/chatContent'
import { OpenQuoteIcon } from './ChatIcons'

/**
 * Before anything has been written.
 *
 * §24.8: empty states are designed, never blank. This one explains what the
 * space is for and lowers the stakes — it does NOT instruct, and it does not
 * implement §7.1's mandatory first message, which is chunk 7.5 and replaces
 * this screen with the real opening flow.
 *
 * An open quote rather than a speech bubble: the screen is about someone's own
 * words, not about messaging as a feature.
 */
export default function ChatEmptyState({ therapistName }) {
  const who = therapistName ?? 'your therapist'

  return (
    <div className="flex min-h-full items-center justify-center px-6 py-12">
      <div className="max-w-measure text-center">
        <span
          aria-hidden="true"
          className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-sage/12 text-sage-deep"
        >
          <OpenQuoteIcon />
        </span>

        <Heading level={2} size="subsection" className="mt-5">
          {chat.empty.title}
        </Heading>

        <Text tone="muted" className="mx-auto mt-3">
          {chat.empty.body.replace('{name}', who)}
        </Text>

        <Text size="caption" tone="muted" className="mx-auto mt-4">
          {chat.empty.hint}
        </Text>
      </div>
    </div>
  )
}
