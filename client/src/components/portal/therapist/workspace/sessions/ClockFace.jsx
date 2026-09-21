import { cx } from '../../../../../lib/cx'

// A drawn dial for the scheduling preview: light by day, ink at night, so the
// hour reads at a glance. Decorative — the caption beside it carries the time.

const TICKS = Array.from({ length: 12 }, (_, i) => i)

function Hand({ deg, length, width, className }) {
  return (
    <g
      style={{ transform: `rotate(${deg}deg)` }}
      className="origin-center [transform-box:view-box] motion-safe:transition-transform motion-safe:duration-[250ms] motion-safe:ease-out"
    >
      <line x1="60" y1="60" x2="60" y2={60 - length} strokeWidth={width} strokeLinecap="round" className={className} />
    </g>
  )
}

export default function ClockFace({ hour = 12, minute = 0, night = false, unknown = false, dim = false, className }) {
  const svgClass = cx(
    'block drop-shadow-[0_10px_16px_rgba(25,18,43,0.16)] transition-opacity duration-200',
    dim && 'opacity-45',
    className,
  )

  if (unknown) {
    return (
      <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false" className={cx(svgClass, 'drop-shadow-none')}>
        <circle cx="60" cy="60" r="54" fill="none" strokeWidth="1.5" strokeDasharray="3 7" strokeLinecap="round" className="stroke-ink/50" />
        <path d="M52 60h16" strokeWidth="2.5" strokeLinecap="round" className="stroke-ink/50" />
      </svg>
    )
  }

  const hands = night ? 'stroke-paper' : 'stroke-ink-deep'

  return (
    <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false" className={svgClass}>
      <circle
        cx="60"
        cy="60"
        r="54"
        strokeWidth="1.5"
        className={cx('transition-colors duration-200', night ? 'fill-ink stroke-ink' : 'fill-paper stroke-sage')}
      />
      {TICKS.map((i) => {
        const major = i % 3 === 0
        return (
          <line
            key={i}
            x1="60"
            y1={major ? 11 : 13}
            x2="60"
            y2={major ? 19 : 17}
            strokeWidth={major ? 2 : 1.5}
            strokeLinecap="round"
            transform={`rotate(${i * 30} 60 60)`}
            className={night ? 'stroke-paper/45' : 'stroke-ink/35'}
          />
        )
      })}
      <Hand deg={(hour % 12) * 30 + minute * 0.5} length={27} width={4} className={hands} />
      <Hand deg={minute * 6} length={39} width={2.5} className={hands} />
      <circle cx="60" cy="60" r="4.5" strokeWidth="1.5" className={night ? 'fill-gold stroke-gold' : 'fill-gold stroke-ink'} />
    </svg>
  )
}
