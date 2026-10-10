import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from '../join/JoinIcons'
import { matches } from '../../data/matchesContent'
import { optimisedPhoto } from '../../lib/cloudinaryImage'

export default function TherapistCarousel({ therapists = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const isDragging = useRef(false)
  const startX = useRef(0)

  const total = therapists.length

  function handleNext() {
    if (currentIndex < total - 1) setCurrentIndex((i) => i + 1)
  }

  function handlePrev() {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1)
  }

  // Pointer Drag Support (Mouse & Touch Swipe)
  function onPointerDown(e) {
    isDragging.current = true
    startX.current = e.clientX
  }

  function onPointerUp(e) {
    if (!isDragging.current) return
    isDragging.current = false
    const diff = e.clientX - startX.current
    if (diff < -50) handleNext()
    else if (diff > 50) handlePrev()
  }

  function onPointerCancel() {
    isDragging.current = false
  }

  // Keyboard Arrow Navigation
  function handleKeyDown(e) {
    if (e.key === 'ArrowLeft') handlePrev()
    if (e.key === 'ArrowRight') handleNext()
  }

  if (total === 0) return null

  return (
    <div className="w-full select-none py-2">
      {/* Top Header Controls */}
      <div className="mb-6 flex items-center justify-between px-2">
        <span className="font-body text-ui font-medium text-ink">
          Showing <span className="font-semibold text-ink">{currentIndex + 1}</span> of{' '}
          <span className="font-semibold text-ink">{total}</span> therapists
        </span>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/20 bg-paper text-ink shadow-sm transition-all duration-200 hover:border-ink hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Previous therapist"
          >
            ←
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={currentIndex === total - 1}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/20 bg-paper text-ink shadow-sm transition-all duration-200 hover:border-ink hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Next therapist"
          >
            →
          </button>
        </div>
      </div>

      {/* 3D Spotlight Carousel Stage (Keyboard Accessible) */}
      <div
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        className="relative flex h-[540px] sm:h-[430px] w-full cursor-grab items-center justify-center overflow-hidden active:cursor-grabbing focus:outline-none"
        style={{ perspective: '1400px' }}
        aria-label="Therapist matches carousel. Use left and right arrow keys to navigate."
      >
        {therapists.map((therapist, index) => {
          const diff = index - currentIndex
          const isCenter = diff === 0
          const isLeft = diff === -1
          const isRight = diff === 1

          // 3D Matrix Transformations
          let transform = ''
          let opacity = 0
          let zIndex = 10
          let pointerEvents = 'none'

          if (isCenter) {
            transform = 'translateX(0px) translateZ(0px) scale(1)'
            opacity = 1
            zIndex = 30
            pointerEvents = 'auto'
          } else if (isLeft) {
            transform = 'translateX(-480px) translateZ(-50px) rotateY(12deg) scale(0.88)'
            opacity = 0.35
            zIndex = 20
            pointerEvents = 'auto'
          } else if (isRight) {
            transform = 'translateX(480px) translateZ(-50px) rotateY(-12deg) scale(0.88)'
            opacity = 0.35
            zIndex = 20
            pointerEvents = 'auto'
          } else if (diff < -1) {
            transform = 'translateX(-750px) translateZ(-100px) rotateY(20deg) scale(0.7)'
            opacity = 0
          } else {
            transform = 'translateX(750px) translateZ(-100px) rotateY(-20deg) scale(0.7)'
            opacity = 0
          }

          return (
            <div
              key={therapist.id}
              onClick={() => setCurrentIndex(index)}
              style={{
                transform,
                opacity,
                zIndex,
                pointerEvents,
                willChange: 'transform, opacity',
                backfaceVisibility: 'hidden',
              }}
              className="absolute w-[94vw] max-w-[750px] transition-all duration-500 ease-out"
            >
              <div
                className={`flex flex-col sm:flex-row overflow-hidden rounded-3xl border bg-paper transition-all duration-300 ${
                  isCenter
                    ? 'border-sage shadow-[0_20px_50px_-15px_rgba(25,18,43,0.25)] ring-1 ring-sage/50'
                    : 'border-ink/15 shadow-md'
                }`}
              >
                {/* LEFT: Crisp Full-Height HD Portrait */}
                <div className="relative h-44 sm:h-[370px] sm:w-[280px] shrink-0 overflow-hidden bg-mist border-b sm:border-b-0 sm:border-r border-ink/10">
                  <img
                    src={optimisedPhoto(therapist.photoUrl)}
                    alt={`${therapist.firstName} ${therapist.lastName}`}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover object-top"
                    draggable="false"
                  />

                  {/* Experience Badge */}
                  {therapist.yearsExperience && (
                    <div className="absolute bottom-3 left-3 rounded-lg bg-ink/90 px-2.5 py-1 font-body text-[11px] font-semibold text-paper shadow-sm">
                      {therapist.yearsExperience} yrs experience
                    </div>
                  )}
                </div>

                {/* RIGHT: Airy, High-Contrast Content Section */}
                <div className="flex flex-1 flex-col justify-between p-5 sm:p-8">
                  <div>
                    {/* Header: Name & Title */}
                    <div>
                      <h3 className="font-body text-xl sm:text-2xl font-bold text-ink leading-tight">
                        {therapist.title} {therapist.firstName} {therapist.lastName}
                        {therapist.credentialInitials && (
                          <span className="ml-2 font-body text-caption font-medium text-ink/75">
                            · {therapist.credentialInitials}
                          </span>
                        )}
                      </h3>
                      <p className="mt-1 font-body text-ui font-medium text-ink">
                        {therapist.therapistType}
                      </p>
                    </div>

                    {/* Specialty Tags */}
                    <div className="mt-3.5 flex flex-wrap gap-1.5">
                      {therapist.specialtyTags?.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-sage/20 border border-sage/30 px-3 py-0.5 font-body text-[11px] font-semibold text-ink"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Bio Snippet (Clear & Crisp) */}
                    <p className="mt-3.5 line-clamp-3 font-body text-ui text-ink/85 leading-relaxed font-normal">
                      {therapist.bio}
                    </p>
                  </div>

                  {/* Card Footer: Languages, Location & CTA Button */}
                  <div className="mt-5 border-t border-ink/10 pt-4 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-body text-caption font-semibold text-ink">
                        {therapist.languages?.join(', ')}
                      </span>
                      <span className="font-body text-[11px] font-medium text-ink/70">
                        {therapist.city ? `${therapist.city} · ` : ''}{therapist.timezone}
                      </span>
                    </div>

                    <Link
                      to={`/therapist/${therapist.id}`}
                      tabIndex={isCenter ? 0 : -1}
                      className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 font-body text-ui font-semibold text-paper transition-all duration-200 hover:bg-sage-deep shadow-sm"
                    >
                      {matches.viewProfile}
                      <ArrowRight aria-hidden="true" className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom Navigation Indicator Dots */}
      <div className="mt-6 flex items-center justify-center gap-2">
        {therapists.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setCurrentIndex(i)}
            className={`h-2.5 transition-all duration-300 rounded-full ${
              i === currentIndex ? 'w-8 bg-ink' : 'w-2.5 bg-ink/25 hover:bg-ink/50'
            }`}
            aria-label={`Go to therapist ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}