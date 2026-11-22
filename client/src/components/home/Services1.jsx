import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Button, Heading, Text } from '../ui'
import {
  concernThemes,
  subscriptionIncludes,
  subscriptionCaveat,
} from '../../data/homeContent'
import windowLight from '../../assets/home-window.jpg'

/**
 * Handcrafted drawn line motifs for each of the 5 concern themes.
 * (One stroke weight, matching the brand's calm aesthetic)
 */
const THEME_MOTIFS = {
  mood: (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="size-full">
      <path d="M6 34c5-9 11-9 16 0s11 9 16 0 11-9 16 0 2 3.5 4 4.5" opacity="0.4" />
      <path d="M8 26c6-10 12-10 18 0s12 10 18 0c4.5-7.5 9-6 12-1" />
      <circle cx="48" cy="18" r="4" strokeWidth="1.5" className="stroke-gold" />
      <line x1="8" y1="46" x2="56" y2="46" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
      <path d="M14 42c8-4 16-4 24 0s16 4 20 0" opacity="0.6" />
    </svg>
  ),
  relationships: (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="size-full">
      <circle cx="26" cy="32" r="16" stroke="currentColor" opacity="0.8" />
      <circle cx="38" cy="32" r="16" className="stroke-gold" strokeWidth="1.75" />
      <path d="M32 20c3.5 3.5 5 8 5 12s-1.5 8.5-5 12c-3.5-3.5-5-8-5-12s1.5-8.5 5-12z" className="stroke-sage fill-sage/15" />
      <circle cx="32" cy="32" r="2.5" className="fill-gold" />
    </svg>
  ),
  trauma: (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="size-full">
      <path d="M32 54V24" stroke="currentColor" />
      <path d="M32 24c0-10 8-16 18-16 0 10-8 18-18 16z" className="stroke-sage fill-sage/20" />
      <path d="M32 34c0-8-6-13-14-13 0 8 6 14 14 13z" stroke="currentColor" opacity="0.7" />
      <path d="M12 54h40" strokeWidth="1" opacity="0.3" />
      <circle cx="42" cy="14" r="1.5" className="fill-gold" />
    </svg>
  ),
  habits: (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="size-full">
      <path d="M32 32a6 6 0 0 1 6 6c0 6-6 10-12 10s-14-6-14-14 8-18 18-18 22 8 22 20c0 4-1 8-3 11" stroke="currentColor" strokeLinecap="round" />
      <path d="M47 47l6 6" className="stroke-gold" strokeWidth="2" />
      <circle cx="32" cy="32" r="2" className="fill-sage" />
      <path d="M18 18l4-4" opacity="0.4" />
    </svg>
  ),
  self: (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="size-full">
      <polygon points="32,8 54,24 54,48 32,58 10,48 10,24" stroke="currentColor" opacity="0.4" />
      <polygon points="32,16 46,27 46,43 32,50 18,43 18,27" className="stroke-sage fill-sage/15" strokeWidth="1.75" />
      <line x1="32" y1="16" x2="32" y2="50" className="stroke-gold" strokeWidth="1.2" opacity="0.7" />
      <line x1="18" y1="27" x2="46" y2="43" stroke="currentColor" opacity="0.3" />
      <line x1="18" y1="43" x2="46" y2="27" stroke="currentColor" opacity="0.3" />
      <circle cx="32" cy="33" r="3" className="fill-gold" />
    </svg>
  ),
}

function CheckTickIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  )
}

/**
 * Styling configurations for each card:
 * 1 deep ink, 2 ink, 2 mist — fully borderless with soft elevation shadows
 */
const CARD_THEMES = [
  // 01: Mood (Anxiety and low mood) — Ink Deep
  {
    bg: 'bg-ink-deep',
    subheading: 'text-paper/50',
    titleTone: 'inverse',
    blurbClass: 'text-paper/70',
    stepBorder: 'border-gold',
    stepBg: 'bg-gold/10',
    stepText: 'text-gold',
    spineLine: 'from-gold/60 via-paper/10 to-transparent',
    iconBox: 'bg-paper/5 text-sage',
    watermarkColor: 'text-paper',
    watermarkOpacity: 'opacity-[0.04]',
    divider: 'border-paper/12',
    specHeading: 'text-paper/60',
    tagBg: 'bg-paper/[0.05]',
    tagBorder: 'border-paper/10',
    tagText: 'text-paper/85',
    tagTick: 'text-sage',
    shadow: 'shadow-[0_-8px_36px_-6px_rgba(0,0,0,0.85)]',
  },
  // 02: Relationships — Ink
  {
    bg: 'bg-ink',
    subheading: 'text-paper/50',
    titleTone: 'inverse',
    blurbClass: 'text-paper/70',
    stepBorder: 'border-gold',
    stepBg: 'bg-gold/10',
    stepText: 'text-gold',
    spineLine: 'from-gold/60 via-paper/10 to-transparent',
    iconBox: 'bg-paper/5 text-sage',
    watermarkColor: 'text-paper',
    watermarkOpacity: 'opacity-[0.04]',
    divider: 'border-paper/12',
    specHeading: 'text-paper/60',
    tagBg: 'bg-paper/[0.05]',
    tagBorder: 'border-paper/10',
    tagText: 'text-paper/85',
    tagTick: 'text-sage',
    shadow: 'shadow-[0_-8px_36px_-6px_rgba(0,0,0,0.75)]',
  },
  // 03: Trauma — Ink
  {
    bg: 'bg-ink',
    subheading: 'text-paper/50',
    titleTone: 'inverse',
    blurbClass: 'text-paper/70',
    stepBorder: 'border-gold',
    stepBg: 'bg-gold/10',
    stepText: 'text-gold',
    spineLine: 'from-gold/60 via-paper/10 to-transparent',
    iconBox: 'bg-paper/5 text-sage',
    watermarkColor: 'text-paper',
    watermarkOpacity: 'opacity-[0.04]',
    divider: 'border-paper/12',
    specHeading: 'text-paper/60',
    tagBg: 'bg-paper/[0.05]',
    tagBorder: 'border-paper/10',
    tagText: 'text-paper/85',
    tagTick: 'text-sage',
    shadow: 'shadow-[0_-8px_36px_-6px_rgba(0,0,0,0.75)]',
  },
  // 04: Habits — Mist (Light)
  {
    bg: 'bg-mist',
    subheading: 'text-ink/55',
    titleTone: 'default',
    blurbClass: 'text-ink/75',
    stepBorder: 'border-ink',
    stepBg: 'bg-ink',
    stepText: 'text-paper',
    spineLine: 'from-ink/50 via-ink/15 to-transparent',
    iconBox: 'bg-ink/6 text-sage-deep',
    watermarkColor: 'text-ink',
    watermarkOpacity: 'opacity-[0.05]',
    divider: 'border-ink/12',
    specHeading: 'text-ink/70',
    tagBg: 'bg-paper',
    tagBorder: 'border-ink/8',
    tagText: 'text-ink/90',
    tagTick: 'text-sage-deep',
    shadow: 'shadow-[0_-8px_30px_-6px_rgba(0,0,0,0.22)]',
  },
  // 05: Self — Mist (Light)
  {
    bg: 'bg-mist',
    subheading: 'text-ink/55',
    titleTone: 'default',
    blurbClass: 'text-ink/75',
    stepBorder: 'border-ink',
    stepBg: 'bg-ink',
    stepText: 'text-paper',
    spineLine: 'from-ink/50 via-ink/15 to-transparent',
    iconBox: 'bg-ink/6 text-sage-deep',
    watermarkColor: 'text-ink',
    watermarkOpacity: 'opacity-[0.05]',
    divider: 'border-ink/12',
    specHeading: 'text-ink/70',
    tagBg: 'bg-paper',
    tagBorder: 'border-ink/8',
    tagText: 'text-ink/90',
    tagTick: 'text-sage-deep',
    shadow: 'shadow-[0_-8px_30px_-6px_rgba(0,0,0,0.22)]',
  },
]

export default function Services1() {
  const reduceMotion = useReducedMotion()

  return (
    <>
      <section aria-labelledby="services-heading">
        {/* Section Intro */}
        <div data-surface="dark" className="bg-ink-deep">
          <div className="mx-auto w-full max-w-7xl px-5 pb-14 pt-24 sm:px-8 lg:pb-16 lg:pt-32">
            <Heading level={2} id="services-heading" tone="inverse" className="max-w-[20ch]">
              What people bring us.
            </Heading>
            <Text tone="inverse" className="mt-7 max-w-measure opacity-80">
              Cast of Minds is online therapy with one therapist you keep: a weekly session over Video meeting, and unlimited chat in between.
            </Text>
            <Text tone="inverse" className="mt-5 max-w-measure opacity-80">
              Therapists tag the areas they work in. You tag what you are going
              through, and we match where those overlap. Where you live and what
              time zone you are in never narrow the list.
            </Text>
          </div>
        </div>

        {/* Stacking Cards Deck */}
        <div className="relative bg-ink-deep py-6 lg:py-10">
          {concernThemes.map((theme, index) => {
            const c = CARD_THEMES[index] || CARD_THEMES[0]
            const stepNumber = String(index + 1).padStart(2, '0')

            return (
              <div
                key={theme.id}
                className="sticky mb-6 px-4 sm:px-6 lg:px-8"
                style={{
                  top: `calc(5rem + ${index * 20}px)`,
                  zIndex: index + 1,
                }}
              >
                {/* BORDERLESS CARD CONTAINER */}
                <div
                  className={`relative mx-auto w-full max-w-5xl rounded-3xl ${c.bg} p-6 sm:p-8 lg:p-10 ${c.shadow} overflow-hidden`}
                >
                  {/* Large Background Watermark SVG */}
                  <div
                    aria-hidden="true"
                    className={`pointer-events-none absolute -bottom-6 -right-6 size-48 sm:size-64 ${c.watermarkOpacity} ${c.watermarkColor}`}
                  >
                    {THEME_MOTIFS[theme.id]}
                  </div>

                  {/* Card Inner Flex: Left Spine + Right Content */}
                  <div className="relative z-10 flex items-stretch gap-4 sm:gap-7">
                    
                    {/* Left Timeline Spine */}
                    <div className="flex shrink-0 flex-col items-center pt-1">
                      <div
                        className={`flex size-8 sm:size-9 items-center justify-center rounded-full border ${c.stepBorder} ${c.stepBg} ${c.stepText} font-mono text-xs font-bold tabular-nums shadow-xs`}
                      >
                        {stepNumber}
                      </div>
                      <div className={`my-3 w-px flex-1 bg-gradient-to-b ${c.spineLine}`} />
                    </div>

                    {/* Main Card Content */}
                    <div className="min-w-0 flex-1">
                      
                      {/* Header: Title + Top-Right Emblem Icon */}
                      <div className="mb-3 flex items-start justify-between gap-4">
                        <div>
                          <span className={`font-mono text-[11px] uppercase tracking-widest ${c.subheading}`}>
                            Focus Area {stepNumber}
                          </span>
                          <Heading
                            level={3}
                            size="subsection"
                            tone={c.titleTone}
                            className="mt-0.5 tracking-tight"
                          >
                            {theme.name}
                          </Heading>
                        </div>

                        {/* Top-Right Borderless Emblem Icon Container */}
                        <div
                          aria-hidden="true"
                          className={`flex size-11 sm:size-12 shrink-0 items-center justify-center rounded-2xl p-2.5 ${c.iconBox}`}
                        >
                          {THEME_MOTIFS[theme.id]}
                        </div>
                      </div>

                      {/* Blurb */}
                      <Text size="ui" className={`max-w-measure leading-relaxed ${c.blurbClass}`}>
                        {theme.blurb}
                      </Text>

                      {/* Visible Divider Line */}
                      <div className={`my-5 w-full border-t ${c.divider}`} />

                      {/* Clinical Specialties Heading + Checked Tags */}
                      <div>
                        <div className={`mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider ${c.specHeading}`}>
                          <span>Clinical Specialties:</span>
                        </div>

                        <ul className="flex flex-wrap gap-2">
                          {theme.tags.map((tag) => (
                            <li
                              key={tag}
                              className={`inline-flex items-center gap-2 rounded-xl border ${c.tagBorder} ${c.tagBg} px-3 py-1.5 text-ui font-normal ${c.tagText} shadow-xs transition-transform duration-150 hover:scale-[1.02]`}
                            >
                              <CheckTickIcon className={`size-3.5 shrink-0 ${c.tagTick}`} />
                              <span>{tag}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                    </div>

                  </div>
                </div>
              </div>
            )
          })}

          {/* Spacer so the last card has room to fully stack */}
          <div className="h-[40vh]" />
        </div>

        {/* Transition photograph */}
        {/* <div className="relative bg-paper">
          <img
            src={windowLight}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className="h-64 w-full object-cover object-center sm:h-80 lg:h-112"
          />
          <div aria-hidden="true" className="absolute inset-0 bg-ink-deep/14" />
        </div> */}
      </section>

      {/* Plan & Pricing Section */}
      <section
        aria-labelledby="plan-heading"
        data-surface="dark"
        className="bg-ink-deep"
      >
        <div className="mx-auto grid w-full max-w-7xl gap-x-12 gap-y-10 px-5 py-20 sm:px-8 lg:grid-cols-12 lg:py-24">
          <div className="lg:col-span-5">
            <Heading level={2} id="plan-heading" size="section" tone="inverse">
              One plan.
            </Heading>
            <p className="mt-6 font-display text-section text-gold">€250 a month</p>
            <Text size="ui" className="mt-6 max-w-measure text-paper/75">
              {subscriptionCaveat}
            </Text>
            <Button as={Link} to="/questionnaire" size="lg" className="mt-8">
              Get started
            </Button>
          </div>

          <ul className="space-y-5 lg:col-span-6 lg:col-start-7">
            {subscriptionIncludes.map((item) => (
              <li key={item} className="flex gap-4">
                <svg
                  viewBox="0 0 20 20"
                  className="mt-1.5 h-4 w-4 shrink-0 text-sage"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M4 10.5 8 14.5 16 6"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <Text className="max-w-measure text-paper/85">{item}</Text>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}