import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Button } from '../../../ui'
import { useWorksheets } from '../../../../lib/therapist/useWorksheets'
import { WORKSHEETS } from '../../../../data/therapistPortalContent'
import WorksheetUploader from './WorksheetUploader'
import WorksheetRow from './WorksheetRow'
import { ReturnedIcon, WaitingIcon } from '../TherapistPortalIcons'
import { WorksheetsIcon } from '../../client/ClientPortalIcons'

// The worksheet loop for one client (§7.2): assign, wait, receive. Files only.
export default function WorksheetsTab({ bookingId, clientName, ended }) {
  const sheets = useWorksheets(bookingId)
  const reduce = useReducedMotion()

  const waiting = sheets.data.filter((w) => w.status === 'assigned')
  const returned = sheets.data.filter((w) => w.status === 'completed')

  return (
    <div className="mt-6 flex flex-col gap-6">
      <h2 className="sr-only">
        {WORKSHEETS.heading} — {clientName}
      </h2>

      {/* An ended booking keeps its record but takes no new work (409 server-side). */}
      {!ended && (
        <WorksheetUploader
          clientName={clientName}
          upload={sheets.upload}
          onAssign={sheets.assign}
          onReset={sheets.resetUpload}
        />
      )}

      {sheets.status === 'loading' && <ListSkeleton />}

      {sheets.status === 'error' && (
        <div className="flex flex-col items-start gap-3 rounded-2xl bg-paper px-5 py-5">
          <p className="font-body text-ui text-ink">{WORKSHEETS.loadError}</p>
          <Button variant="ghost" size="sm" onClick={sheets.retry}>
            {WORKSHEETS.retry}
          </Button>
        </div>
      )}

      {sheets.status === 'ready' && sheets.data.length === 0 && <Empty />}

      {sheets.status === 'ready' && sheets.data.length > 0 && (
        <>
          <Section icon={WaitingIcon} title={WORKSHEETS.sections.waiting} count={sheets.counts.assigned} tone="waiting">
            <AnimatedRows reduce={reduce} rows={waiting} sheets={sheets} />
          </Section>

          <Section icon={ReturnedIcon} title={WORKSHEETS.sections.returned} count={sheets.counts.completed} tone="returned">
            {returned.length ? (
              <AnimatedRows reduce={reduce} rows={returned} sheets={sheets} />
            ) : (
              <p className="px-5 py-4 font-body text-caption text-ink/70">{WORKSHEETS.sections.noneReturned}</p>
            )}
          </Section>

          {sheets.nextCursor && (
            <div>
              <Button variant="ghost" size="sm" onClick={sheets.loadMore}>
                {WORKSHEETS.loadMore}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function Section({ icon: Icon, title, count, tone, children }) {
  if (tone === 'waiting' && count === 0) return null
  return (
    <section>
      <h3 className="flex items-center gap-2 px-1 font-body text-ui font-medium text-ink">
        <Icon size={18} className={tone === 'returned' ? 'text-sage-deep' : 'text-ink/70'} />
        {title}
        <span className="font-body text-caption font-normal tabular-nums text-ink/70">{count}</span>
      </h3>
      <div className="mt-2 overflow-hidden rounded-2xl bg-paper shadow-[0_18px_50px_-32px_rgba(25,18,43,0.35)]">
        {children}
      </div>
    </section>
  )
}

function AnimatedRows({ rows, sheets, reduce }) {
  return (
    <ul className="divide-y divide-ink/12">
      <AnimatePresence initial={false}>
        {rows.map((worksheet) => (
          <motion.li
            key={worksheet.id}
            className="overflow-hidden"
            initial={reduce ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <WorksheetRow
              worksheet={worksheet}
              onDownload={sheets.download}
              onWithdraw={sheets.withdraw}
              onReview={sheets.markReviewed}
            />
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  )
}

function Empty() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-paper px-6 py-10 text-center">
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 size-64 -translate-x-1/2 rounded-full bg-sage/10 blur-[130px]" />
      <span aria-hidden="true" className="relative inline-flex size-14 items-center justify-center rounded-full bg-sage/15 text-sage-deep">
        <WorksheetsIcon size={26} />
      </span>
      <p className="relative mt-4 font-body text-ui font-medium text-ink">{WORKSHEETS.empty.title}</p>
      <p className="relative mx-auto mt-1.5 max-w-sm font-body text-caption leading-relaxed text-ink/70">
        {WORKSHEETS.empty.body}
      </p>
    </div>
  )
}

function ListSkeleton() {
  return (
    <div aria-hidden="true" className="overflow-hidden rounded-2xl bg-paper">
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex items-center gap-4 border-b border-ink/12 px-5 py-4 last:border-b-0">
          <div className="size-11 rounded-xl bg-ink/10 motion-safe:animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-48 rounded bg-ink/10 motion-safe:animate-pulse" />
            <div className="h-2.5 w-32 rounded bg-ink/10 motion-safe:animate-pulse" />
          </div>
        </div>
      ))}
      <p className="sr-only" role="status">
        Loading worksheets
      </p>
    </div>
  )
}
