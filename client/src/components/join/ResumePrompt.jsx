import { Heading, Text } from '../ui'
import { Clock } from './JoinIcons'

/**
 * Shown once, before the form, when a saved draft exists.
 *
 * A CHOICE, not a silent restore. Repopulating thirty fields without asking is
 * presumptuous on any shared computer, and it hides the one thing the applicant
 * needs to know — that their password was deliberately not saved.
 */

function savedAgo(savedAt) {
  if (!savedAt) return null

  const minutes = Math.floor((Date.now() - savedAt) / 60000)
  if (minutes < 1) return 'a moment ago'
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`

  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

export default function ResumePrompt({ draft, onResume, onStartFresh }) {
  const stepLabel = draft?.step ? `step ${draft.step} of 5` : null
  const when = savedAgo(draft?.savedAt)

  return (
    <div>
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-mist text-ink">
        <Clock className="h-5 w-5" />
      </span>

      <Heading level={2} size="subsection" className="mt-5 text-ink">
        You have an application in progress
      </Heading>

      <Text tone="muted" className="mt-2 max-w-measure text-sm">
        We saved what you had filled in
        {when ? ` ${when}` : ''}
        {stepLabel ? `, up to ${stepLabel}` : ''}. Pick up where you left off, or clear it and
        begin again.
      </Text>

      <p className="mt-4 max-w-measure rounded-xl bg-mist p-4 font-body text-caption leading-relaxed text-ink/70">
        Your password was <strong className="font-medium text-ink">not</strong> saved, so you will
        need to choose it again. We never keep a password in your browser.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onResume}
          className="inline-flex min-h-11 items-center rounded-xl border border-ink/50 bg-gold px-6 font-body text-ui font-medium text-ink transition-[filter] duration-200 hover:brightness-95"
        >
          Resume my application
        </button>

        <button
          type="button"
          onClick={onStartFresh}
          className="inline-flex min-h-11 items-center rounded-xl border border-ink/50 px-6 font-body text-ui text-ink transition-colors duration-200 hover:bg-mist"
        >
          Start fresh
        </button>
      </div>
    </div>
  )
}
