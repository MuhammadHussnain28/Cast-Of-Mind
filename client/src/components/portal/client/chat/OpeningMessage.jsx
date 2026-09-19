import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { cx } from '../../../../lib/cx'
import { Heading, Text } from '../../../ui'
import { opening } from '../../../../data/chatContent'
import { SendIcon } from '../../chat/ChatIcons'

/**
 * The mandatory first message — master spec §7.1.
 *
 * "Before normal chat begins, the client must send an opening message
 * describing their feelings, emotions, current experience and challenges.
 * This is FREE TEXT (not a structured form) — deliberately, to let them
 * express themselves naturally."
 *
 * SO THIS MUST NOT READ AS A FORM. It is the first thing somebody says to the
 * person who will help them, and the design says that rather than describing
 * it: the therapist's face is the first thing on the screen, the writing area
 * is a page rather than an input, and §7.1's four prompts appear as one
 * sentence of prose that can be ignored entirely — four labelled prompts would
 * be a form wearing different clothes.
 *
 * FRAUNCES IS USED HERE, and nowhere else in either portal. §24.3 permits it at
 * display sizes; chunk 4.1 banned it from the admin chrome because a serif over
 * dense table data is the wrong register. This screen is the one moment in the
 * portal that is not a task, and §24.8 says the client portal skews warmer.
 */
const MIN = 20 // matches OPENING_MESSAGE_MIN on the server

export default function OpeningMessage({ therapist, onSend, error }) {
  const [value, setValue] = useState('')
  const [sending, setSending] = useState(false)
  const textareaRef = useRef(null)
  const reduce = useReducedMotion()

  const name = therapist?.firstName ?? 'your therapist'
  const fullName = therapist
    ? [therapist.title, therapist.firstName, therapist.lastName].filter(Boolean).join(' ')
    : 'Your therapist'

  const trimmed = value.trim()
  const longEnough = trimmed.length >= MIN
  const started = trimmed.length > 0

  // Grows with the writing, so the page extends rather than the words
  // disappearing upward inside a fixed box.
  const resize = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.max(el.scrollHeight, 200)}px`
  }, [])
  useEffect(resize, [value, resize])

  async function submit(event) {
    event.preventDefault()
    if (!longEnough || sending) return
    setSending(true)
    try {
      await onSend(trimmed)
      // On success the thread replaces this screen, so nothing resets here.
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="relative min-h-0 flex-1 overflow-y-auto">
      {/* Ambient only — light on a surface, never a band gradient. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 size-[32rem] -translate-x-1/2 rounded-full bg-sage/10 blur-[130px]"
      />

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-10"
      >
        {/* Elevation declared once: a real shadow, and no border under it. */}
        <form
          onSubmit={submit}
          className="rounded-2xl bg-paper px-5 py-7 shadow-[0_18px_50px_-28px_rgba(25,18,43,0.35)] sm:px-8 sm:py-9"
        >
          {/* WHO you are writing to, before anything else. A real face is the
              visual anchor — §24.5 makes therapist portraits the exception to
              the site's photo treatment, so it carries no wash. */}
          <div className="flex items-center gap-4">
            {therapist?.photoUrl ? (
              <img
                src={therapist.photoUrl}
                alt={fullName}
                className="size-14 shrink-0 rounded-full object-cover ring-1 ring-sage/40"
              />
            ) : null}
            <div className="min-w-0">
              <p className="font-body text-caption text-ink/70">You are writing to</p>
              <p className="font-body text-ui font-medium text-ink">{fullName}</p>
            </div>
          </div>

          {/* No kicker above this heading. The heading carries its own weight. */}
          <Heading level={1} size="section" className="mt-7">
            {opening.title}
          </Heading>

          <Text tone="muted" className="mt-4 max-w-measure">
            {opening.lead.replace('{name}', name)}
          </Text>

          <Text size="caption" tone="muted" className="mt-3 max-w-measure">
            {opening.suggestions}
          </Text>

          {/* The writing space: a page, not a box. No visible border — the tint
              is the surface, and the focus ring is the only edge that appears. */}
          <label htmlFor="opening-message" className="sr-only">
            {opening.title}
          </label>
          <textarea
            id="opening-message"
            ref={textareaRef}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={opening.placeholder}
            disabled={sending}
            className={cx(
              'mt-6 block w-full resize-none rounded-2xl bg-mist px-5 py-4',
              'font-body text-body leading-relaxed text-ink-deep placeholder:text-ink/60',
              'outline-none transition-shadow duration-200',
              'focus-visible:ring-2 focus-visible:ring-sage',
              sending && 'opacity-70',
            )}
          />

          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              {/* Never a counter, never a progress bar. A progress bar here
                  would turn somebody's account of their own distress into a
                  task with a completion state. */}
              <Text size="caption" tone="muted">
                {started && !longEnough ? opening.tooShort : opening.reassurance}
              </Text>
              <Text size="caption" tone="muted" className="mt-1">
                {opening.privacy.replace('{name}', name)}
              </Text>
            </div>

            <button
              type="submit"
              disabled={!longEnough || sending}
              className={cx(
                'inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-5',
                'border border-ink/50 bg-gold font-body text-ui font-medium text-ink',
                'transition-[opacity,transform] duration-200 ease-out',
                'hover:scale-[1.02] active:scale-100',
                'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100',
              )}
            >
              <SendIcon size={18} />
              <span>{sending ? opening.sending : opening.send.replace('{name}', name)}</span>
            </button>
          </div>

          {error && (
            <p role="alert" className="mt-4 font-body text-caption text-clay">
              {error}
            </p>
          )}
        </form>
      </motion.div>
    </div>
  )
}
