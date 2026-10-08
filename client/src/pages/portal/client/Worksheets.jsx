import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ScreenHeader } from '../../../components/portal/client/ScreenScaffold'
import { Button } from '../../../components/ui'
import { useClientPortal } from '../../../lib/clientPortalContext'
import { useMyWorksheets } from '../../../lib/client/useMyWorksheets'
import { SCREENS, MY_WORKSHEETS } from '../../../data/clientPortalContent'
import MyWorksheetRow from '../../../components/portal/client/worksheets/MyWorksheetRow'
import {
  PagesIcon,
  PencilIcon,
  ScreenIcon,
  WorksheetsIcon,
} from '../../../components/portal/client/ClientPortalIcons'
import { ReturnedIcon, WaitingIcon } from '../../../components/portal/therapist/TherapistPortalIcons'

const WAY_ICONS = { screen: ScreenIcon, paper: PencilIcon, pages: PagesIcon }

// §7.2 — download, fill it in anywhere, send it back. The guidance makes the loop feel intended.
export default function Worksheets() {
  const { therapist } = useClientPortal()
  const name = therapist?.firstName || 'your therapist'
  const sheets = useMyWorksheets()
  const reduce = useReducedMotion()
  const [announcement, setAnnouncement] = useState('')

  const toComplete = sheets.data.filter((w) => w.status === 'assigned')
  const submitted = sheets.data.filter((w) => w.status === 'completed')

  const rows = (list) => (
    <ul className="divide-y divide-ink/12">
      <AnimatePresence initial={false}>
        {list.map((worksheet) => (
          <motion.li
            key={worksheet.id}
            layout={!reduce}
            className="overflow-hidden"
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <MyWorksheetRow
              worksheet={worksheet}
              onDownload={sheets.download}
              onSubmit={sheets.submit}
              onSent={() => setAnnouncement(MY_WORKSHEETS.drop.sent)}
            />
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  )

  return (
    <section className="flex flex-col gap-7 pb-6">
      <ScreenHeader
        title={SCREENS.worksheets.title}
        lead={MY_WORKSHEETS.lead(name)}
        icon={WorksheetsIcon}
        category="Care Resources & Exercises"
        badge={toComplete.length > 0 ? `${toComplete.length} active` : null}
      />

      <p role="status" className="sr-only">
        {announcement}
      </p>

      <Guidance />

      {sheets.status === 'loading' && <ListSkeleton />}

      {sheets.status === 'error' && (
        <div className="flex flex-col items-start gap-3 rounded-2xl bg-paper px-5 py-5">
          <p className="font-body text-ui text-ink">{MY_WORKSHEETS.loadError}</p>
          <Button variant="ghost" size="sm" onClick={sheets.retry}>
            {MY_WORKSHEETS.retry}
          </Button>
        </div>
      )}

      {sheets.status === 'ready' && sheets.data.length === 0 && <Empty name={name} />}

      {sheets.status === 'ready' && toComplete.length > 0 && (
        <Group icon={WaitingIcon} title={MY_WORKSHEETS.sections.toComplete} count={toComplete.length}>
          {rows(toComplete)}
        </Group>
      )}

      {sheets.status === 'ready' && submitted.length > 0 && (
        <Group icon={ReturnedIcon} title={MY_WORKSHEETS.sections.submitted} count={submitted.length} done>
          {rows(submitted)}
        </Group>
      )}

      {sheets.nextCursor && (
        <div>
          <Button variant="ghost" size="sm" onClick={sheets.loadMore}>
            {MY_WORKSHEETS.loadMore}
          </Button>
        </div>
      )}
    </section>
  )
}

// The loop, then three ways to fill a sheet in — drawn, so the flow reads as intended.
function Guidance() {
  const steps = SCREENS.worksheets.steps
  return (
    <div className="relative overflow-hidden rounded-2xl bg-paper px-5 py-5 shadow-[0_18px_50px_-28px_rgba(25,18,43,0.35)] sm:px-6">
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-sage/10 blur-[130px]" />

      {/* The order carries meaning here, so the steps are numbered (§24.7). */}
      <ol className="relative grid gap-3 sm:grid-cols-4">
        {steps.map((step, index) => (
          <li key={step.label} className="flex items-start gap-2.5 sm:flex-col sm:gap-2">
            <span
              aria-hidden="true"
              className="flex size-7 shrink-0 items-center justify-center rounded-full bg-paper font-body text-caption font-medium text-sage-deep ring-1 ring-sage-deep"
            >
              {index + 1}
            </span>
            <span className="font-body text-caption font-medium text-ink">{step.label}</span>
          </li>
        ))}
      </ol>

      <h2 className="relative mt-5 border-t border-ink/12 pt-4 font-body text-ui font-medium text-ink">
        {MY_WORKSHEETS.howTitle}
      </h2>
      <ul className="relative mt-3 grid gap-4 md:grid-cols-3">
        {MY_WORKSHEETS.ways.map((way) => {
          const Icon = WAY_ICONS[way.key]
          return (
            <li key={way.key} className="flex items-start gap-3">
              <span aria-hidden="true" className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-sage/15 text-sage-deep">
                <Icon size={22} />
              </span>
              <span>
                <span className="block font-body text-ui font-medium text-ink">{way.title}</span>
                <span className="mt-0.5 block font-body text-caption leading-relaxed text-ink/70">{way.body}</span>
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function Group({ icon: Icon, title, count, done = false, children }) {
  return (
    <section>
      <h2 className="flex items-center gap-2 px-1 font-body text-ui font-medium text-ink">
        <Icon size={18} className={done ? 'text-sage-deep' : 'text-ink/70'} />
        {title}
        <span className="font-body text-caption font-normal tabular-nums text-ink/70">{count}</span>
      </h2>
      <div className="mt-2 overflow-hidden rounded-2xl bg-paper shadow-[0_18px_50px_-32px_rgba(25,18,43,0.35)]">
        {children}
      </div>
    </section>
  )
}

function Empty({ name }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-paper px-6 py-10 text-center">
      <span aria-hidden="true" className="inline-flex size-14 items-center justify-center rounded-full bg-sage/15 text-sage-deep">
        <WorksheetsIcon size={26} />
      </span>
      <p className="mt-4 font-body text-ui font-medium text-ink">{MY_WORKSHEETS.empty.title}</p>
      <p className="mx-auto mt-1.5 max-w-sm font-body text-caption leading-relaxed text-ink/70">
        {MY_WORKSHEETS.empty.body(name)}
      </p>
    </div>
  )
}

function ListSkeleton() {
  return (
    <div aria-hidden="true" className="overflow-hidden rounded-2xl bg-paper">
      {[0, 1].map((row) => (
        <div key={row} className="flex items-center gap-4 border-b border-ink/12 px-5 py-4 last:border-b-0">
          <div className="size-11 rounded-xl bg-ink/10 motion-safe:animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-44 rounded bg-ink/10 motion-safe:animate-pulse" />
            <div className="h-2.5 w-28 rounded bg-ink/10 motion-safe:animate-pulse" />
          </div>
        </div>
      ))}
      <p className="sr-only" role="status">
        Loading your worksheets
      </p>
    </div>
  )
}
