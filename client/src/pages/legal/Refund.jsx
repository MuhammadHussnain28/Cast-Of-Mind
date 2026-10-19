import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heading, Text } from '../../components/ui'

const SECTIONS = [
  { id: 'subscription-model', label: '1. Our Subscription Model' },
  { id: 'cancellation-process', label: '2. How to Cancel Your Plan' },
  { id: 'session-expiration', label: '3. Sessions & Prorated Billing' },
  { id: 'refund-exceptions', label: '4. Refund Eligibility & Exceptions' },
  { id: 'request-process', label: '5. Request Window & Bank Timelines' },
  { id: 'chargebacks', label: '6. Direct Dispute Resolution' },
]

export default function Refund() {
  const [activeSection, setActiveSection] = useState('subscription-model')

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
              Billing &amp; Subscriptions
            </span>
            <span>Last updated: October 14, 2026</span>
          </div>

          <Heading level={1} size="section" className="mt-4 text-ink-deep">
            Refund <span className='font-body font-bold'>&</span> Cancellation Policy
          </Heading>

          <Text size="body" tone="muted" className="mt-4 max-w-3xl text-balance">
            Clear, transparent commitments regarding your subscription, monthly cancellations, session
            quotas, and refund eligibility on Cast of Minds.
          </Text>

          {/* Quick Meta Row */}
          <div className="mt-8 flex flex-wrap gap-6 text-sm text-ink/75 border-t border-ink/10 pt-6">
            <div>
              <span className="font-semibold text-ink">Entity:</span> Cast of Minds
            </div>
            <div>
              <span className="font-semibold text-ink">Currency:</span> EUR (&euro;) via Stripe
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
              <span className="font-semibold text-ink">Cancellation:</span> 1-click in Client Portal
            </div>
          </div>
        </div>
      </section>

      {/* Visual 3-Card Summary Grid */}
      <div className="mx-auto max-w-6xl px-5 pt-10 sm:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border border-ink/10 bg-paper p-6 shadow-xs">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/20 text-ink">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="mt-4 font-semibold text-ink-deep">Cancel Anytime</h2>
            <p className="mt-2 text-xs leading-relaxed text-ink/75">
              One click from your portal account tab stops future renewals immediately. No calls or
              hassles required.
            </p>
          </div>

          <div className="rounded-2xl border border-ink/10 bg-paper p-6 shadow-xs">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage/20 text-sage-deep">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="mt-4 font-semibold text-ink-deep">Full 30-Day Access</h2>
            <p className="mt-2 text-xs leading-relaxed text-ink/75">
              If you cancel mid-month, your account remains active and all remaining sessions can be used
              until your 30 days end.
            </p>
          </div>

          <div className="rounded-2xl border border-ink/10 bg-paper p-6 shadow-xs">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-700">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="mt-4 font-semibold text-ink-deep">No Session Carryover</h2>
            <p className="mt-2 text-xs leading-relaxed text-ink/75">
              Each month includes four sessions. Unused sessions expire upon cycle renewal to respect the
              therapist&apos;s blocked schedule.
            </p>
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
                    to="/terms"
                    className="flex items-center justify-between text-ink hover:underline decoration-gold underline-offset-4"
                  >
                    <span>Terms of Service</span>
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

          {/* Right Column: Full Refund Sections */}
          <div className="space-y-16 lg:col-span-8">
            {/* Section 1 */}
            <article id="subscription-model" className="scroll-mt-28">
              <div className="flex items-center gap-3">
                <span className="font-display text-2xl font-semibold text-gold">01</span>
                <Heading level={2} size="subsection" className="text-ink-deep">
                  Our Subscription Model
                </Heading>
              </div>
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-ink/80">
                <p>
                  Cast of Minds provides therapy as an all-inclusive monthly subscription. Subscriptions
                  are billed in advance in <strong>Euros (&euro;)</strong> automatically every 30 days
                  using the payment method on file via our payment partner, Stripe.
                </p>
                <p>
                  Each monthly billing cycle grants full platform access, including four (4) live 
                  weekly sessions via secure Zoom video, unlimited messaging with your therapist, shared
                  worksheets, and your private reflective journal.
                </p>
              </div>
            </article>

            {/* Section 2 */}
            <article id="cancellation-process" className="scroll-mt-28">
              <div className="flex items-center gap-3">
                <span className="font-display text-2xl font-semibold text-gold">02</span>
                <Heading level={2} size="subsection" className="text-ink-deep">
                  How to Cancel Your Plan
                </Heading>
              </div>
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-ink/80">
                <p>
                  You have full autonomy over your subscription. You can cancel your membership at any
                  time with zero cancellation penalties:
                </p>
                <ol className="list-decimal space-y-2 pl-5 text-sm text-ink/80">
                  <li>Log in to your account at <strong>castofminds.com</strong>.</li>
                  <li>Navigate to the <strong>Account</strong> tab in your Client Portal.</li>
                  <li>In the Subscription card, click <strong>&ldquo;Cancel subscription&rdquo;</strong>.</li>
                </ol>
                <p>
                  Your cancellation takes effect immediately to <strong>stop the next payment</strong>. We do
                  not require phone calls, customer retention surveys, or notice periods.
                </p>
              </div>
            </article>

            {/* Section 3 */}
            <article id="session-expiration" className="scroll-mt-28">
              <div className="flex items-center gap-3">
                <span className="font-display text-2xl font-semibold text-gold">03</span>
                <Heading level={2} size="subsection" className="text-ink-deep">
                  Mid-Cycle Cancellations &amp; Session Expiration
                </Heading>
              </div>
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-ink/80">
                <p>
                  <strong>Access Continues Until Cycle End:</strong> If you cancel during an active billing
                  month, your account will remain open and fully functional until your current prepaid
                  30-day period expires. You may continue messaging your therapist and attend any remaining
                  sessions from your four-session quota.
                </p>
                <p>
                  <strong>No Prorated Mid-Cycle Refunds:</strong> Because our therapists set aside weekly
                  clinical hours exclusively for your care, we do not issue partial or prorated refunds for
                  cancelling midway through a paid month.
                </p>
                <p className="rounded-xl border border-ink/10 bg-mist/50 p-4 text-ink-deep">
                  <strong>Session Expiration (No Rollover):</strong> The subscription provides four sessions
                  designed to be attended once weekly. Unused sessions from a prior 30-day period expire upon
                  renewal and cannot be accumulated, carried forward, or refunded as cash.
                </p>
              </div>
            </article>

            {/* Section 4 */}
            <article id="refund-exceptions" className="scroll-mt-28">
              <div className="flex items-center gap-3">
                <span className="font-display text-2xl font-semibold text-gold">04</span>
                <Heading level={2} size="subsection" className="text-ink-deep">
                  Refund Eligibility &amp; Exceptions
                </Heading>
              </div>
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-ink/80">
                <p>
                  While monthly subscription payments are generally non-refundable once the billing cycle has
                  commenced, we evaluate refund requests on a fair, case-by-case basis. We issue full or
                  partial refunds in the following circumstances:
                </p>

                <div className="space-y-3">
                  <div className="rounded-xl border border-ink/10 bg-paper p-4 shadow-xs">
                    <h3 className="font-semibold text-ink-deep">1. Technical &amp; Duplicate Billing Errors</h3>
                    <p className="mt-1 text-xs leading-relaxed text-ink/75">
                      If an error on our platform or Stripe results in accidental double charges or
                      incorrect fee deductions, we promptly issue a 100% refund for the errant charge.
                    </p>
                  </div>

                  <div className="rounded-xl border border-ink/10 bg-paper p-4 shadow-xs">
                    <h3 className="font-semibold text-ink-deep">2. Therapist Inability to Deliver</h3>
                    <p className="mt-1 text-xs leading-relaxed text-ink/75">
                      If your matched therapist suffers an unforeseen emergency, illness, or leaves the
                      platform, and we are unable to provide a mutually agreeable makeup session or rematch you
                      with a suitable practitioner, you are entitled to a refund for the affected sessions.
                    </p>
                  </div>

                  <div className="rounded-xl border border-ink/10 bg-paper p-4 shadow-xs">
                    <h3 className="font-semibold text-ink-deep">3. Immediate Cancellation (Zero Sessions Used)</h3>
                    <p className="mt-1 text-xs leading-relaxed text-ink/75">
                      If you subscribe and immediately realize that the platform does not meet your needs,
                      you may request a refund within <strong>24 hours</strong> of your initial payment,
                      provided you have not booked or attended any live sessions.
                    </p>
                  </div>
                </div>
              </div>
            </article>

            {/* Section 5 */}
            <article id="request-process" className="scroll-mt-28">
              <div className="flex items-center gap-3">
                <span className="font-display text-2xl font-semibold text-gold">05</span>
                <Heading level={2} size="subsection" className="text-ink-deep">
                  Request Window &amp; Bank Timelines
                </Heading>
              </div>
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-ink/80">
                <p>
                  <strong>How to Submit a Request:</strong> If you believe your situation qualifies for an
                  exception, please contact us at{' '}
                  <a
                    href="mailto:contact@castofminds.com"
                    className="text-ink font-semibold underline decoration-gold"
                  >
                    contact@castofminds.com
                  </a>{' '}
                  from your registered account email. Please include your full name and a clear description
                  of the issue.
                </p>
                <p>
                  <strong>14-Day Request Window:</strong> All refund requests must be received within{' '}
                  <strong>fourteen (14) calendar days</strong> of the disputed charge date. Requests
                  submitted after this period cannot be reviewed.
                </p>
                <p>
                  <strong>Bank Processing Timeline:</strong> Once approved, refunds are credited back
                  immediately to the original card used through Stripe. Depending on your financial
                  institution (Visa, Mastercard, local bank), it typically takes{' '}
                  <strong>5 to 10 business days</strong> for the credit to appear on your bank statement.
                </p>
              </div>
            </article>

            {/* Section 6 */}
            <article id="chargebacks" className="scroll-mt-28">
              <div className="flex items-center gap-3">
                <span className="font-display text-2xl font-semibold text-gold">06</span>
                <Heading level={2} size="subsection" className="text-ink-deep">
                  Direct Dispute Resolution
                </Heading>
              </div>
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-ink/80">
                <p>
                  We are committed to operating ethically and treating every client fairly. If you have any
                  concerns regarding a billing deduction or the quality of your care, we warmly encourage
                  you to reach out to our administration directly at{' '}
                  <a
                    href="mailto:contact@castofminds.com"
                    className="text-ink font-semibold underline decoration-gold"
                  >
                    contact@castofminds.com
                  </a>{' '}
                  before contacting your card provider or initiating a bank chargeback.
                </p>
                <p>
                  Direct communication allows us to resolve misunderstandings or schedule adjustments
                  immediately, avoiding unnecessary administrative delays for both parties.
                </p>
              </div>
            </article>

            {/* Bottom Support & Questions Card */}
            <div className="rounded-2xl border border-ink/10 bg-mist/60 p-8 text-center sm:p-10">
              <Heading level={3} size="subsection" className="text-ink-deep">
                Have Billing or Refund Questions?
              </Heading>
              <p className="mx-auto mt-3 max-w-lg text-sm text-ink/75">
                Our support team is on standby to assist you with any subscription queries or payment
                clarifications.
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
                  to="/terms"
                  className="inline-flex items-center gap-2 rounded-xl border border-ink/20 bg-paper px-6 py-3 text-sm font-medium text-ink transition-all hover:bg-mist"
                >
                  Read Terms of Service &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
