import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Button, Heading, Text } from '../components/ui'
import TherapistCard from '../components/matches/TherapistCard'
import MatchesSkeleton from '../components/matches/MatchesSkeleton'
import { selectAnswers } from '../store/questionnaireSlice'
import { findMatches } from '../lib/api/matchingApi'
import { matches } from '../data/matchesContent'
import TherapistCarousel from '../components/matches/TherapistCarousel'
/**
 * The results (§24.7). Therapists who work with what the visitor named.
 *
 * THE PAGE SAYS NOTHING ABOUT HOW WELL ANYONE MATCHED. §15's fallback returns
 * every therapist silently when nothing overlaps, so a count, a ranking or a
 * "we found N for you" line would turn into the "no exact match" message the
 * client explicitly rejected. The heading is the same either way.
 */
export default function Matches() {
  const answers = useSelector(selectAnswers)
  const reduceMotion = useReducedMotion()

  const [result, setResult] = useState({ key: null, therapists: [], failed: false })
  const [attempt, setAttempt] = useState(0)

  // Memoised on its own contents: a fresh array each render would make the
  // effect below re-fire for ever.
  const tagKey = (answers.concernTags ?? []).join('|')
  const concernTags = useMemo(() => (tagKey ? tagKey.split('|') : []), [tagKey])
  const hasAnswers = concernTags.length > 0

  // The request currently wanted. Loading is "the stored result is not for this
  // request" — derived rather than set synchronously inside the effect, which is
  // the pattern the React Compiler rule asks for (see chunk 0.6's useApi fix).
  const requestKey = [
    tagKey,
    answers.therapistGenderPreference || 'no_preference',
    attempt,
  ].join('::')

  const status =
    result.key !== requestKey ? 'loading' : result.failed ? 'error' : 'ready'

  useEffect(() => {
    if (!hasAnswers) return undefined

    let live = true

    findMatches({
      concernTags,
      therapistGenderPreference: answers.therapistGenderPreference || 'no_preference',
    })
      .then((payload) => {
        if (!live) return
        setResult({ key: requestKey, therapists: payload.data ?? [], failed: false })
      })
      .catch(() => {
        if (!live) return
        setResult({ key: requestKey, therapists: [], failed: true })
      })

    return () => {
      live = false
    }
  }, [hasAnswers, requestKey, concernTags, answers.therapistGenderPreference])

  // Someone arriving cold — a shared link, a new tab — has nothing to match on.
  // Asking them to answer is honest; firing a request with nothing is not.
  if (!hasAnswers) {
    return (
      <Shell>
        <Heading level={1} size="section" className="max-w-measure">
          {matches.noAnswersHeading}
        </Heading>
        <Text tone="muted" className="mt-4 max-w-measure">
          {matches.noAnswersBody}
        </Text>
        <Button as={Link} to="/questionnaire" className="mt-8">
          {matches.noAnswersCta}
        </Button>
      </Shell>
    )
  }

  return (
    <Shell>
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <Heading level={1} size="section" className="max-w-measure">
          {matches.heading}
        </Heading>
        <Text tone="muted" className="mt-4 max-w-measure">
          {matches.intro}
        </Text>
      </motion.div>

      <div className="mt-12">
        {status === 'loading' && (
          <>
            <p className="sr-only" role="status">
              {matches.loading}
            </p>
            <MatchesSkeleton />
          </>
        )}

        {status === 'error' && (
          <div className="rounded-2xl border border-ink/12 bg-mist p-8">
            <Heading level={2} size="subsection">
              {matches.errorHeading}
            </Heading>
            <Text tone="muted" className="mt-3 max-w-measure">
              {matches.errorBody}
            </Text>
            <Button variant="secondary" className="mt-6" onClick={() => setAttempt((n) => n + 1)}>
              {matches.retry}
            </Button>
          </div>
        )}

        {status === 'ready' && result.therapists.length === 0 && (
          // NOT the no-match fallback — that returns everyone. This is the
          // genuinely empty roster, which is our problem and says so.
          <div className="rounded-2xl border border-ink/12 bg-mist p-8">
            <Heading level={2} size="subsection">
              {matches.emptyHeading}
            </Heading>
            <Text tone="muted" className="mt-3 max-w-measure">
              {matches.emptyBody}
            </Text>
          </div>
        )}

        {/* {status === 'ready' && result.therapists.length > 0 && (
          <ul className="grid gap-6 sm:grid-cols-2">
            {result.therapists.map((therapist, index) => (
              <TherapistCard key={therapist.id} therapist={therapist} index={index} />
            ))}
          </ul>
        )} */}

        {status === 'ready' && result.therapists.length > 0 && (
          <TherapistCarousel therapists={result.therapists} />
        )}


      </div>
    </Shell>
  )
}

function Shell({ children }) {
  return (
    <div className="bg-mist">
      <div className="mx-auto w-full max-w-5xl px-5 py-16 sm:px-8 lg:py-24">{children}</div>
    </div>
  )
}
