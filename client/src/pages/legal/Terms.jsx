import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heading, Text } from '../../components/ui'

const SECTIONS = [
  { id: 'introduction', label: '1. Operating Entity & Scope' },
  { id: 'therapists', label: '2. The Therapists & Services' },
  { id: 'crisis-disclaimer', label: '3. Crisis & Medical Disclaimer' },
  { id: 'account', label: '4. Your Account & Security' },
  { id: 'subscription', label: '5. Subscriptions & 4-Session Quota' },
  { id: 'cancellation', label: '6. Cancellations & Billing Renewals' },
  { id: 'intellectual-property', label: '7. Intellectual Property' },
  { id: 'privacy-boundaries', label: '8. Privacy, Reviews & Clinical Notes' },
  { id: 'platform-availability', label: '9. Availability & Limitations' },
  { id: 'governing-law', label: '10. Governing Law & Jurisdiction' },
]

export default function Terms() {
  const [activeSection, setActiveSection] = useState('introduction')

  const scrollToSection = (id) => {
    setActiveSection(id)
    const element = document.getElementById(id)
    if (element) {
      const yOffset = -90
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-paper pb-24 text-ink antialiased">
      {/* Page Header */}
      <section className="border-b border-ink/10 bg-mist/60 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-wider text-ink/60">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-paper px-3 py-1 shadow-xs border border-ink/10">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              Legal & Compliance
            </span>
            <span>Last updated: October 14, 2026</span>
          </div>

          <Heading level={1} size="section" className="mt-4 text-ink-deep">
            Terms of Service
          </Heading>

          <Text size="body" tone="muted" className="mt-4 max-w-3xl text-balance">
            These Terms of Service govern your access to and use of Cast of Minds. Please read them
            carefully before starting therapy. They explain your legal rights, our subscription model,
            and our strict clinical privacy boundaries.
          </Text>

          {/* Quick Meta Row */}
          <div className="mt-8 flex flex-wrap gap-6 text-sm text-ink/75 border-t border-ink/10 pt-6">
            <div>
              <span className="font-semibold text-ink">Entity:</span> Cast of Minds
            </div>
            <div>
              <span className="font-semibold text-ink">Operating base:</span> Karachi, Pakistan
            </div>
            <div>
              <span className="font-semibold text-ink">Support:</span>{' '}
              <a
                href="mailto:contact@castofminds.com"
                className="text-ink underline decoration-gold underline-offset-4 hover:text-ink-deep"
              >
                contact@castofminds.com
              </a>
            </div>
            <div>
              <span className="font-semibold text-ink">Billing:</span> EUR (€) monthly subscription
            </div>
          </div>
        </div>
      </section>

      {/* Immediate Crisis Alert Banner */}
      <div className="mx-auto max-w-6xl px-5 pt-8 sm:px-8">
        <div className="rounded-2xl border border-clay/30 bg-clay/5 p-6 sm:p-7">
          <div className="flex items-start gap-4">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-clay text-paper shadow-xs">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-clay">
                Emergency & Suicide Prevention Notice
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-ink/80">
                Cast of Minds is designed for scheduled, non-emergency psychological care. We do{' '}
                <strong>not</strong> provide immediate crisis intervention or suicide hotline services.
                If you are in acute distress, considering self-harm, or facing a medical emergency,
                please immediately call your local emergency services (such as <strong>112</strong> in the
                EU, <strong>999</strong> in the UK, <strong>911</strong> in the US, or your regional
                crisis helpline) or go to the nearest emergency room.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout with Sticky Table of Contents */}
      <div className="mx-auto max-w-6xl px-5 pt-12 sm:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* Left Column: Quick Navigation (Sticky on desktop) */}
          <aside className="lg:col-span-4">
            <div className="sticky top-24 rounded-2xl border border-ink/10 bg-mist/40 p-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-ink/60">
                Table of Contents
              </h2>
              <nav className="mt-4 flex flex-col space-y-1">
                {SECTIONS.map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => scrollToSection(sec.id)}
                    className={`text-left rounded-lg px-3 py-2 text-sm transition-colors ${
                      activeSection === sec.id
                        ? 'bg-ink text-paper font-medium'
                        : 'text-ink/75 hover:bg-ink/5 hover:text-ink'
                    }`}
                  >
                    {sec.label}
                  </button>
                ))}
              </nav>

              <div className="mt-8 border-t border-ink/10 pt-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink/60">
                  Related Policies
                </p>
                <div className="mt-3 flex flex-col gap-2 text-sm">
                  <Link
                    to="/refund"
                    className="flex items-center justify-between text-ink hover:underline decoration-gold underline-offset-4"
                  >
                    <span>Refund Policy</span>
                    <span aria-hidden="true">&rarr;</span>
                  </Link>
                  <Link
                    to="/privacy"
                    className="flex items-center justify-between text-ink hover:underline decoration-gold underline-offset-4"
                  >
                    <span>Privacy Policy</span>
                    <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
              </div>
            </div>
          </aside>

          {/* Right Column: Full Legal Sections */}
          <div className="space-y-16 lg:col-span-8">
            {/* Section 1 */}
            <article id="introduction" className="scroll-mt-28">
              <div className="flex items-center gap-3">
                <span className="font-display text-2xl font-semibold text-gold">01</span>
                <Heading level={2} size="subsection" className="text-ink-deep">
                  Operating Entity & Scope of Agreement
                </Heading>
              </div>
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-ink/80">
                <p>
                  These Terms of Service (the &ldquo;Agreement&rdquo;) constitute a legally binding
                  contract between you (&ldquo;Client&rdquo;, &ldquo;you&rdquo;) and{' '}
                  <strong>Cast of Minds</strong> (&ldquo;Company&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;,
                  or &ldquo;our&rdquo;), registered in Pakistan and the United Kingdom (Corporate
                  Registration No. 4220104917965), operating from Karachi, Pakistan.
                </p>
                <p>
                  By visiting, accessing, or registering on our platform at{' '}
                  <strong>castofminds.com</strong>, completing our intake questionnaire, or purchasing a
                  subscription, you explicitly accept and agree to be bound by all provisions of this
                  Agreement. If you do not agree to these terms, you must not access or use the platform.
                </p>
              </div>
            </article>

            {/* Section 2 */}
            <article id="therapists" className="scroll-mt-28">
              <div className="flex items-center gap-3">
                <span className="font-display text-2xl font-semibold text-gold">02</span>
                <Heading level={2} size="subsection" className="text-ink-deep">
                  The Therapists & Therapy Services
                </Heading>
              </div>
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-ink/80">
                <p>
                  Cast of Minds connects clients with professional mental health practitioners
                  (&ldquo;Therapists&rdquo;). The Therapists are independent practitioners who contract
                  with Cast of Minds; they are neither employees nor direct agents of the Company.
                </p>
                <p>
                  <strong>Role of the Platform:</strong> Our service provides client matching, secure
                  encrypted messaging, worksheet distribution, private journaling tools, and video
                  conferencing infrastructure for therapy sessions. While Cast of Minds rigorously verifies
                  credentials and licenses during therapist onboarding, the Therapists themselves remain
                  solely responsible for clinical decisions and the delivery of therapy.
                </p>
                <p>
                  <strong>Therapist Matching:</strong> Clients are matched with therapists based
                  on their questionnaire responses and clinical focus areas. If you have any concerns
                  about your match, please contact support at{' '}
                  <a href="mailto:contact@castofminds.com" className="text-ink underline decoration-gold">
                    contact@castofminds.com
                  </a>{' '}
                  so our team can assist you.
                </p>
                <p>
                  <strong>Therapist Departure:</strong> If a therapist ceases to practice on Cast of Minds,
                  we will promptly notify you by email and provide immediate options to transition to a new
                  qualified therapist on the platform.
                </p>
              </div>
            </article>

            {/* Section 3 */}
            <article id="crisis-disclaimer" className="scroll-mt-28">
              <div className="flex items-center gap-3">
                <span className="font-display text-2xl font-semibold text-gold">03</span>
                <Heading level={2} size="subsection" className="text-ink-deep">
                  Crisis & Medical Disclaimers
                </Heading>
              </div>
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-ink/80">
                <p>
                  <strong>Not for Crisis Situations:</strong> Cast of Minds is not an emergency psychiatric
                  service or suicide prevention lifeline. If you are experiencing thoughts of self-harm,
                  harming others, or acute psychiatric crisis, please contact your local emergency services
                  immediately.
                </p>
                <p>
                  <strong>No Substitute for In-Person Medical Examination:</strong> Online therapy may not
                  be appropriate for every individual or medical diagnosis. You should never disregard,
                  avoid, or delay in-person medical evaluation from a physician or psychiatrist because of
                  information communicated through this platform.
                </p>
                <p>
                  <strong>No Official Legal or Medication Diagnoses:</strong> The platform is not intended
                  for court-ordered therapy evaluations, official legal documentation, emotional support
                  animal certifications, or pharmaceutical prescriptions. Our therapists do not prescribe
                  controlled substances or medications through the platform.
                </p>
              </div>
            </article>

            {/* Section 4 */}
            <article id="account" className="scroll-mt-28">
              <div className="flex items-center gap-3">
                <span className="font-display text-2xl font-semibold text-gold">04</span>
                <Heading level={2} size="subsection" className="text-ink-deep">
                  Your Account & Security
                </Heading>
              </div>
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-ink/80">
                <p>
                  <strong>Single Account Rule:</strong> To use the platform, you must establish an account.
                  You agree to provide true, accurate, and current information. You may not create more than
                  one account, nor may you establish an account for anyone else without authorization.
                  Couples participating in couples therapy share one coordinated account profile.
                </p>
                <p>
                  <strong>Credential Confidentiality:</strong> You are solely responsible for maintaining
                  the confidentiality of your login credentials, password, and session access. You must
                  notify us immediately at{' '}
                  <a href="mailto:contact@castofminds.com" className="text-ink underline decoration-gold">
                    contact@castofminds.com
                  </a>{' '}
                  if you suspect any unauthorized access to your account.
                </p>
              </div>
            </article>

            {/* Section 5 */}
            <article id="subscription" className="scroll-mt-28">
              <div className="flex items-center gap-3">
                <span className="font-display text-2xl font-semibold text-gold">05</span>
                <Heading level={2} size="subsection" className="text-ink-deep">
                  Subscriptions, Pricing & 4-Session Quota
                </Heading>
              </div>
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-ink/80">
                <p>
                  <strong>Pricing & Currency:</strong> Therapy on Cast of Minds is provided as a recurring
                  monthly subscription. Subscriptions are billed automatically in advance in{' '}
                  <strong>Euros (&euro;)</strong> at the fee displayed during checkout (or resubscription).
                  Payments are securely processed via Stripe; Cast of Minds never stores or directly handles
                  your raw credit card numbers.
                </p>

                <div className="rounded-xl border border-ink/10 bg-mist/50 p-5">
                  <h3 className="font-semibold text-ink-deep">What Each Monthly Subscription Includes:</h3>
                  <ul className="mt-3 space-y-2 text-sm text-ink/80">
                    <li className="flex items-start gap-2">
                      <span className="text-gold font-bold">&bull;</span>
                      <span>
                        <strong>Four (4) Live Sessions:</strong> One scheduled session per week conducted over secure Zoom video conferencing.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gold font-bold">&bull;</span>
                      <span>
                        <strong>Unlimited Messaging:</strong> Asynchronous direct messaging with your therapist
                        between weekly sessions.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gold font-bold">&bull;</span>
                      <span>
                        <strong>Clinical Worksheets:</strong> Exercises and materials hand-selected by your
                        therapist for between-session practice.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gold font-bold">&bull;</span>
                      <span>
                        <strong>Private Clinical Journal:</strong> A dedicated reflective writing space accessible
                        to you and your therapist.
                      </span>
                    </li>
                  </ul>
                </div>

                <p className="rounded-lg bg-amber-500/10 p-4 border border-amber-500/20 text-ink-deep">
                  <strong>Strict Session Quota &amp; No Rollover Rule:</strong> Every 30-day billing cycle
                  grants four (4) live sessions. Because our therapists reserve their clinical availability
                  specifically for your weekly cadence, <strong>unused sessions do not roll over</strong> to the
                  following month. Any unused session allowance at the time of subscription renewal or
                  cancellation is forfeited.
                </p>
              </div>
            </article>

            {/* Section 6 */}
            <article id="cancellation" className="scroll-mt-28">
              <div className="flex items-center gap-3">
                <span className="font-display text-2xl font-semibold text-gold">06</span>
                <Heading level={2} size="subsection" className="text-ink-deep">
                  Cancellations & Billing Renewals
                </Heading>
              </div>
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-ink/80">
                <p>
                  <strong>Cancel Anytime:</strong> You may cancel your subscription at any time with a single
                  click directly from your Client Portal account settings (<em>/portal/account</em>). There are
                  no cancellation fees, penalties, or telephone calls required.
                </p>
                <p>
                  <strong>Effect of Cancellation:</strong> Cancelling stops all future recurring charges. Your
                  account remains fully active, and you retain access to all platform features and any
                  remaining sessions in your current four-session quota until the end of your prepaid 30-day
                  period.
                </p>
                <p>
                  <strong>No Mid-Cycle Partial Refunds:</strong> Because clinical time is blocked in advance,
                  we do not offer partial or prorated refunds for days remaining in a billing cycle after
                  cancellation. Full refund details are set forth in our dedicated{' '}
                  <Link to="/refund" className="text-ink font-semibold underline decoration-gold">
                    Refund Policy
                  </Link>
                  .
                </p>
              </div>
            </article>

            {/* Section 7 */}
            <article id="intellectual-property" className="scroll-mt-28">
              <div className="flex items-center gap-3">
                <span className="font-display text-2xl font-semibold text-gold">07</span>
                <Heading level={2} size="subsection" className="text-ink-deep">
                  Intellectual Property
                </Heading>
              </div>
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-ink/80">
                <p>
                  All content, interfaces, logos, code, clinical worksheets, graphics, and design systems
                  available on or through Cast of Minds are the proprietary property of Cast of Minds or its
                  licensors and are protected under international copyright, trademark, and intellectual
                  property laws.
                </p>
                <p>
                  You are granted a personal, revocable, non-exclusive, non-transferable license to access the
                  platform strictly for your personal therapeutic care. You agree not to copy, reverse
                  engineer, redistribute, or commercially exploit any software, content, or materials provided
                  through the platform.
                </p>
              </div>
            </article>

            {/* Section 8 */}
            <article id="privacy-boundaries" className="scroll-mt-28">
              <div className="flex items-center gap-3">
                <span className="font-display text-2xl font-semibold text-gold">08</span>
                <Heading level={2} size="subsection" className="text-ink-deep">
                  Privacy Boundaries, Reviews & Clinical Notes
                </Heading>
              </div>
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-ink/80">
                <p>
                  Trust and clinical safety require absolute transparency about who can see your data. Cast of
                  Minds enforces strict technical and ethical boundaries:
                </p>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-ink/10 bg-mist/30 p-5">
                    <h3 className="font-semibold text-ink-deep">Admin-Only Reviews</h3>
                    <p className="mt-2 text-xs leading-relaxed text-ink/75">
                      Any star rating or feedback you submit upon completing or cancelling therapy is visible{' '}
                      <strong>only to the platform administrator</strong> for quality assurance. Reviews are{' '}
                      <strong>never shown to your therapist</strong>, ensuring you can provide honest feedback
                      without fear of affecting your therapeutic relationship.
                    </p>
                  </div>
                  <div className="rounded-xl border border-ink/10 bg-mist/30 p-5">
                    <h3 className="font-semibold text-ink-deep">Therapist Clinical Notes</h3>
                    <p className="mt-2 text-xs leading-relaxed text-ink/75">
                      Private practitioner case notes kept by your therapist are encrypted and confidential to
                      that therapist. Neither clients nor platform administrative staff have access to a
                      therapist&apos;s private clinical case records.
                    </p>
                  </div>
                </div>

                <p>
                  Direct chat messages and journal entries shared with your therapist are strictly private to
                  your therapeutic pair. For full technical details regarding data retention and encryption,
                  please review our{' '}
                  <Link to="/privacy" className="text-ink font-semibold underline decoration-gold">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>
            </article>

            {/* Section 9 */}
            <article id="platform-availability" className="scroll-mt-28">
              <div className="flex items-center gap-3">
                <span className="font-display text-2xl font-semibold text-gold">09</span>
                <Heading level={2} size="subsection" className="text-ink-deep">
                  Platform Availability & Limitation of Liability
                </Heading>
              </div>
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-ink/80">
                <p>
                  While Cast of Minds implements industry-standard safeguards to maintain 24/7 uptime and
                  secure digital infrastructure, the platform is provided on an &ldquo;as-is&rdquo; and
                  &ldquo;as-available&rdquo; basis. We do not warrant that service will be uninterrupted,
                  completely error-free, or free from third-party telecommunication disruptions.
                </p>
                <p>
                  To the maximum extent permitted by applicable law, Cast of Minds, its directors, and staff
                  shall not be held liable for any indirect, incidental, special, or consequential damages
                  arising out of or in connection with the use or inability to use the platform.
                </p>
              </div>
            </article>

            {/* Section 10 */}
            <article id="governing-law" className="scroll-mt-28">
              <div className="flex items-center gap-3">
                <span className="font-display text-2xl font-semibold text-gold">10</span>
                <Heading level={2} size="subsection" className="text-ink-deep">
                  Governing Law & Dispute Resolution
                </Heading>
              </div>
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-ink/80">
                <p>
                  <strong>Substantive Law:</strong> This Agreement shall be governed by and construed in
                  accordance with the substantive laws of <strong>Pakistan</strong>, without regard to conflict
                  of law principles.
                </p>
                <p>
                  <strong>Exclusive Jurisdiction:</strong> The competent Courts of Pakistan shall have
                  exclusive jurisdiction over any claim, controversy, or dispute arising out of or in connection
                  with this Agreement, its breach, or the services provided through the platform.
                </p>
                <p>
                  <strong>Severability:</strong> If any provision of this Agreement is held to be invalid,
                  illegal, or unenforceable by a court of competent jurisdiction, that provision shall be
                  enforced to the maximum extent permissible, and the remaining provisions shall remain in full
                  force and effect.
                </p>
              </div>
            </article>

            {/* Bottom Support & Questions Card */}
            <div className="rounded-2xl border border-ink/10 bg-mist/60 p-8 text-center sm:p-10">
              <Heading level={3} size="subsection" className="text-ink-deep">
                Questions About Our Terms?
              </Heading>
              <p className="mx-auto mt-3 max-w-lg text-sm text-ink/75">
                Our support team is here to help with any questions regarding your account, therapy
                sessions, or platform commitments.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-4">
                <a
                  href="mailto:contact@castofminds.com"
                  className="inline-flex items-center gap-2 rounded-xl bg-ink px-6 py-3 text-sm font-medium text-paper transition-all hover:bg-ink-deep"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  Email contact@castofminds.com
                </a>
                <Link
                  to="/refund"
                  className="inline-flex items-center gap-2 rounded-xl border border-ink/20 bg-paper px-6 py-3 text-sm font-medium text-ink transition-all hover:bg-mist"
                >
                  Read Refund Policy &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
