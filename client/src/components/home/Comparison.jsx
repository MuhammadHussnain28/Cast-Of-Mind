import { motion, useReducedMotion } from 'framer-motion'
import { Heading, Text } from '../ui'
import { comparisonIntro, comparisonRows } from '../../data/homeContent'

/**
 * Section 6 of the home page (master spec §24.7): in-person therapy against
 * this platform, on cost, access, scheduling and contact between sessions.
 *
 * THE BRIEF SAYS CALM AND FACTUAL, NOT COMBATIVE. That is a design instruction
 * as much as a copy one, and it ruled out the usual build:
 *
 *  - No ticks and crosses, and no red anything. A column of green ticks beside
 *    a column of red crosses is an argument, not a comparison, and `clay` is
 *    reserved for errors — using it to mark someone else's option as wrong
 *    would be the palette telling a lie.
 *  - Both columns are set identically. Neither gets a highlight, a border, a
 *    tint or a "recommended" flag. If the facts are not enough, styling one
 *    column to win will not fix that.
 *  - The scheduling row states a real limitation of ours: the client cannot
 *    book or move a session. It is true (§7.4), and someone who discovers it
 *    after paying would be entitled to be annoyed. A comparison that concedes
 *    nothing is the kind nobody believes.
 *
 * TWO LAYOUTS, ONE SET OF FACTS. A real <table> from md up, and cards below it.
 * They carry the same content and exactly one is ever displayed — `hidden`
 * resolves to display:none, which removes the other from the accessibility tree
 * entirely, so nothing is announced twice. Reflowing a single <table> with
 * display:block would have kept one DOM tree but stripped the row and column
 * relationships that make a table navigable in the first place, which is the
 * whole reason to use one.
 *
 * MEASURED (all pass AA):
 *   ink        on paper .... 18.1:1
 *   ink/70     on paper .... 6.7:1
 *   ink        on mist ..... 16.2:1   (the small-screen cards)
 *   ink/70     on mist ..... 6.4:1
 */
export default function Comparison() {
  const reduceMotion = useReducedMotion()

  const reveal = (index) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, amount: 0.4 },
          transition: {
            duration: 0.7,
            delay: Math.min(index, 4) * 0.1, // §24.4: 80-120ms stagger
            ease: [0.22, 1, 0.36, 1],
          },
        }

  return (
    <section
      aria-labelledby="comparison-heading"
      data-surface="light"
      className="bg-paper"
    >
      <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
        <motion.div {...reveal(0)}>
          <Heading level={2} id="comparison-heading" className="max-w-[20ch]">
            How this differs from a room with two chairs.
          </Heading>
          <Text tone="muted" className="mt-7 max-w-measure">
            {comparisonIntro}
          </Text>
        </motion.div>

        {/* ---------------- md and up: a real table ---------------- */}
        <table className="mt-14 hidden w-full border-collapse text-left md:table lg:mt-16">
          <caption className="sr-only">
            A comparison of in-person therapy and Cast of Mind on cost, access,
            scheduling, and contact between sessions.
          </caption>
          <thead>
            <tr className="border-b border-ink/20">
              {/* The row headings are the four dimensions; this cell labels that
                  column and is empty on purpose, so it is hidden from screen
                  readers rather than announced as a blank. */}
              <th scope="col" className="w-1/5 pb-5 pr-8">
                <span className="sr-only">What is being compared</span>
              </th>
              <th scope="col" className="w-2/5 pb-5 pr-8 align-bottom">
                <Text size="ui" as="span" className="font-medium text-ink">
                  Therapy in person
                </Text>
              </th>
              <th scope="col" className="w-2/5 pb-5 align-bottom">
                <Text size="ui" as="span" className="font-medium text-ink">
                  Therapy with Cast of Mind
                </Text>
              </th>
            </tr>
          </thead>
          <tbody>
            {comparisonRows.map((row, index) => (
              <motion.tr
                key={row.id}
                {...reveal(index)}
                className="border-b border-ink/12 align-top last:border-b-0"
              >
                <th scope="row" className="py-7 pr-8">
                  <Text size="ui" as="span" className="font-medium text-ink">
                    {row.dimension}
                  </Text>
                </th>
                <td className="py-7 pr-8">
                  <Text size="ui" tone="muted" className="max-w-measure">
                    {row.inPerson}
                  </Text>
                </td>
                <td className="py-7">
                  <Text size="ui" tone="muted" className="max-w-measure">
                    {row.castOfMind}
                  </Text>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>

        {/* ---------------- below md: one card per dimension ---------------- */}
        <ul className="mt-12 grid gap-5 md:hidden">
          {comparisonRows.map((row, index) => (
            <motion.li
              key={row.id}
              {...reveal(index)}
              className="rounded-2xl bg-mist p-6"
            >
              <Heading level={3} size="subsection">
                {row.dimension}
              </Heading>

              <dl className="mt-5 grid gap-5">
                <div>
                  <dt>
                    <Text size="caption" as="span" className="font-medium text-ink">
                      In person
                    </Text>
                  </dt>
                  <dd className="mt-1.5">
                    <Text size="ui" tone="muted">
                      {row.inPerson}
                    </Text>
                  </dd>
                </div>
                <div>
                  <dt>
                    <Text size="caption" as="span" className="font-medium text-ink">
                      With Cast of Mind
                    </Text>
                  </dt>
                  <dd className="mt-1.5">
                    <Text size="ui" tone="muted">
                      {row.castOfMind}
                    </Text>
                  </dd>
                </div>
              </dl>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  )
}
