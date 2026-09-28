import { useEffect, useId, useRef, useState } from 'react'
import { Button, Text, Textarea } from '../../../ui'
import { StarShape, ThanksIcon, UnseenIcon } from '../../../reviews/ReviewMarks'
import { RATE } from '../../../../data/reviewContent'
import { declineReview, submitReview } from '../../../../lib/api/reviewsApi'
import { toApiError } from '../../../../lib/api/ApiError'
import { cx } from '../../../../lib/cx'

const STARS = [1, 2, 3, 4, 5]

/**
 * The end-of-subscription rating — master spec §9.6.
 *
 * OFFERED, NEVER ASKED FOR TWICE. It sits quietly on the ended screen (and on
 * Account while a cancelled plan runs out), nothing else on the page waits on
 * it, and once sent it simply thanks them in place — no confetti, no follow-up,
 * no reminder anywhere. A rating on its own is welcome; the words are optional.
 *
 * THE STARS ARE REAL RADIO BUTTONS, drawn over. Native radios give the group
 * its arrow keys, its single tab stop and its announcement ("4 of 5, radio,
 * selected") for free; the drawing is the label. Each label is a 48px target.
 *
 * The privacy line is the approved disclosure, stated before they write:
 * the Cast of Mind team reads it with their name, and their therapist never does.
 */
export default function RatingForm({ therapistName, heading, onSubmitted, className }) {
  const headingId = useId()
  const [stars, setStars] = useState(null)
  const [preview, setPreview] = useState(null)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)
  const [declining, setDeclining] = useState(false)
  const [declined, setDeclined] = useState(false)
  const declinedRef = useRef(null)

  const shown = preview ?? stars ?? 0

  // The card goes; focus lands on the quiet line left in its place, not the page top.
  useEffect(() => {
    if (declined) declinedRef.current?.focus()
  }, [declined])

  // 11.6: "No thanks" — never a wall. No reason asked, nothing else changes.
  async function decline() {
    if (declining || busy) return
    setDeclining(true)
    setError(null)
    try {
      await declineReview()
      setDeclined(true)
    } catch {
      setError(RATE.declineFailed)
      setDeclining(false)
    }
  }

  async function send(event) {
    event.preventDefault()
    if (!stars || busy) return

    setBusy(true)
    setError(null)

    try {
      await submitReview({ stars, text })
      setDone(true)
      onSubmitted?.()
    } catch (err) {
      const apiError = toApiError(err)
      // Sent already (a second tab, a double tap): the rating is in, so this is
      // the thank-you, not a failure.
      if (apiError.code === 'ALREADY_REVIEWED') {
        setDone(true)
        onSubmitted?.()
      } else {
        // Their words stay exactly where they were.
        // A 422 names the field problem ("keep it under 2,000 characters");
        // anything else gets the plain, reassuring failure line.
        setError(
          apiError.status === 422 ? (apiError.details?.[0]?.message ?? apiError.message) : RATE.failed,
        )
      }
    } finally {
      setBusy(false)
    }
  }

  if (declined) {
    return (
      <p
        ref={declinedRef}
        tabIndex={-1}
        aria-live="polite"
        className={cx('font-body text-caption text-ink/70 focus-visible:outline-none', className)}
      >
        {RATE.declined}
      </p>
    )
  }

  if (done) {
    return (
      <section
        aria-live="polite"
        className={cx('flex items-start gap-4 rounded-2xl bg-sage/10 px-5 py-5', className)}
      >
        <span
          aria-hidden="true"
          className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-paper text-sage-deep"
        >
          <ThanksIcon className="size-6" />
        </span>
        <div>
          <p className="font-body text-ui font-medium text-ink">{RATE.thanksTitle}</p>
          <Text size="caption" className="mt-1 text-ink/70">
            {RATE.thanksBody}
          </Text>
        </div>
      </section>
    )
  }

  return (
    <section aria-labelledby={headingId} className={className}>
      <h2 id={headingId} className="font-body text-ui font-medium text-ink">
        {heading ?? RATE.heading(therapistName)}
      </h2>
      <Text size="caption" className="mt-1.5 max-w-measure text-ink/70">
        {RATE.lead}
      </Text>

      <form onSubmit={send} className="mt-5 flex flex-col gap-5" noValidate>
        <fieldset>
          <legend className="sr-only">{RATE.legend}</legend>

          <div className="flex items-center gap-1" onMouseLeave={() => setPreview(null)}>
            {STARS.map((n) => {
              const lit = n <= shown

              return (
                <label
                  key={n}
                  onMouseEnter={() => setPreview(n)}
                  className={cx(
                    'group relative flex size-12 cursor-pointer items-center justify-center rounded-xl',
                    'transition-colors duration-150 ease-out hover:bg-mist',
                    // The radio is visually hidden, so its focus is drawn on the label.
                    'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2',
                    'has-[:focus-visible]:outline-solid has-[:focus-visible]:outline-ink-deep',
                  )}
                >
                  <input
                    type="radio"
                    name="stars"
                    value={n}
                    checked={stars === n}
                    onChange={() => setStars(n)}
                    className="sr-only"
                  />
                  <StarShape
                    filled={lit}
                    className={cx(
                      'size-8 transition-transform duration-150 ease-out',
                      'motion-safe:group-hover:scale-110',
                    )}
                  />
                  <span className="sr-only">{RATE.starLabel(n)}</span>
                </label>
              )
            })}
          </div>

          {/* The choice in words, so it never rests on the drawing alone. */}
          <p className="mt-2 font-body text-caption text-ink/70">
            {stars ? RATE.chosen(stars) : RATE.unchosen}
          </p>
        </fieldset>

        <Textarea
          label={RATE.wordsLabel}
          helper={RATE.wordsHelper}
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={4}
        />

        <p className="flex items-start gap-3 font-body text-caption text-ink/70">
          <UnseenIcon className="mt-0.5 size-5 shrink-0 text-sage-deep" />
          <span className="max-w-measure">{RATE.privacy}</span>
        </p>

        {error && (
          <Text size="ui" tone="error" role="alert">
            {error}
          </Text>
        )}

        {/* Send leads; "No thanks" sits beside it as quiet text — findable,
            never competing with the stars. */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Button type="submit" disabled={!stars} loading={busy}>
            {busy ? RATE.sending : RATE.send}
          </Button>
          <button
            type="button"
            onClick={decline}
            disabled={declining || busy}
            className="inline-flex min-h-11 items-center rounded-lg px-2 font-body text-ui text-ink/70 underline decoration-ink/60 underline-offset-4 transition-colors duration-200 ease-out hover:text-ink hover:decoration-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-progress"
          >
            {RATE.noThanks}
          </button>
        </div>
      </form>
    </section>
  )
}
