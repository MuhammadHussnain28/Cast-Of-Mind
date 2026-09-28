import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

const MILESTONES = [
  {
    id: 1,
    tag: '01 · INTAKE',
    title: 'Answer & Tag',
    badge: '100% Free',
    badgeStyle: 'bg-mist text-ink/75 border border-ink/10',
    detail: 'Complete a gentle 2-minute questionnaire and pick 3–4 concern tags from our 27 clinical terms. 100% free, no card or account needed.',
    surface: 'bg-paper text-ink border-white',
  },
  {
    id: 2,
    tag: '02 · MATCH',
    title: 'You Choose',
    badge: 'No Assignment',
    badgeStyle: 'bg-mist text-ink/75 border border-ink/10',
    detail: 'Review matched therapist profiles (bios, credentials, specialties, photo) and you pick who you want. Nobody is assigned to you.',
    surface: 'bg-paper text-ink border-white',
  },
  {
    id: 3,
    tag: '03 · SUBSCRIBE',
    title: 'Monthly Plan',
    badge: 'Cancel Anytime',
    badgeStyle: 'bg-mist text-ink/75 border border-ink/10',
    detail: 'One transparent monthly plan. Secure hosted checkout, with your login credentials automatically emailed to you instantly.',
    surface: 'bg-paper text-ink border-white',
  },
  {
    id: 4,
    tag: '04 · THERAPY',
    title: 'Zoom & Chat',
    badge: 'Private Care',
    badgeStyle: 'bg-gold text-ink font-bold shadow-xs',
    detail: 'Send your mandatory first message, meet on weekly 1-on-1 Zoom sessions in your timezone, and access 24/7 unlimited chat & worksheets.',
    surface: 'bg-paper text-ink border-2 border-gold ring-2 ring-gold/25',
  },
]

export default function HowItWorksPathwayModern() {
  const [activeId, setActiveId] = useState(1)
  const reduceMotion = useReducedMotion()

  const activeMilestone = MILESTONES.find((m) => m.id === activeId) || MILESTONES[0]

  // 15% Faster Floating Animation (approx 3.5s to 4.4s)
  const floatAnim = (duration, delay) =>
    reduceMotion
      ? {}
      : {
          animate: { y: [0, -5, 0] },
          transition: { duration, delay, repeat: Infinity, ease: 'easeInOut' },
        }

  return (
    <div className="relative w-full max-w-[420px] mx-auto select-none">
      {/* 4-Circle Connected Interactive Canvas */}
      <div className="relative h-[410px] w-full max-w-[340px] sm:max-w-[400px] mx-auto flex items-center justify-center">
        
        {/* SVG Connecting Solid Arrows */}
        <svg
          viewBox="0 0 340 410"
          className="absolute inset-0 w-full h-full pointer-events-none z-0"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <marker id="arrowhead-solid-white" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
              <polygon points="0 0, 7 3.5, 0 7" fill="#FFFFFF" />
            </marker>
          </defs>

          {/* Line 1: Circle 1 (Top-Left) -> Circle 2 (Top-Right) [Solid White] */}
          <path
            d="M 120 60 Q 170 48 220 60"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinecap="round"
            markerEnd="url(#arrowhead-solid-white)"
          />

          {/* Line 2: Circle 2 (Top-Right) -> Circle 3 (Center-Left) [Solid White] */}
          <path
            d="M 215 115 Q 170 155 125 195"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinecap="round"
            markerEnd="url(#arrowhead-solid-white)"
          />

          {/* Line 3: Circle 3 (Center-Left) -> Circle 4 (Bottom-Right) [Solid White] */}
          <path
            d="M 125 270 Q 170 315 215 335"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinecap="round"
            markerEnd="url(#arrowhead-solid-white)"
          />
        </svg>

        {/* --- CIRCLE 01: Top-Left (Intake) --- */}
        <motion.div
          {...floatAnim(3.5, 0)}
          onClick={() => setActiveId(1)}
          className={`
            absolute left-1 top-1 w-[122px] h-[122px] sm:w-[134px] sm:h-[134px]
            rounded-full shadow-2xl border z-10 flex flex-col items-center justify-center
            p-2 text-center cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95
            ${MILESTONES[0].surface}
            ${activeId === 1 ? 'ring-4 ring-gold/40' : ''}
          `}
        >
          <span className="text-[8px] font-mono font-bold text-sage-deep bg-sage/15 px-2 py-0.5 rounded-full mb-1">
            {MILESTONES[0].tag}
          </span>
          <h4 className="font-bold text-xs text-ink leading-tight">{MILESTONES[0].title}</h4>
          <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full mt-1 ${MILESTONES[0].badgeStyle}`}>
            {MILESTONES[0].badge}
          </span>
        </motion.div>

        {/* --- CIRCLE 02: Top-Right (Match & Choose) --- */}
        <motion.div
          {...floatAnim(4.0, 0.3)}
          onClick={() => setActiveId(2)}
          className={`
            absolute right-1 top-1 w-[122px] h-[122px] sm:w-[134px] sm:h-[134px]
            rounded-full shadow-2xl border z-10 flex flex-col items-center justify-center
            p-2 text-center cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95
            ${MILESTONES[1].surface}
            ${activeId === 2 ? 'ring-4 ring-gold/40' : ''}
          `}
        >
          <span className="text-[8px] font-mono font-bold text-sage-deep bg-sage/15 px-2 py-0.5 rounded-full mb-1">
            {MILESTONES[1].tag}
          </span>
          <h4 className="font-bold text-xs text-ink leading-tight">{MILESTONES[1].title}</h4>
          <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full mt-1 ${MILESTONES[1].badgeStyle}`}>
            {MILESTONES[1].badge}
          </span>
        </motion.div>

        {/* --- CIRCLE 03: Center-Left (Subscribe) --- */}
        <motion.div
          {...floatAnim(4.4, 0.6)}
          onClick={() => setActiveId(3)}
          className={`
            absolute left-1 top-[170px] sm:top-[180px] w-[122px] h-[122px] sm:w-[134px] sm:h-[134px]
            rounded-full shadow-2xl border z-10 flex flex-col items-center justify-center
            p-2 text-center cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95
            ${MILESTONES[2].surface}
            ${activeId === 3 ? 'ring-4 ring-gold/40' : ''}
          `}
        >
          <span className="text-[8px] font-mono font-bold text-sage-deep bg-sage/15 px-2 py-0.5 rounded-full mb-1">
            {MILESTONES[2].tag}
          </span>
          <h4 className="font-bold text-xs text-ink leading-tight">{MILESTONES[2].title}</h4>
          <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full mt-1 ${MILESTONES[2].badgeStyle}`}>
            {MILESTONES[2].badge}
          </span>
        </motion.div>

        {/* --- CIRCLE 04: Bottom-Right (Therapy Sanctuary) --- */}
        <motion.div
          {...floatAnim(3.8, 0.9)}
          onClick={() => setActiveId(4)}
          className={`
            absolute right-1 bottom-1 w-[126px] h-[126px] sm:w-[138px] sm:h-[138px]
            rounded-full shadow-2xl z-10 flex flex-col items-center justify-center
            p-2 text-center cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95
            ${MILESTONES[3].surface}
            ${activeId === 4 ? 'ring-4 ring-gold/50' : ''}
          `}
        >
          <span className="text-[8px] font-mono font-bold text-ink bg-gold/25 px-2 py-0.5 rounded-full mb-1">
            {MILESTONES[3].tag}
          </span>
          <h4 className="font-bold text-xs text-ink leading-tight">{MILESTONES[3].title}</h4>
          <span className={`text-[9px] px-2.5 py-0.5 rounded-full mt-1 ${MILESTONES[3].badgeStyle}`}>
            {MILESTONES[3].badge}
          </span>
        </motion.div>

      </div>

      {/* Interactive Micro-Detail Reassurance Bar */}
      <div className="mt-3 p-3 sm:p-3.5 rounded-2xl bg-paper/5 border border-paper/10 flex items-center justify-between gap-3 text-xs text-paper/85 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="text-gold text-sm">💡</span>
          <p className="leading-snug">
            <strong className="text-paper">{activeMilestone.tag}:</strong> {activeMilestone.detail}
          </p>
        </div>
        <span className="hidden sm:inline-block text-[10px] font-mono text-sage font-bold whitespace-nowrap">
          {activeId} OF 4
        </span>
      </div>
    </div>
  )
}
