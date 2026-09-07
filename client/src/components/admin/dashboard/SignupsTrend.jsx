import { useId, useState } from 'react'
import { formatCount } from '../../../lib/dashboardFormat'

/**
 * New client signups, twelve months, one series.
 *
 * Hand-drawn SVG rather than a charting library: one small area chart does not
 * justify a dependency, and the project builds its own primitives.
 *
 * Follows the house chart specs — 2px line, a ~10% wash rather than a solid
 * block, hairline solid gridlines one step off the surface, an end marker with
 * a surface-coloured ring so it stays legible where it crosses the line. No
 * legend: a single series is already named by the title, and a one-swatch
 * legend box only restates it.
 *
 * The values are reachable three ways, so nothing is gated behind a tooltip:
 * the endpoint is directly labelled, every point has a hover and keyboard
 * tooltip, and a visually hidden table carries the exact figures for a screen
 * reader.
 */

const W = 640
const H = 200
const PAD = { top: 16, right: 20, bottom: 28, left: 20 }

export default function SignupsTrend({ points }) {
  const id = useId()
  const [active, setActive] = useState(null)

  const plotWidth = W - PAD.left - PAD.right
  const plotHeight = H - PAD.top - PAD.bottom

  // A flat run of zeros still has to draw a real line rather than collapse, so
  // the scale never divides by nothing.
  const peak = Math.max(1, ...points.map((point) => point.count))

  const x = (index) =>
    PAD.left + (points.length === 1 ? plotWidth / 2 : (index * plotWidth) / (points.length - 1))
  const y = (count) => PAD.top + plotHeight - (count / peak) * plotHeight

  const line = points.map((point, i) => `${i === 0 ? 'M' : 'L'}${x(i)} ${y(point.count)}`).join(' ')
  const area = `${line} L${x(points.length - 1)} ${PAD.top + plotHeight} L${x(0)} ${PAD.top + plotHeight} Z`

  const last = points[points.length - 1]
  const shown = active ?? last

  return (
    <figure className="m-0">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="font-body text-caption text-paper/70">
          New client signups, last 12 months
        </span>
        <span className="font-body text-caption text-paper">
          {formatCount(shown.count)} in {shown.label}
        </span>
      </figcaption>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-3 h-auto w-full"
        role="img"
        aria-labelledby={`${id}-title`}
        preserveAspectRatio="none"
      >
        <title id={`${id}-title`}>
          New client signups per month for the last twelve months
        </title>

        <defs>
          <linearGradient id={`${id}-wash`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7C9082" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#7C9082" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Hairline, solid, one step off the surface. Never dashed. */}
        {[0, 0.5, 1].map((step) => (
          <line
            key={step}
            x1={PAD.left}
            x2={W - PAD.right}
            y1={PAD.top + plotHeight * step}
            y2={PAD.top + plotHeight * step}
            stroke="#FFFFFF"
            strokeOpacity="0.12"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        <path d={area} fill={`url(#${id}-wash)`} />
        <path
          d={line}
          fill="none"
          stroke="#7C9082"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />

        {/* The current month, ringed in the surface colour so it reads over the
            line rather than merging with it. */}
        <circle
          cx={x(points.length - 1)}
          cy={y(last.count)}
          r="5"
          fill="#F5C518"
          stroke="#0D0916"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />

        {active && (
          <circle
            cx={x(points.indexOf(active))}
            cy={y(active.count)}
            r="5"
            fill="#7C9082"
            stroke="#0D0916"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        )}

        {/* Hit areas far larger than the marks, and focusable, so a keyboard
            reader gets exactly what a pointer does. */}
        {points.map((point, i) => (
          <rect
            key={point.month}
            x={x(i) - plotWidth / (points.length * 2)}
            y={PAD.top}
            width={plotWidth / points.length}
            height={plotHeight}
            fill="transparent"
            tabIndex={0}
            role="button"
            aria-label={`${point.label}: ${point.count} signups`}
            onMouseEnter={() => setActive(point)}
            onMouseLeave={() => setActive(null)}
            onFocus={() => setActive(point)}
            onBlur={() => setActive(null)}
            className="cursor-default focus-visible:outline-none"
          />
        ))}

        {/* Every third month, so labels never collide at narrow widths. */}
        {points.map((point, i) =>
          i % 3 === 0 || i === points.length - 1 ? (
            <text
              key={`${point.month}-label`}
              x={x(i)}
              y={H - 8}
              textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}
              className="font-body"
              fontSize="12"
              fill="#FFFFFF"
              fillOpacity="0.7"
            >
              {point.label}
            </text>
          ) : null,
        )}
      </svg>

      {/* The WCAG-clean twin. Exact values without depending on hover. */}
      <table className="sr-only">
        <caption>New client signups per month</caption>
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col">Signups</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={`${point.month}-row`}>
              <th scope="row">{point.month}</th>
              <td>{point.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
