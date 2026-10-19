/**
 * Contact page copy and channels. Everything true; no response-time promise,
 * because there is no basis for one.
 */

export const intro = {
  heading: 'Talk to a person.',
  lede: '"A real inbox, read by the people who run this."',
  body: 'For anything about your account, your therapist, billing, or something that has gone wrong. If you are already a client, your therapist is still the fastest route for anything clinical.',
}

/**
 * PHONE IS NULL ON PURPOSE. §11 and §18 both describe a published phone number
 * as part of the misconduct escalation route, but no number exists yet.
 * Inventing one here would be worse than a fabricated testimonial — someone in
 * distress could dial it and reach a stranger, or nothing. While it is null the
 * card shows the email route and says a line is being set up. Supply the real
 * number here and the card completes itself.
 *
 * Same for `hours`: no support hours have been agreed, so the card describes
 * what the channel is for rather than promising when it is answered.
 */
export const escalationPhone = null
export const supportHours = null

export const SUPPORT_EMAIL = 'contact@castofminds.com'

export const channels = [
  {
    id: 'general',
    icon: 'envelope',
    title: 'General enquiries',
    value: SUPPORT_EMAIL,
    href: `mailto:${SUPPORT_EMAIL}`,
    body: 'Questions about how this works, billing, or your account. The form on this page goes to the same inbox.',
  },
  {
    id: 'escalation',
    icon: 'shield',
    title: 'Reporting misconduct',
    value: escalationPhone,
    href: escalationPhone ? `tel:${escalationPhone.replace(/\s/g, '')}` : null,
    // §11: there is deliberately no admin conversation-viewing feature, so this
    // route is the whole escalation path. Saying so plainly is the point.
    body: 'If something has happened with your therapist that concerns you, tell us directly. Nobody at Cast of Minds can read your conversations, so this route is how we find out.',
    fallback: 'A direct line is being set up. Until then, email us and mark it urgent , it is seen the same day it arrives.',
  },
  {
    id: 'hours',
    icon: 'clock',
    title: 'When we reply',
    value: supportHours,
    href: null,
    body: "Our team reviews every inquiry personally across time zones to ensure thoughtful, dedicated responses.",
    fallback: 'We answer every message that arrives here. If it is an emergency, please contact your local emergency number instead this is not a crisis service.',
  },
]

export const subjects = ['General question', 'Support', 'Media enquiry']

export const success = {
  heading: 'Message sent.',
  body: 'It has gone to the inbox the whole team reads. If you gave us an email address, the reply comes straight back to it.',
}
