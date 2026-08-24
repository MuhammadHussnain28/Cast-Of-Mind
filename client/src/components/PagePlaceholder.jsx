import Heading from './ui/Heading'
import Text from './ui/Text'

/**
 * Calm placeholder for a page whose real content is built in a later chunk.
 * Deliberately plain: with a real navbar and footer around it, a loud
 * placeholder would make the site look unfinished rather than in progress.
 */
export default function PagePlaceholder({ title, blurb, note }) {
  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-24 sm:px-8 lg:py-32">
      <Heading level={1} size="section" className="max-w-measure">
        {title}
      </Heading>
      <div className="mt-7 h-px w-14 bg-gold" aria-hidden="true" />
      {blurb && (
        <Text tone="muted" className="mt-7 max-w-measure">
          {blurb}
        </Text>
      )}
      {note && (
        <Text size="caption" tone="muted" className="mt-4 max-w-measure">
          {note}
        </Text>
      )}
    </div>
  )
}
