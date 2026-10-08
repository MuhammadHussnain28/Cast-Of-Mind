import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ScreenHeader } from '../../../components/portal/client/ScreenScaffold'
import { Button, Text } from '../../../components/ui'
import { useJournal } from '../../../lib/client/useJournal'
import { SCREENS, JOURNAL } from '../../../data/clientPortalContent'
import JournalComposer from '../../../components/portal/client/journal/JournalComposer'
import EntryRow from '../../../components/portal/client/journal/EntryRow'
import { EntrySpine } from '../../../components/portal/journal/EntrySpine'
import { SharedPageIcon, QuillIcon } from '../../../components/portal/journal/JournalIcons'
import { JournalIcon } from '../../../components/portal/client/ClientPortalIcons'

/**
 * §7.3. The transparency note LEADS this screen.
 *
 * The spec requires it visible in the UI for trust and legal clarity, and where
 * it sits is the point: someone deciding how honestly to write should meet that
 * fact before they start, not in small print underneath.
 */
export default function Journal() {
  const screen = SCREENS.journal
  const journal = useJournal()
  const reduce = useReducedMotion()
  const [announcement, setAnnouncement] = useState('')

  return (
    <section className="flex flex-col gap-7 pb-6">
      <ScreenHeader
        title={screen.title}
        lead={screen.lead}
        icon={JournalIcon}
        category="Personal Reflections"
        badge={journal.total > 0 ? `${journal.total} ${journal.total === 1 ? 'entry' : 'entries'}` : 'Shared'}
      />

      <p role="status" className="sr-only">
        {announcement}
      </p>

      <Transparency screen={screen} />

      <Panel>
        <JournalComposer
          onSubmit={async (values) => {
            await journal.add(values)
            setAnnouncement('Entry saved.')
          }}
        />
      </Panel>

      {journal.status === 'loading' && <SpineSkeleton />}

      {journal.status === 'error' && (
        <div className="flex flex-col items-start gap-3 rounded-2xl bg-paper px-5 py-5">
          <p className="font-body text-ui text-ink">{JOURNAL.loadError}</p>
          <Button variant="ghost" size="sm" onClick={journal.retry}>
            {JOURNAL.retry}
          </Button>
        </div>
      )}

      {journal.status === 'ready' && journal.data.length === 0 && <Empty />}

      {journal.status === 'ready' && journal.data.length > 0 && (
        <section>
          <h2 className="font-body text-caption font-medium text-ink/70">
            {JOURNAL.count(journal.total)}
          </h2>

          <EntrySpine className="mt-4">
            <AnimatePresence initial={false}>
              {journal.data.map((entry) => (
                <motion.li
                  key={entry.id}
                  layout={!reduce}
                  className="relative"
                  initial={reduce ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                >
                  <EntryRow
                    entry={entry}
                    onEdit={async (id, values) => {
                      await journal.edit(id, values)
                      setAnnouncement('Entry updated.')
                    }}
                    onDelete={async (id) => {
                      await journal.remove(id)
                      setAnnouncement('Entry deleted.')
                    }}
                  />
                </motion.li>
              ))}
            </AnimatePresence>
          </EntrySpine>

          {journal.nextCursor && (
            <div className="mt-5">
              <Button variant="ghost" size="sm" onClick={journal.loadMore}>
                {JOURNAL.loadMore}
              </Button>
            </div>
          )}
        </section>
      )}
    </section>
  )
}

/**
 * The §7.3 requirement, given the sage-edged treatment this project uses for
 * "read this one first" — the specialty picker and the verified fields.
 */
function Transparency({ screen }) {
  return (
    <div className="rounded-2xl bg-sage/8 px-5 py-5 ring-1 ring-sage/40">
      <div className="flex items-start gap-3.5">
        <span
          aria-hidden="true"
          className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-paper text-sage-deep"
        >
          <SharedPageIcon size={20} />
        </span>

        <div className="min-w-0">
          <p className="font-body text-ui font-medium text-ink">{JOURNAL.transparencyTitle}</p>
          <Text size="ui" tone="muted" className="mt-2 max-w-measure">
            {screen.transparency}
          </Text>
        </div>
      </div>

      <p className="mt-4 border-t border-sage/40 pt-3.5 font-body text-caption text-ink/70">
        {screen.truths[0]}
      </p>
    </div>
  )
}

function Panel({ children }) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-paper px-5 py-5 shadow-[0_18px_50px_-28px_rgba(25,18,43,0.35)] sm:px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-sage/10 blur-[130px]"
      />
      <div className="relative">{children}</div>
    </section>
  )
}

/** Designed, honest, and with nothing to press. No nudge, no streak. */
function Empty() {
  return (
    <div className="relative border-l border-sage/40 pl-6 sm:pl-7">
      <span
        aria-hidden="true"
        className="absolute -left-1.25 top-6 size-2.5 rounded-full bg-sage/40 ring-4 ring-mist"
      />
      <div className="rounded-2xl bg-paper px-5 py-6 shadow-[0_18px_50px_-30px_rgba(25,18,43,0.4)]">
        <span aria-hidden="true" className="inline-flex text-sage-deep">
          <QuillIcon size={22} />
        </span>
        <p className="mt-2.5 font-body text-ui font-medium text-ink">{JOURNAL.empty.title}</p>
        <Text size="ui" tone="muted" className="mt-1.5 max-w-measure">
          {JOURNAL.empty.body}
        </Text>
      </div>
    </div>
  )
}

/** The shape the list is about to take, not a spinner (4.4, 7.1, 8.1). */
function SpineSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-4 border-l border-sage/40 pl-6 sm:pl-7">
      {[0, 1].map((row) => (
        <div key={row} className="rounded-2xl bg-paper px-5 py-5">
          <div className="h-3 w-32 rounded bg-ink/10 motion-safe:animate-pulse" />
          <div className="mt-3 h-3 w-full rounded bg-ink/10 motion-safe:animate-pulse" />
          <div className="mt-2 h-3 w-4/5 rounded bg-ink/10 motion-safe:animate-pulse" />
        </div>
      ))}
    </div>
  )
}
