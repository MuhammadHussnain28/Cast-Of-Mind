import { cx } from '../../../../../lib/cx'
import { useNow } from '../../../../../lib/useNow'
import { wallInZone, zoneCity, offsetLabel } from '../../../../../lib/therapist/sessionTime'
import { SESSIONS } from '../../../../../data/therapistPortalContent'
import { MoonIcon } from '../../TherapistPortalIcons'
import ClockFace from './ClockFace'

const copy = SESSIONS.preview

// "−5 h", "+4 h 30" — the gap between the dials, in the space between them.
function shortOffset(minutes) {
  if (!minutes) return null
  const abs = Math.abs(minutes)
  const h = Math.floor(abs / 60)
  const m = abs % 60
  return `${minutes > 0 ? '+' : '−'}${h ? `${h} h` : ''}${m ? `${h ? ' ' : ''}${m}${h ? '' : ' min'}` : ''}`
}

function Side({ label, wall, dim }) {
  return (
    <div className="flex min-w-0 flex-col items-center text-center">
      <ClockFace hour={wall.hour} minute={wall.minute} night={wall.night} dim={dim} className="size-22 sm:size-28" />
      <p className="mt-3 max-w-full truncate font-body text-caption text-ink/70">{label}</p>
      <p className="font-body text-subsection font-medium leading-tight tabular-nums text-ink-deep">{wall.time}</p>
      <p className="font-body text-caption text-ink/70">{wall.date}</p>
    </div>
  )
}

/**
 * The live preview (9.2): one wall-clock choice in the therapist's zone, read
 * back in the client's. Before a time is picked, both dials show now.
 */
export default function TwoClocks({ preview, therapistZone, clientZone, clientName }) {
  const now = useNow()
  const picked = preview.status === 'ok' || preview.status === 'past'
  const at = picked ? preview.instant : now

  const you = wallInZone(at, therapistZone)
  let them = null
  if (clientZone && !preview.sameZone) {
    try {
      them = wallInZone(at, clientZone)
    } catch {
      them = null
    }
  }

  const city = zoneCity(clientZone)
  const offset = picked ? preview.offset : null
  const gap = shortOffset(offset ?? (them ? minutesBetween(you, them) : 0))

  let sentence = preview.status === 'nonexistent' ? copy.skipped : copy.empty
  if (picked) {
    const parts = [copy.forYou(you.date, you.time)]
    if (them) {
      let theirs = copy.forThem(them.time, clientName, city)
      if (preview.dayShift) theirs += ` ${copy.onDate(them.date)}`
      parts.push(theirs)
    }
    sentence = parts.join(' · ')
  }

  const night = preview.status === 'ok' && them?.night

  return (
    /* PREVIOUS VERSION (SAVED FOR BACKUP):
    <section aria-label={copy.label} className="relative overflow-hidden rounded-2xl bg-mist px-3 py-5 sm:px-5">
    */
    <section aria-label={copy.label} className="relative overflow-hidden rounded-2xl bg-mist p-5 sm:p-6">
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-sage/10 blur-[130px]" />

      <div className="relative grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2 sm:gap-3">
        <Side label={`${copy.you} · ${zoneCity(therapistZone)}`} wall={you} dim={!picked} />

        {/* The gap between the two clocks, drawn. The sentence below carries it in words. */}
        <div aria-hidden="true" className="flex h-22 flex-col items-center justify-center gap-1 sm:h-28">
          <svg viewBox="0 0 40 12" className="w-8 text-sage sm:w-10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 6h35" strokeDasharray={them ? undefined : '2 4'} />
            <path d="m32.5 2 4.5 4-4.5 4" />
          </svg>
          {gap && <span className="font-body text-caption tabular-nums text-ink/70">{gap}</span>}
        </div>

        {preview.sameZone ? (
          <div className="flex h-22 items-center sm:h-28">
            <p className="font-body text-caption text-ink">{copy.sameZone(clientName)}</p>
          </div>
        ) : them ? (
          <Side label={`${clientName} · ${city}`} wall={them} dim={!picked} />
        ) : (
          <div className="flex min-w-0 flex-col items-center text-center">
            <ClockFace unknown className="size-22 sm:size-28" />
            <p className="mt-3 font-body text-caption font-medium text-ink">{copy.unknownTitle}</p>
            <p className="font-body text-caption leading-snug text-ink/70">{copy.unknownBody(clientName)}</p>
          </div>
        )}
      </div>

      <p aria-live="polite" className={cx('relative mt-4 text-center font-body text-caption leading-relaxed', picked ? 'text-ink' : 'text-ink/70')}>
        {sentence}
        {picked && offset ? <span className="block text-ink/70">{`${city} is ${offsetLabel(offset)}`}</span> : null}
      </p>

      {night && (
        <p className="relative mt-2 flex items-center justify-center gap-1.5 font-body text-caption font-medium text-ink">
          <MoonIcon size={16} className="text-ink" />
          {copy.night(them.time, clientName)}
        </p>
      )}
    </section>
  )
}

function minutesBetween(a, b) {
  const asUtc = (p) => Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute)
  return Math.round((asUtc(b) - asUtc(a)) / 60000)
}
