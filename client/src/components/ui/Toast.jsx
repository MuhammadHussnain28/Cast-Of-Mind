import { useCallback, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { cx } from '../../lib/cx'
import { ToastContext } from './toastContext'

const TONES = {
  neutral: 'bg-ink text-paper border-ink',
  success: 'bg-paper text-ink-deep border-sage',
  error: 'bg-paper text-ink-deep border-clay',
}
const RULE = { neutral: 'bg-gold', success: 'bg-sage-deep', error: 'bg-clay' }

export function ToastProvider({ children, duration = 5000 }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())
  const reduce = useReducedMotion()

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const push = useCallback(
    (message, tone = 'neutral') => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
      setToasts((list) => [...list, { id, message, tone }])
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), duration),
      )
      return id
    },
    [dismiss, duration],
  )

  const api = useMemo(
    () => ({
      show: push,
      success: (m) => push(m, 'success'),
      error: (m) => push(m, 'error'),
      dismiss,
    }),
    [push, dismiss],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <div
            // polite + status: announced without cutting off what the user is doing
            role="status"
            aria-live="polite"
            className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-3 p-4 sm:items-end"
          >
            <AnimatePresence initial={false}>
              {toasts.map((t) => (
                <motion.div
                  key={t.id}
                  layout={!reduce}
                  initial={reduce ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className={cx(
                    'pointer-events-auto flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-xl border p-4',
                    TONES[t.tone],
                  )}
                  {...(t.tone === 'neutral' ? { 'data-surface': 'dark' } : {})}
                >
                  <span className={cx('mt-0.5 h-5 w-1 shrink-0 rounded-full', RULE[t.tone])} />
                  <p className="flex-1 font-body text-caption leading-relaxed">{t.message}</p>
                  <button
                    type="button"
                    onClick={() => dismiss(t.id)}
                    aria-label="Dismiss notification"
                    className={cx(
                      '-m-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg',
                      'transition-colors duration-200',
                      t.tone === 'neutral' ? 'hover:bg-paper/15' : 'hover:bg-ink/8',
                    )}
                  >
                    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden="true">
                      <path
                        d="M4 4l8 8M12 4l-8 8"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  )
}

export default ToastProvider
