import { useEffect, useState } from 'react'
import { Button } from '../../ui'
import { CardIcon, CloudIcon, DatabaseIcon, MailIcon } from '../AdminIcons'
import { fetchSystemStatus } from '../../../lib/api/adminApi'
import { formatTime } from '../../../lib/dateFormat'
import { cx } from '../../../lib/cx'
import {
  DETAIL,
  SERVICES,
  STATE_LABEL,
  STATE_NOTE,
  STATUS_CARD,
  summaryFor,
} from '../../../data/systemStatusContent'

// System status (10.6): checked when the dashboard opens and on request, never polled.
// Each state has its own shape and word as well as a hue — never colour alone.

const ICONS = { database: DatabaseIcon, payments: CardIcon, email: MailIcon, storage: CloudIcon }

const LABEL_TONE = {
  operational: 'text-sage-deep',
  attention: 'text-ink',
  down: 'text-clay',
  not_configured: 'text-ink/70',
}

const RULE_TONE = {
  operational: 'bg-sage',
  attention: 'bg-ink/60',
  down: 'bg-clay',
  not_configured: 'bg-ink/25',
}

function StatusMark({ state, className }) {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false" className={cx('shrink-0', className)}>
      {state === 'operational' && <circle cx="6" cy="6" r="5" className="fill-sage-deep" />}
      {state === 'attention' && (
        <>
          <circle cx="6" cy="6" r="4.5" className="fill-none stroke-ink" strokeWidth="1.5" />
          <path d="M6 1.5a4.5 4.5 0 0 0 0 9Z" className="fill-ink" />
        </>
      )}
      {state === 'down' && (
        <>
          <circle cx="6" cy="6" r="5" className="fill-clay" />
          <path
            d="m4.25 4.25 3.5 3.5m0-3.5-3.5 3.5"
            className="stroke-paper"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </>
      )}
      {state === 'not_configured' && (
        <circle
          cx="6"
          cy="6"
          r="4.5"
          className="fill-none stroke-ink/60"
          strokeWidth="1.5"
          strokeDasharray="2.36 2.36"
        />
      )}
    </svg>
  )
}

function ServiceTile({ service }) {
  const Icon = ICONS[service.key]
  const meta = SERVICES[service.key]
  const note = DETAIL[service.detail] ?? STATE_NOTE[service.state]

  return (
    <li className="flex flex-col gap-4 bg-paper px-5 py-5 sm:px-6">
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-mist text-ink">
          <Icon className="size-5" />
        </span>
        {service.latencyMs !== null && (
          <span className="pt-1 font-body text-caption text-ink/70 tabular-nums">
            {STATUS_CARD.latency(service.latencyMs)}
            <span className="sr-only"> {STATUS_CARD.latencyLabel}</span>
          </span>
        )}
      </div>

      <div>
        <h3 className="font-body text-ui font-medium text-ink">{meta.name}</h3>
        <p className="font-body text-caption text-ink/70">{meta.provider}</p>

        <p
          className={cx(
            'mt-3 flex items-center gap-2 font-body text-caption font-medium',
            LABEL_TONE[service.state],
          )}
        >
          <StatusMark state={service.state} className="size-3" />
          {STATE_LABEL[service.state]}
        </p>
        <p className="mt-1 font-body text-caption text-ink/70">{note}</p>
      </div>
    </li>
  )
}

function TileSkeleton() {
  return (
    <li aria-hidden="true" className="flex flex-col gap-4 bg-paper px-5 py-5 sm:px-6">
      <span className="size-10 rounded-xl bg-mist motion-safe:animate-pulse" />
      <span className="flex flex-col gap-2.5">
        <span className="h-3 w-2/5 rounded-full bg-ink/10 motion-safe:animate-pulse" />
        <span className="h-3 w-3/5 rounded-full bg-ink/10 motion-safe:animate-pulse" />
        <span className="h-3 w-4/5 rounded-full bg-ink/10 motion-safe:animate-pulse" />
      </span>
    </li>
  )
}

export default function SystemStatusCard() {
  const [reloadToken, setReloadToken] = useState(0)
  const [result, setResult] = useState(null)

  // Derived, as on the dashboard: a re-check keeps the last result on screen.
  const checking = result?.key !== reloadToken
  const failed = !checking && result.error
  const status = failed ? null : (result?.data ?? null)

  useEffect(() => {
    let cancelled = false

    fetchSystemStatus()
      .then((data) => {
        if (!cancelled) setResult({ key: reloadToken, data, error: false })
      })
      .catch(() => {
        if (!cancelled) setResult({ key: reloadToken, data: null, error: true })
      })

    return () => {
      cancelled = true
    }
  }, [reloadToken])

  const summary = status ? summaryFor(status.services) : null
  const headline = summary?.text ?? (failed ? STATUS_CARD.failed : STATUS_CARD.checking)

  return (
    <section aria-labelledby="dashboard-system" className="flex flex-col gap-4">
      <h2 id="dashboard-system" className="font-body text-caption font-medium text-ink/70">
        {STATUS_CARD.heading}
      </h2>

      <div className="relative overflow-hidden rounded-2xl bg-paper shadow-[0_1px_2px_rgba(25,18,43,0.06),0_18px_40px_-22px_rgba(25,18,43,0.3)]">
        <span
          aria-hidden="true"
          className={cx(
            'absolute inset-x-0 top-0 h-1 transition-colors duration-200 ease-out',
            summary ? RULE_TONE[summary.state] : 'bg-ink/12',
          )}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-28 size-72 rounded-full bg-sage/10 blur-[130px]"
        />

        <div className="relative flex flex-wrap items-center justify-between gap-4 px-5 pb-5 pt-6 sm:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-mist">
              {summary ? (
                <StatusMark state={summary.state} className="size-4" />
              ) : (
                <span className="size-4 rounded-full border-[1.5px] border-dashed border-ink/50" />
              )}
            </span>
            <div className="min-w-0">
              <p role="status" className="font-body text-ui font-medium text-ink">
                {headline}
              </p>
              <p className="font-body text-caption text-ink/70">
                {status
                  ? `${STATUS_CARD.scope} · ${STATUS_CARD.checkedAt(formatTime(status.checkedAt))}`
                  : STATUS_CARD.scope}
              </p>
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            loading={checking && result !== null}
            disabled={checking}
            onClick={() => setReloadToken((n) => n + 1)}
          >
            {STATUS_CARD.checkAgain}
          </Button>
        </div>

        {!failed && (
          // gap-px over an ink/10 ground draws hairline seams in every layout.
          <ul
            aria-busy={checking || undefined}
            className={cx(
              'relative grid gap-px bg-ink/10 pt-px transition-opacity duration-200 ease-out sm:grid-cols-2 lg:grid-cols-4',
              checking && status && 'opacity-60',
            )}
          >
            {status
              ? status.services.map((service) => <ServiceTile key={service.key} service={service} />)
              : Object.keys(SERVICES).map((key) => <TileSkeleton key={key} />)}
          </ul>
        )}
      </div>
    </section>
  )
}
