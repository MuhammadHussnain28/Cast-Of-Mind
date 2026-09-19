import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Button } from '../../../ui'
import { useClientJournal } from '../../../../lib/therapist/useClientJournal'
import { usePrivateNotes } from '../../../../lib/therapist/usePrivateNotes'
import { EntrySpine, Entry } from '../../journal/EntrySpine'
import {
  SharedPageIcon,
  ClinicalNoteIcon,
  PrivateIcon,
  QuillIcon,
} from '../../journal/JournalIcons'
import NoteComposer from './NoteComposer'
import NoteRow from './NoteRow'
import { JOURNAL_NOTES } from '../../../../data/therapistPortalContent'

/**
 * §8.5/8.6 — ONE WORKSPACE, TWO SECTIONS, TWO COLLECTIONS.
 *
 * Unified in the UI and strictly separated in the data layer: the entries and
 * the notes arrive from two endpoints and are never merged into one object.
 * They are also given DIFFERENT MATERIALS on purpose — the journal is a dated
 * spine under a light header, the notes sit under a dark ink header — so whose
 * words are whose is never a question a tired therapist has to stop and answer.
 *
 * Side by side on a wide screen, which is §8.5's "read their feelings, write
 * observations beside them". Stacked below it, with the journal FIRST.
 */
export default function JournalNotesTab({ bookingId, clientName }) {
  return (
    <div className="mt-6 grid gap-6 pb-2 xl:grid-cols-2 xl:items-start">
      <JournalColumn bookingId={bookingId} clientName={clientName} />
      <NotesColumn bookingId={bookingId} />
    </div>
  )
}

/* ── their journal ─────────────────────────────────────────────────────────── */

function JournalColumn({ bookingId, clientName }) {
  const journal = useClientJournal(bookingId)
  const reduce = useReducedMotion()
  const copy = JOURNAL_NOTES.journal

  return (
    <section className="relative overflow-hidden rounded-2xl bg-paper shadow-[0_18px_50px_-28px_rgba(25,18,43,0.35)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 -top-24 size-64 rounded-full bg-sage/10 blur-[130px]"
      />

      <header className="relative flex items-start gap-3 border-b border-sage/40 px-5 py-4 sm:px-6">
        <span
          aria-hidden="true"
          className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-sage/15 text-sage-deep"
        >
          <SharedPageIcon size={18} />
        </span>
        <div className="min-w-0">
          <h2 className="font-body text-ui font-medium text-ink">{copy.heading(clientName)}</h2>
          <p className="mt-1 font-body text-caption text-ink/70">{copy.note}</p>
        </div>
      </header>

      <div className="relative px-5 py-5 sm:px-6">
        {journal.status === 'loading' && <Skeleton />}

        {journal.status === 'error' && (
          <Failed message={copy.loadError} onRetry={journal.retry} label={copy.retry} />
        )}

        {journal.status === 'ready' && journal.data.length === 0 && (
          <Blank icon={QuillIcon} title={copy.emptyTitle} body={copy.emptyBody(clientName)} />
        )}

        {journal.status === 'ready' && journal.data.length > 0 && (
          <>
            <p className="font-body text-caption text-ink/70">{copy.count(journal.total)}</p>

            <EntrySpine className="mt-4">
              <AnimatePresence initial={false}>
                {journal.data.map((entry) => (
                  <motion.li
                    key={entry.id}
                    layout={!reduce}
                    className="relative"
                    initial={reduce ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                  >
                    {/* No actions passed — there is nothing here to press. */}
                    <Entry entry={entry} ground="paper" />
                  </motion.li>
                ))}
              </AnimatePresence>
            </EntrySpine>

            {journal.nextCursor && (
              <div className="mt-5">
                <Button variant="ghost" size="sm" onClick={journal.loadMore}>
                  {copy.loadMore}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}

/* ── your private notes ────────────────────────────────────────────────────── */

function NotesColumn({ bookingId }) {
  const notes = usePrivateNotes(bookingId)
  const reduce = useReducedMotion()
  const [announcement, setAnnouncement] = useState('')
  const copy = JOURNAL_NOTES.notes

  return (
    <section className="overflow-hidden rounded-2xl bg-mist shadow-[0_18px_50px_-28px_rgba(25,18,43,0.35)]">
      {/*
        THE DARK HEADER IS THE MECHANISM, NOT DECORATION. Prominence comes from
        inversion rather than an alarm colour — nothing is wrong here — and it
        is the one ground where gold is legible (11.08:1 against 1.63:1 on paper).
        It is also the clearest possible signal that this side is not shared.
      */}
      <header className="relative overflow-hidden bg-ink px-5 py-4 sm:px-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-sage/10 blur-[130px]"
        />
        <div className="relative flex items-start gap-3">
          <span
            aria-hidden="true"
            className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-paper/10 text-gold"
          >
            <ClinicalNoteIcon size={18} />
          </span>
          <div className="min-w-0">
            <h2 className="font-body text-ui font-medium text-paper">{copy.heading}</h2>
            <p className="mt-1 flex items-center gap-1.5 font-body text-caption text-paper/80">
              <span aria-hidden="true" className="inline-flex text-gold">
                <PrivateIcon size={14} />
              </span>
              {copy.private}
            </p>
          </div>
        </div>
      </header>

      <div className="px-5 py-5 sm:px-6">
        <p role="status" className="sr-only">
          {announcement}
        </p>

        <NoteComposer
          onSubmit={async (values) => {
            await notes.add(values)
            setAnnouncement('Note saved.')
          }}
        />

        <div className="mt-5 border-t border-ink/12 pt-5">
          {notes.status === 'loading' && <Skeleton />}

          {notes.status === 'error' && (
            <Failed message={copy.loadError} onRetry={notes.retry} label={copy.retry} />
          )}

          {notes.status === 'ready' && notes.data.length === 0 && (
            <Blank icon={ClinicalNoteIcon} title={copy.emptyTitle} body={copy.emptyBody} />
          )}

          {notes.status === 'ready' && notes.data.length > 0 && (
            <>
              <p className="font-body text-caption text-ink/70">{copy.count(notes.total)}</p>

              <ul className="mt-4 space-y-3">
                <AnimatePresence initial={false}>
                  {notes.data.map((note) => (
                    <motion.li
                      key={note.id}
                      layout={!reduce}
                      initial={reduce ? false : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0 }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                    >
                      <NoteRow
                        note={note}
                        onEdit={async (id, values) => {
                          await notes.edit(id, values)
                          setAnnouncement('Note updated.')
                        }}
                        onDelete={async (id) => {
                          await notes.remove(id)
                          setAnnouncement('Note deleted.')
                        }}
                      />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>

              {notes.nextCursor && (
                <div className="mt-5">
                  <Button variant="ghost" size="sm" onClick={notes.loadMore}>
                    {copy.loadMore}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  )
}

/* ── shared states ─────────────────────────────────────────────────────────── */

function Blank({ icon: Icon, title, body }) {
  return (
    <div className="py-2">
      <span aria-hidden="true" className="inline-flex text-sage-deep">
        <Icon size={22} />
      </span>
      <p className="mt-2.5 font-body text-ui font-medium text-ink">{title}</p>
      <p className="mt-1.5 max-w-measure font-body text-ui leading-relaxed text-ink/70">{body}</p>
    </div>
  )
}

function Failed({ message, onRetry, label }) {
  return (
    <div className="flex flex-col items-start gap-3">
      <p className="font-body text-ui text-ink">{message}</p>
      <Button variant="ghost" size="sm" onClick={onRetry}>
        {label}
      </Button>
    </div>
  )
}

function Skeleton() {
  return (
    <div aria-hidden="true" className="space-y-3">
      {[0, 1].map((row) => (
        <div key={row} className="rounded-xl bg-ink/8 px-4 py-4">
          <div className="h-3 w-28 rounded bg-ink/10 motion-safe:animate-pulse" />
          <div className="mt-3 h-3 w-full rounded bg-ink/10 motion-safe:animate-pulse" />
          <div className="mt-2 h-3 w-3/5 rounded bg-ink/10 motion-safe:animate-pulse" />
        </div>
      ))}
    </div>
  )
}
