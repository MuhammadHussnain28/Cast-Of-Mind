import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Button, Heading, Text } from '../../ui'
import { WELCOME_BACK } from '../../../data/clientPortalContent'
import { SUPPORT_EMAIL } from '../../../data/contactContent'

/**
 * Back from Stripe after re-subscribing (11.4).
 *
 * THE REDIRECT PROVES NOTHING — the webhook does (§12). This screen asks /me
 * every two seconds and the portal simply appears once access returns. Never a
 * false "done". After about 45 seconds it says so plainly and keeps a way to
 * check again, rather than spinning for ever.
 */

const POLL_MS = 2000
const PATIENCE = 22 // ~45 seconds

export default function WelcomingBack({ onCheck }) {
  const reduce = useReducedMotion()
  const [polls, setPolls] = useState(0)
  const slow = polls >= PATIENCE

  // Each tick asks the shell to re-read /me. State changes only in the timer.
  useEffect(() => {
    if (slow) return undefined
    const id = setTimeout(() => {
      onCheck()
      setPolls((n) => n + 1)
    }, POLL_MS)
    return () => clearTimeout(id)
  }, [polls, slow, onCheck])

  return (
    <div className="relative flex h-dvh items-center justify-center overflow-y-auto bg-mist px-4 py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/3 size-[28rem] -translate-x-1/2 rounded-full bg-sage/10 blur-[130px]"
      />

      <main className="relative w-full max-w-md rounded-2xl bg-paper px-6 py-10 text-center shadow-[0_18px_50px_-24px_rgb(25_18_43/0.35)] sm:px-9">
        {/* A breathing mark — the site's 4-second rhythm — while nothing is known. */}
        <div aria-hidden="true" className="relative mx-auto size-16">
          <motion.span
            className="absolute inset-0 rounded-full bg-sage/20"
            animate={reduce || slow ? undefined : { scale: [1, 1.18, 1], opacity: [0.7, 0.35, 0.7] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <span className="absolute inset-3 rounded-full border-2 border-sage-deep bg-paper" />
        </div>

        <div role="status" aria-live="polite">
          <Heading level={1} size="subsection" className="mt-6">
            {slow ? WELCOME_BACK.slowTitle : WELCOME_BACK.title}
          </Heading>
          <Text tone="muted" className="mx-auto mt-3 max-w-sm">
            {slow ? (
              <>
                {WELCOME_BACK.slowBody}{' '}
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="font-medium text-ink underline decoration-ink/60 underline-offset-2 hover:decoration-2"
                >
                  {SUPPORT_EMAIL}
                </a>
                .
              </>
            ) : (
              WELCOME_BACK.body
            )}
          </Text>
        </div>

        {slow && (
          <Button
            variant="secondary"
            onClick={() => {
              onCheck()
              setPolls(0)
            }}
            className="mt-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            {WELCOME_BACK.checkAgain}
          </Button>
        )}
      </main>
    </div>
  )
}
