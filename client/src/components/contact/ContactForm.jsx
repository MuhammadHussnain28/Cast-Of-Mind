import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Button, Heading, Input, Select, Text, Textarea } from '../ui'
import FormAlert from '../auth/FormAlert'
import { sendContactMessage } from '../../lib/api/contactApi'
import { toApiError } from '../../lib/api/ApiError'
import { contactSchema } from '../../lib/validation/contact'
import { zodErrorsToFieldMap } from '../../lib/validation/fieldErrors'
import { subjects, success } from '../../data/contactContent'

const EMPTY = { name: '', email: '', subject: '', message: '', website: '' }

export default function ContactForm() {
  const reduceMotion = useReducedMotion()
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const set = (field) => (event) => {
    setValues((v) => ({ ...v, [field]: event.target.value }))
    // Clear a field's error as soon as it is touched — leaving it there while
    // someone fixes it reads as though the fix did not register.
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError(null)

    const parsed = contactSchema.safeParse(values)
    if (!parsed.success) {
      setErrors(zodErrorsToFieldMap(parsed.error))
      return
    }

    setErrors({})
    setSending(true)
    try {
      await sendContactMessage({ ...parsed.data, website: values.website })
      setSent(true)
    } catch (err) {
      setFormError(toApiError(err).message)
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-2xl bg-mist p-8 sm:p-10"
        // Announced without stealing focus mid-action.
        role="status"
        aria-live="polite"
      >
        <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-full bg-paper ring-1 ring-sage/30">
          <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-sage" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12.5 9.5 18 20 7" />
          </svg>
        </span>
        <Heading level={2} className="mt-6">
          {success.heading}
        </Heading>
        <Text tone="muted" className="mt-4 max-w-measure">
          {success.body}
        </Text>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-5">
      {formError && <FormAlert>{formError}</FormAlert>}

      <Input
        label="Your name"
        required
        value={values.name}
        onChange={set('name')}
        error={errors.name}
        autoComplete="name"
        placeholder="How should we address you?"
      />

      <Input
        label="Email"
        type="email"
        required
        value={values.email}
        onChange={set('email')}
        error={errors.email}
        autoComplete="email"
        placeholder="Where the reply should go"
      />

      <Select
        label="What is this about?"
        value={values.subject}
        onChange={set('subject')}
        error={errors.subject}
        placeholder="Choose one"
        options={subjects.map((s) => ({ value: s, label: s }))}
      />

      <Textarea
        label="Your message"
        required
        rows={7}
        value={values.message}
        onChange={set('message')}
        error={errors.message}
        placeholder="Take as much space as you need."
      />

      {/* Honeypot. Hidden from people, filled by bots — the server discards any
          submission that has it set. Not `display:none`, which some bots skip:
          moved off-screen instead, and taken out of the tab order. */}

      <div aria-hidden="true" className="absolute left-[-9999px] h-px w-px overflow-hidden">

        <label htmlFor="contact-website">Do not fill this in</label>
        <input
          id="contact-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={set('website')}
        />
      </div>

      <Button type="submit" size="lg" loading={sending} className="mt-2 justify-self-start">
        {sending ? 'Sending' : 'Send message'}
      </Button>
    </form>
  )
}
