// import { useState } from 'react'
// import { motion, useReducedMotion } from 'framer-motion'

// const MILESTONES = [
//   {
//     id: 1,
//     tag: '01 · INTAKE',
//     title: 'Answer & Tag',
//     badge: '€0 Free',
//     badgeStyle: 'bg-emerald-100 text-emerald-800',
//     detail: 'Complete a gentle 2-minute questionnaire and pick 3–4 concern tags from our 27 clinical terms. 100% free, no card or account needed.',
//     surface: 'bg-paper text-ink border-white/90',
//   },
//   {
//     id: 2,
//     tag: '02 · MATCH',
//     title: 'You Choose',
//     badge: 'No Assignment',
//     badgeStyle: 'bg-paper text-sage-deep border border-black/5',
//     detail: 'Review matched therapist profiles (bios, credentials, specialties, photo) and you pick who you want. Nobody is assigned to you.',
//     surface: 'bg-mist text-ink border-gold/60',
//   },
//   {
//     id: 3,
//     tag: '03 · SUBSCRIBE',
//     title: 'Flat €200 Plan',
//     badge: 'Cancel Anytime',
//     badgeStyle: 'bg-gold/30 text-ink font-bold',
//     detail: 'One transparent monthly plan. Secure hosted checkout, with your login credentials automatically emailed to you instantly.',
//     surface: 'bg-paper text-ink border-white/90',
//   },
//   {
//     id: 4,
//     tag: '04 · THERAPY',
//     title: 'Zoom & Chat',
//     badge: '4 Weekly Calls',
//     badgeStyle: 'bg-white/10 text-paper',
//     detail: 'Send your mandatory first message, meet on weekly 1-on-1 Zoom sessions in your timezone, and access 24/7 unlimited chat & worksheets.',
//     surface: 'bg-ink text-paper border-gold',
//   },
// ]

// export default function HowItWorksPathway() {
//   const [activeId, setActiveId] = useState(1)
//   const reduceMotion = useReducedMotion()

//   const activeMilestone = MILESTONES.find((m) => m.id === activeId) || MILESTONES[0]

//   // Gentle float animations for the 4 circles
//   const floatAnim = (duration, delay) =>
//     reduceMotion
//       ? {}
//       : {
//           animate: { y: [0, -4, 0] },
//           transition: { duration, delay, repeat: Infinity, ease: 'easeInOut' },
//         }

//   return (
//     <div className="relative w-full max-w-[420px] mx-auto select-none">
//       {/* 4-Circle Connected Interactive Canvas */}
//       <div className="relative h-[410px] w-full max-w-[340px] sm:max-w-[400px] mx-auto flex items-center justify-center">
        
//         {/* SVG Connecting Gradient Beams with Responsive ViewBox */}
//         <svg
//           viewBox="0 0 340 410"
//           className="absolute inset-0 w-full h-full pointer-events-none z-0"
//           xmlns="http://www.w3.org/2000/svg"
//         >
//           <defs>
//             <linearGradient id="beam-top" x1="0%" y1="0%" x2="100%" y2="0%">
//               <stop offset="0%" stopColor="#F5C518" stopOpacity="0.9" />
//               <stop offset="100%" stopColor="#7C9082" stopOpacity="0.9" />
//             </linearGradient>
//             <linearGradient id="beam-diagonal" x1="100%" y1="0%" x2="0%" y2="100%">
//               <stop offset="0%" stopColor="#7C9082" stopOpacity="0.9" />
//               <stop offset="100%" stopColor="#F5C518" stopOpacity="0.9" />
//             </linearGradient>
//             <linearGradient id="beam-bottom" x1="0%" y1="0%" x2="100%" y2="0%">
//               <stop offset="0%" stopColor="#F5C518" stopOpacity="0.9" />
//               <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.9" />
//             </linearGradient>

//             <marker id="arrowhead-sage" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
//               <path d="M0,0 L0,6 L6,3 z" fill="#7C9082" />
//             </marker>
//             <marker id="arrowhead-white" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
//               <path d="M0,0 L0,6 L6,3 z" fill="#FFFFFF" />
//             </marker>
//           </defs>

//           {/* Line 1: Circle 1 (Top-Left) -> Circle 2 (Top-Right) */}
//           <path
//             d="M 120 60 Q 170 48 220 60"
//             fill="none"
//             stroke="url(#beam-top)"
//             strokeWidth="2.5"
//             strokeDasharray={reduceMotion ? 'none' : '6 6'}
//             className={reduceMotion ? '' : 'motion-safe:animate-pulse'}
//             markerEnd="url(#arrowhead-sage)"
//           />

//           {/* Line 2: Circle 2 (Top-Right) -> Circle 3 (Center-Left) [CALIBRATED START] */}
//           <path
//             d="M 215 115 Q 170 155 125 195"
//             fill="none"
//             stroke="url(#beam-diagonal)"
//             strokeWidth="2.5"
//             strokeDasharray={reduceMotion ? 'none' : '6 6'}
//             className={reduceMotion ? '' : 'motion-safe:animate-pulse'}
//             markerEnd="url(#arrowhead-sage)"
//           />

//           {/* Line 3: Circle 3 (Center-Left) -> Circle 4 (Bottom-Right) */}
//           <path
//             d="M 125 270 Q 170 315 215 335"
//             fill="none"
//             stroke="url(#beam-bottom)"
//             strokeWidth="2.5"
//             strokeDasharray={reduceMotion ? 'none' : '6 6'}
//             className={reduceMotion ? '' : 'motion-safe:animate-pulse'}
//             markerEnd="url(#arrowhead-white)"
//           />
//         </svg>

//         {/* --- CIRCLE 01: Top-Left (Intake) --- */}
//         <motion.div
//           {...floatAnim(4.2, 0)}
//           onClick={() => setActiveId(1)}
//           className={`
//             absolute left-1 top-1 w-[122px] h-[122px] sm:w-[134px] sm:h-[134px]
//             rounded-full shadow-2xl border-2 z-10 flex flex-col items-center justify-center
//             p-2 text-center cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95
//             ${MILESTONES[0].surface}
//             ${activeId === 1 ? 'ring-4 ring-gold/40' : ''}
//           `}
//         >
//           <span className="text-[8px] font-mono font-bold text-sage-deep bg-sage/15 px-2 py-0.5 rounded-full mb-1">
//             {MILESTONES[0].tag}
//           </span>
//           <h4 className="font-bold text-xs text-ink leading-tight">{MILESTONES[0].title}</h4>
//           <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full mt-1 ${MILESTONES[0].badgeStyle}`}>
//             {MILESTONES[0].badge}
//           </span>
//         </motion.div>

//         {/* --- CIRCLE 02: Top-Right (Match & Choose) --- */}
//         <motion.div
//           {...floatAnim(4.8, 0.4)}
//           onClick={() => setActiveId(2)}
//           className={`
//             absolute right-1 top-1 w-[122px] h-[122px] sm:w-[134px] sm:h-[134px]
//             rounded-full shadow-2xl border-2 z-10 flex flex-col items-center justify-center
//             p-2 text-center cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95
//             ${MILESTONES[1].surface}
//             ${activeId === 2 ? 'ring-4 ring-gold/40' : ''}
//           `}
//         >
//           <span className="text-[8px] font-mono font-bold text-sage-deep bg-sage/15 px-2 py-0.5 rounded-full mb-1">
//             {MILESTONES[1].tag}
//           </span>
//           <h4 className="font-bold text-xs text-ink leading-tight">{MILESTONES[1].title}</h4>
//           <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full mt-1 ${MILESTONES[1].badgeStyle}`}>
//             {MILESTONES[1].badge}
//           </span>
//         </motion.div>

//         {/* --- CIRCLE 03: Center-Left (Subscribe) --- */}
//         <motion.div
//           {...floatAnim(5.2, 0.8)}
//           onClick={() => setActiveId(3)}
//           className={`
//             absolute left-1 top-[170px] sm:top-[180px] w-[122px] h-[122px] sm:w-[134px] sm:h-[134px]
//             rounded-full shadow-2xl border-2 z-10 flex flex-col items-center justify-center
//             p-2 text-center cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95
//             ${MILESTONES[2].surface}
//             ${activeId === 3 ? 'ring-4 ring-gold/40' : ''}
//           `}
//         >
//           <span className="text-[8px] font-mono font-bold text-sage-deep bg-sage/15 px-2 py-0.5 rounded-full mb-1">
//             {MILESTONES[2].tag}
//           </span>
//           <h4 className="font-bold text-xs text-ink leading-tight">{MILESTONES[2].title}</h4>
//           <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full mt-1 ${MILESTONES[2].badgeStyle}`}>
//             {MILESTONES[2].badge}
//           </span>
//         </motion.div>

//         {/* --- CIRCLE 04: Bottom-Right (Therapy Sanctuary) --- */}
//         <motion.div
//           {...floatAnim(4.5, 1.2)}
//           onClick={() => setActiveId(4)}
//           className={`
//             absolute right-1 bottom-1 w-[126px] h-[126px] sm:w-[138px] sm:h-[138px]
//             rounded-full shadow-2xl border-2 z-10 flex flex-col items-center justify-center
//             p-2 text-center cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95
//             ${MILESTONES[3].surface}
//             ${activeId === 4 ? 'ring-4 ring-gold/40' : ''}
//           `}
//         >
//           <span className="text-[8px] font-mono font-bold text-gold bg-gold/15 px-2 py-0.5 rounded-full mb-1">
//             {MILESTONES[3].tag}
//           </span>
//           <h4 className="font-bold text-xs text-paper leading-tight">{MILESTONES[3].title}</h4>
//           <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full mt-1 ${MILESTONES[3].badgeStyle}`}>
//             {MILESTONES[3].badge}
//           </span>
//         </motion.div>

//       </div>

//       {/* Interactive Micro-Detail Reassurance Bar */}
//       <div className="mt-3 p-3 sm:p-3.5 rounded-2xl bg-paper/5 border border-paper/10 flex items-center justify-between gap-3 text-xs text-paper/85 backdrop-blur-md">
//         <div className="flex items-center gap-2">
//           <span className="text-gold text-sm">💡</span>
//           <p className="leading-snug">
//             <strong className="text-paper">{activeMilestone.tag}:</strong> {activeMilestone.detail}
//           </p>
//         </div>
//         <span className="hidden sm:inline-block text-[10px] font-mono text-sage font-bold whitespace-nowrap">
//           {activeId} OF 4
//         </span>
//       </div>
//     </div>
//   )
// }


// -----------------------------------------------



import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

const MILESTONES = [
  {
    id: 1,
    tag: '01 · INTAKE',
    title: 'Answer & Tag',
    badge: '€0 Free',
    badgeStyle: 'bg-emerald-100 text-emerald-800',
    detail: 'Complete a gentle 2-minute questionnaire and pick 3–4 concern tags from our 27 clinical terms. 100% free, no card or account needed.',
    surface: 'bg-paper text-ink border-white/90',
  },
  {
    id: 2,
    tag: '02 · MATCH',
    title: 'You Choose',
    badge: 'No Assignment',
    badgeStyle: 'bg-paper text-sage-deep border border-black/5',
    detail: 'Review matched therapist profiles (bios, credentials, specialties, photo) and you pick who you want. Nobody is assigned to you.',
    surface: 'bg-mist text-ink border-gold/60',
  },
  {
    id: 3,
    tag: '03 · SUBSCRIBE',
    title: 'Flat €200 Plan',
    badge: 'Cancel Anytime',
    badgeStyle: 'bg-gold/30 text-ink font-bold',
    detail: 'One transparent monthly plan. Secure hosted checkout, with your login credentials automatically emailed to you instantly.',
    surface: 'bg-paper text-ink border-white/90',
  },
  {
    id: 4,
    tag: '04 · THERAPY',
    title: 'Video Meeting & Chat',
    badge: '4 Weekly Calls',
    badgeStyle: 'bg-white/10 text-paper',
    detail: 'Send your mandatory first message, meet on weekly 1-on-1 over video sessions in your timezone, and access 24/7 unlimited chat & worksheets.',
    surface: 'bg-ink text-paper border-gold',
  },
]

export default function HowItWorksPathway() {
  const [activeId, setActiveId] = useState(1)
  const reduceMotion = useReducedMotion()

  const activeMilestone = MILESTONES.find((m) => m.id === activeId) || MILESTONES[0]

  // Gentle float animations for the 4 circles
  const floatAnim = (duration, delay) =>
    reduceMotion
      ? {}
      : {
          animate: { y: [0, -4, 0] },
          transition: { duration, delay, repeat: Infinity, ease: 'easeInOut' },
        }

  return (
    <div className="relative w-full max-w-[420px] mx-auto select-none">
      {/* 4-Circle Connected Interactive Canvas */}
      <div className="relative h-[410px] w-full max-w-[340px] sm:max-w-[400px] mx-auto flex items-center justify-center">
        
        {/* SVG Connecting Gradient Beams with Pure White Solid Lines */}
        <svg
          viewBox="0 0 340 410"
          className="absolute inset-0 w-full h-full pointer-events-none z-0"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <marker id="arrowhead-white" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3 z" fill="#FFFFFF" />
            </marker>
          </defs>

          {/* Line 1: Circle 1 (Top-Left) -> Circle 2 (Top-Right) [Pure White] */}
          <path
            d="M 120 60 Q 170 48 220 60"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            markerEnd="url(#arrowhead-white)"
          />

          {/* Line 2: Circle 2 (Top-Right) -> Circle 3 (Center-Left) [Pure White] */}
          <path
            d="M 215 115 Q 170 155 125 195"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            markerEnd="url(#arrowhead-white)"
          />

          {/* Line 3: Circle 3 (Center-Left) -> Circle 4 (Bottom-Right) [Pure White] */}
          <path
            d="M 125 270 Q 170 315 215 335"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            markerEnd="url(#arrowhead-white)"
          />
        </svg>

        {/* --- CIRCLE 01: Top-Left (Intake) --- */}
        <motion.div
          {...floatAnim(4.2, 0)}
          onClick={() => setActiveId(1)}
          className={`
            absolute left-1 top-1 w-[122px] h-[122px] sm:w-[134px] sm:h-[134px]
            rounded-full shadow-2xl border-2 z-10 flex flex-col items-center justify-center
            p-2 text-center cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95
            ${MILESTONES[0].surface}
            ${activeId === 1 ? 'ring-4 ring-gold/40' : ''}
          `}
        >
          <span className="text-[8px] font-mono font-bold text-sage-deep bg-sage/15 px-2 py-0.5 rounded-full mb-1">
            {MILESTONES[0].tag}
          </span>
          <h4 className="font-bold text-xs text-ink leading-tight">{MILESTONES[0].title}</h4>
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full mt-1 ${MILESTONES[0].badgeStyle}`}>
            {MILESTONES[0].badge}
          </span>
        </motion.div>

        {/* --- CIRCLE 02: Top-Right (Match & Choose) --- */}
        <motion.div
          {...floatAnim(4.8, 0.4)}
          onClick={() => setActiveId(2)}
          className={`
            absolute right-1 top-1 w-[122px] h-[122px] sm:w-[134px] sm:h-[134px]
            rounded-full shadow-2xl border-2 z-10 flex flex-col items-center justify-center
            p-2 text-center cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95
            ${MILESTONES[1].surface}
            ${activeId === 2 ? 'ring-4 ring-gold/40' : ''}
          `}
        >
          <span className="text-[8px] font-mono font-bold text-sage-deep bg-sage/15 px-2 py-0.5 rounded-full mb-1">
            {MILESTONES[1].tag}
          </span>
          <h4 className="font-bold text-xs text-ink leading-tight">{MILESTONES[1].title}</h4>
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full mt-1 ${MILESTONES[1].badgeStyle}`}>
            {MILESTONES[1].badge}
          </span>
        </motion.div>

        {/* --- CIRCLE 03: Center-Left (Subscribe) --- */}
        <motion.div
          {...floatAnim(5.2, 0.8)}
          onClick={() => setActiveId(3)}
          className={`
            absolute left-1 top-[170px] sm:top-[180px] w-[122px] h-[122px] sm:w-[134px] sm:h-[134px]
            rounded-full shadow-2xl border-2 z-10 flex flex-col items-center justify-center
            p-2 text-center cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95
            ${MILESTONES[2].surface}
            ${activeId === 3 ? 'ring-4 ring-gold/40' : ''}
          `}
        >
          <span className="text-[8px] font-mono font-bold text-sage-deep bg-sage/15 px-2 py-0.5 rounded-full mb-1">
            {MILESTONES[2].tag}
          </span>
          <h4 className="font-bold text-xs text-ink leading-tight">{MILESTONES[2].title}</h4>
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full mt-1 ${MILESTONES[2].badgeStyle}`}>
            {MILESTONES[2].badge}
          </span>
        </motion.div>

        {/* --- CIRCLE 04: Bottom-Right (Therapy Sanctuary) --- */}
        <motion.div
          {...floatAnim(4.5, 1.2)}
          onClick={() => setActiveId(4)}
          className={`
            absolute right-1 bottom-1 w-[126px] h-[126px] sm:w-[138px] sm:h-[138px]
            rounded-full shadow-2xl border-2 z-10 flex flex-col items-center justify-center
            p-2 text-center cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95
            ${MILESTONES[3].surface}
            ${activeId === 4 ? 'ring-4 ring-gold/40' : ''}
          `}
        >
          <span className="text-[8px] font-mono font-bold text-gold bg-gold/15 px-2 py-0.5 rounded-full mb-1">
            {MILESTONES[3].tag}
          </span>
          <h4 className="font-bold text-xs text-paper leading-tight">{MILESTONES[3].title}</h4>
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full mt-1 ${MILESTONES[3].badgeStyle}`}>
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