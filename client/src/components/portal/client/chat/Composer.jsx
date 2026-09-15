import { useCallback, useEffect, useRef, useState } from 'react'
import { cx } from '../../../../lib/cx'
import { chat } from '../../../../data/chatContent'
import { SendIcon } from './ChatIcons'

const MESSAGE_TEXT_MAX = 5000
// Only shown when it starts to matter. A permanent counter on a therapy
// message reads as a word limit on how much you are allowed to feel.
const COUNTER_FROM = 4500

/**
 * Where the message gets written.
 *
 * ENTER SENDS ON A POINTER DEVICE; ON TOUCH IT MAKES A NEW LINE. Approved
 * 2026-09-14. A phone's return key is how people break a line and there is no
 * Shift to hold, so sending on Enter there would fire half-finished sentences.
 * The send button is always present and is the only send path on touch.
 */
export default function Composer({ onSend, onTyping, onStopTyping, disabled }) {
  const [value, setValue] = useState('')
  const textareaRef = useRef(null)

  // `pointer: coarse` is the platform's own answer to "is this a touch device",
  // rather than sniffing the user agent.
  const [coarsePointer, setCoarsePointer] = useState(false)
  useEffect(() => {
    const query = window.matchMedia?.('(pointer: coarse)')
    if (!query) return undefined
    const apply = () => setCoarsePointer(query.matches)
    apply()
    query.addEventListener?.('change', apply)
    return () => query.removeEventListener?.('change', apply)
  }, [])

  // Grows with the text, up to a ceiling, so a long message is visible while
  // being written without swallowing the conversation above it.
  const resize = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 168)}px`
  }, [])

  useEffect(resize, [value, resize])

  const submit = () => {
    const text = value.trim()
    if (!text || disabled) return
    onSend(text)
    setValue('')
    onStopTyping?.()
    // Height resets with the value; focus stays so a reply can follow.
    requestAnimationFrame(() => textareaRef.current?.focus())
  }

  const handleKeyDown = (event) => {
    if (event.key !== 'Enter') return
    if (coarsePointer) return // the return key makes a new line on a phone
    if (event.shiftKey) return // an explicit new line on a keyboard
    event.preventDefault()
    submit()
  }

  const over = value.length > MESSAGE_TEXT_MAX
  const showCounter = value.length >= COUNTER_FROM

  return (
    <form
      className="shrink-0 border-t border-ink/12 bg-paper px-3 py-3 sm:px-4"
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      <div className="mx-auto flex w-full max-w-3xl items-end gap-2">
        <label htmlFor="chat-composer" className="sr-only">
          {chat.composerLabel}
        </label>

        <textarea
          id="chat-composer"
          ref={textareaRef}
          rows={1}
          value={value}
          disabled={disabled}
          onChange={(event) => {
            setValue(event.target.value)
            onTyping?.()
          }}
          onBlur={() => onStopTyping?.()}
          onKeyDown={handleKeyDown}
          placeholder={chat.composerPlaceholder}
          className={cx(
            'min-h-11 flex-1 resize-none rounded-2xl bg-mist px-4 py-3',
            'font-body text-ui text-ink-deep placeholder:text-ink/60',
            'outline-none transition-shadow duration-200',
            'focus-visible:ring-2 focus-visible:ring-sage',
            disabled && 'cursor-not-allowed opacity-60',
          )}
        />

        <button
          type="submit"
          disabled={disabled || !value.trim() || over}
          aria-label={chat.send}
          className={cx(
            'flex size-11 shrink-0 items-center justify-center rounded-full',
            'border border-ink/50 bg-gold text-ink',
            'transition-[opacity,transform] duration-200 ease-out',
            'hover:scale-[1.03] active:scale-100',
            'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100',
          )}
        >
          <SendIcon />
        </button>
      </div>

      {showCounter && (
        <p
          className={cx(
            'mx-auto mt-2 w-full max-w-3xl text-right font-body text-caption tabular-nums',
            over ? 'text-clay' : 'text-ink/70',
          )}
        >
          {value.length.toLocaleString()} / {MESSAGE_TEXT_MAX.toLocaleString()}
        </p>
      )}
    </form>
  )
}
