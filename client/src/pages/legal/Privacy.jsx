import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heading, Text } from '../../components/ui'

const SECTIONS = [
  { id: 'data-controller', label: '1. Data Controller & Scope' },
  { id: 'data-collected', label: '2. What Data We Collect' },
  { id: 'how-we-use-data', label: '3. How We Use Your Data' },
  { id: 'privacy-firewalls', label: '4. Double Privacy Firewall' },
  { id: 'sub-processors', label: '5. Trusted Sub-Processors' },
  { id: 'data-security', label: '6. Security & Encryption' },
  { id: 'legal-exceptions', label: '7. Legal & Safety Exceptions' },
  { id: 'your-rights', label: '8. Your Rights & Data Deletion' },
]

export default function Privacy() {
  const [activeSection, setActiveSection] = useState('data-controller')

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
              Data &amp; Privacy Protection
            </span>
            <span>Last updated: October 14, 2026</span>
          </div>

          <Heading level={1} size="section" className="mt-4 text-ink-deep">
            Privacy Policy
          </Heading>

          <Text size="body" tone="muted" className="mt-4 max-w-3xl text-balance">
            How Cast of Minds safeguards your personal information, protects sensitive mental health
            conversations, and enforces strict clinical confidentiality across our platform.
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
              <span className="font-semibold text-ink">Advertising:</span> Zero third-party ad tracking
            </div>
          </div>
        </div>
      </section>

      {/* Visual 3-Card Summary Grid */}
      <div className="mx-auto max-w-6xl px-5 pt-10 sm:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border border-ink/10 bg-paper p-6 shadow-xs">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage/20 text-sage-deep">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h2 className="mt-4 font-semibold text-ink-deep">Strictly Confidential</h2>
            <p className="mt-2 text-xs leading-relaxed text-ink/75">
              Messages and journals are visible only to you and your assigned therapist. We build no
              administrative conversation snooping tools.
            </p>
          </div>

          <div className="rounded-2xl border border-ink/10 bg-paper p-6 shadow-xs">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/20 text-ink">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h2 className="mt-4 font-semibold text-ink-deep">Zero Advertising Tracking</h2>
            <p className="mt-2 text-xs leading-relaxed text-ink/75">
              We never sell mental health data, track advertising IDs, or share your profile with ad
              networks or data brokers.
            </p>
          </div>

          <div className="rounded-2xl border border-ink/10 bg-paper p-6 shadow-xs">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-700">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="mt-4 font-semibold text-ink-deep">Unrecorded Live Sessions</h2>
            <p className="mt-2 text-xs leading-relaxed text-ink/75">
              Weekly Zoom sessions are conducted live over secure, encrypted video and are never recorded
              or stored by Cast of Minds.
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
                    to="/refund"
                    className="flex items-center justify-between text-ink hover:underline decoration-gold underline-offset-4"
                  >
                    <span>Refund Policy</span>
                    <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
              </div>
            </div>
          </aside>

          {/* Right Column: Full Privacy Sections */}
          <div className="space-y-16 lg:col-span-8">
            {/* Section 1 */}
            <article id="data-controller" className="scroll-mt-28">
              <div className="flex items-center gap-3">
                <span className="font-display text-2xl font-semibold text-gold">01</span>
                <Heading level={2} size="subsection" className="text-ink-deep">
                  Data Controller &amp; Scope of Policy
                </Heading>
              </div>
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-ink/80">
                <p>
                  This Privacy Policy explains how <strong>Cast of Minds</strong> (&ldquo;Company&rdquo;,
                  &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) collects, uses, and safeguards
                  personal information through our online platform at <strong>castofminds.com</strong>.
                </p>
                <p>
                  Cast of Minds acts as the <strong>Data Controller</strong> for your account and personal
                  data (Corporate Registration No. 4220104917965, registered in Pakistan and the United
                  Kingdom), operating from Karachi, Pakistan. We can be reached directly regarding all
                  data protection inquiries at{' '}
                  <a
                    href="mailto:contact@castofminds.com"
                    className="text-ink font-semibold underline decoration-gold"
                  >
                    contact@castofminds.com
                  </a>
                  .
                </p>
                <p>
                  Because we facilitate mental health support, we treat confidentiality and data protection
                  with medical-grade diligence. We believe your private thoughts, challenges, and therapy
                  conversations belong strictly between you and your practitioner.
                </p>
              </div>
            </article>

            {/* Section 2 */}
            <article id="data-collected" className="scroll-mt-28">
              <div className="flex items-center gap-3">
                <span className="font-display text-2xl font-semibold text-gold">02</span>
                <Heading level={2} size="subsection" className="text-ink-deep">
                  What Data We Collect (And What We Don&apos;t)
                </Heading>
              </div>
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-ink/80">
                <p>
                  We practice strict data minimization: we collect only what is strictly required to provide
                  effective therapeutic care, connect you with the right practitioner, and administer your
                  account.
                </p>

                <div className="rounded-xl border border-ink/10 bg-mist/40 p-5">
                  <h3 className="font-semibold text-ink-deep">Categories of Data We Process:</h3>
                  <ul className="mt-3 space-y-2 text-sm text-ink/80">
                    <li className="flex items-start gap-2">
                      <span className="text-gold font-bold">&bull;</span>
                      <span>
                        <strong>Intake &amp; Profile Data:</strong> Preferred name, email address, age,
                        gender, relationship status, city, and country (used strictly to calculate session
                        timezones and match appropriate clinical availability).
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gold font-bold">&bull;</span>
                      <span>
                        <strong>Clinical Focus Areas:</strong> The specific concerns you choose during intake
                        (e.g., anxiety, depression, grief, relationship distress) used solely to suggest
                        therapists with matching expertise.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gold font-bold">&bull;</span>
                      <span>
                        <strong>Communications &amp; Therapy Content:</strong> Messages exchanged in your
                        portal, completed clinical worksheets, and your private reflective journal entries.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gold font-bold">&bull;</span>
                      <span>
                        <strong>Billing &amp; Subscription Records:</strong> Subscription status, billing
                        dates, and payment receipts. All card numbers are collected directly by Stripe; Cast of
                        Minds never sees or stores your raw card credentials.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gold font-bold">&bull;</span>
                      <span>
                        <strong>Therapist Applicant Records:</strong> Professional degrees, state or national
                        licenses, clinical certifications, government identification, and payout details.
                      </span>
                    </li>
                  </ul>
                </div>

                <p className="rounded-lg border border-sage/30 bg-sage/5 p-4 text-ink-deep">
                  <strong>What We Never Collect or Sell:</strong> We do not track mobile device advertising
                  identifiers (Ad IDs), we do not run third-party advertising tracking pixels, and we do not
                  require unnecessary personal phone numbers or home street addresses during client onboarding.
                </p>
              </div>
            </article>

            {/* Section 3 */}
            <article id="how-we-use-data" className="scroll-mt-28">
              <div className="flex items-center gap-3">
                <span className="font-display text-2xl font-semibold text-gold">03</span>
                <Heading level={2} size="subsection" className="text-ink-deep">
                  How We Use Your Data
                </Heading>
              </div>
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-ink/80">
                <p>We process personal data solely for legitimate, operational healthcare purposes:</p>
                <ul className="list-disc space-y-2 pl-5 text-sm text-ink/80">
                  <li>
                    <strong>Matching:</strong> Pairing you with an appropriate therapist based on clinical
                    needs and therapist specializations.
                  </li>
                  <li>
                    <strong>Delivering Care:</strong> Enabling encrypted messaging, private journaling,
                    worksheet sharing, and scheduling live weekly Zoom video calls.
                  </li>
                  <li>
                    <strong>Account Administration:</strong> Authenticating logins, sending password resets,
                    and communicating critical billing or renewal notices via transactional email.
                  </li>
                  <li>
                    <strong>Platform Integrity:</strong> Protecting our servers against security threats,
                    unauthorized access, and fraudulent payment activities.
                  </li>
                </ul>
              </div>
            </article>

            {/* Section 4 */}
            <article id="privacy-firewalls" className="scroll-mt-28">
              <div className="flex items-center gap-3">
                <span className="font-display text-2xl font-semibold text-gold">04</span>
                <Heading level={2} size="subsection" className="text-ink-deep">
                  Our Double Privacy Firewall
                </Heading>
              </div>
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-ink/80">
                <p>
                  To protect the clinical relationship and ensure complete honesty in therapy, Cast of Minds
                  implements strict technical boundaries between roles:
                </p>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-ink/10 bg-mist/30 p-5">
                    <h3 className="font-semibold text-ink-deep">Admin-Only Reviews</h3>
                    <p className="mt-2 text-xs leading-relaxed text-ink/75">
                      Client ratings and exit feedback are visible{' '}
                      <strong>only to the platform administrator</strong> for quality assurance. Reviews are{' '}
                      <strong>never visible to your therapist</strong>, ensuring you can review your care with
                      complete candor.
                    </p>
                  </div>

                  <div className="rounded-xl border border-ink/10 bg-mist/30 p-5">
                    <h3 className="font-semibold text-ink-deep">Therapist Clinical Notes</h3>
                    <p className="mt-2 text-xs leading-relaxed text-ink/75">
                      Private case notes created by your therapist are encrypted and restricted solely to that
                      therapist. Neither clients nor platform administrative staff have access to a
                      therapist&apos;s clinical working notes.
                    </p>
                  </div>
                </div>

                <p className="text-sm font-medium text-ink-deep">
                  <strong>Private Clinical Messages:</strong> Messages and journal entries shared with your
                  therapist are strictly confidential to that clinical pair. Unlike older platforms, Cast of
                  Minds has deliberately chosen <strong>not</strong> to build an administrative chat viewer.
                  Your direct conversations are not monitored or browsed by office staff.
                </p>
              </div>
            </article>

            {/* Section 5 */}
            <article id="sub-processors" className="scroll-mt-28">
              <div className="flex items-center gap-3">
                <span className="font-display text-2xl font-semibold text-gold">05</span>
                <Heading level={2} size="subsection" className="text-ink-deep">
                  Trusted Sub-Processors &amp; Infrastructure
                </Heading>
              </div>
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-ink/80">
                <p>
                  We rely on industry-standard infrastructure providers to operate the platform securely. Each
                  partner is bound by rigorous data processing agreements:
                </p>

                <div className="space-y-3">
                  <div className="rounded-xl border border-ink/10 bg-paper p-4 shadow-xs">
                    <h3 className="font-semibold text-ink-deep">Stripe (Payment Processing)</h3>
                    <p className="mt-1 text-xs leading-relaxed text-ink/75">
                      Processes all card billing and renewals. Certified to PCI-DSS Level 1 (the highest
                      security standard in the payment industry). Your payment information never touches our
                      own application servers.
                    </p>
                  </div>

                  <div className="rounded-xl border border-ink/10 bg-paper p-4 shadow-xs">
                    <h3 className="font-semibold text-ink-deep">Zoom Video Communications (Live Sessions)</h3>
                    <p className="mt-1 text-xs leading-relaxed text-ink/75">
                      Powers live weekly video therapy sessions over encrypted channels. Sessions are{' '}
                      <strong>never recorded</strong>, and no video or audio files are retained on our servers.
                    </p>
                  </div>

                  <div className="rounded-xl border border-ink/10 bg-paper p-4 shadow-xs">
                    <h3 className="font-semibold text-ink-deep">Resend (Transactional Email Delivery)</h3>
                    <p className="mt-1 text-xs leading-relaxed text-ink/75">
                      Sends essential operational emails, such as account sign-in details, session reminders,
                      and payment invoices. We do not use email service providers for marketing spam.
                    </p>
                  </div>

                  <div className="rounded-xl border border-ink/10 bg-paper p-4 shadow-xs">
                    <h3 className="font-semibold text-ink-deep">MongoDB Atlas (Cloud Database)</h3>
                    <p className="mt-1 text-xs leading-relaxed text-ink/75">
                      Houses our encrypted database with automated daily backups, enterprise firewalling, and
                      encryption at rest and in transit.
                    </p>
                  </div>
                </div>
              </div>
            </article>

            {/* Section 6 */}
            <article id="data-security" className="scroll-mt-28">
              <div className="flex items-center gap-3">
                <span className="font-display text-2xl font-semibold text-gold">06</span>
                <Heading level={2} size="subsection" className="text-ink-deep">
                  Security &amp; Encryption Standards
                </Heading>
              </div>
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-ink/80">
                <p>
                  We maintain rigorous administrative, technical, and physical safeguards designed to prevent
                  unauthorized access, alteration, or disclosure of your records:
                </p>
                <ul className="list-disc space-y-2 pl-5 text-sm text-ink/80">
                  <li>
                    <strong>Encryption in Transit:</strong> All data transmitted between your device and our
                    servers is encrypted using modern TLS (HTTPS) protocols.
                  </li>
                  <li>
                    <strong>Password Protection:</strong> Passwords are cryptographically hashed using bcrypt
                    with randomized salt rounds. Raw passwords are never stored, logged, or accessible to
                    anyone.
                  </li>
                  <li>
                    <strong>Scoped Token Sessions:</strong> User sessions operate on short-lived JWT access
                    tokens paired with secure HTTP-only refresh cookies, mitigating cross-site scripting
                    vulnerabilities.
                  </li>
                </ul>
              </div>
            </article>

            {/* Section 7 */}
            <article id="legal-exceptions" className="scroll-mt-28">
              <div className="flex items-center gap-3">
                <span className="font-display text-2xl font-semibold text-gold">07</span>
                <Heading level={2} size="subsection" className="text-ink-deep">
                  Legal &amp; Safety Exceptions
                </Heading>
              </div>
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-ink/80">
                <p>
                  Under ordinary circumstances, your clinical information is entirely confidential. There are
                  only two narrow legal exceptions where we may disclose specific records:
                </p>
                <ol className="list-decimal space-y-2 pl-5 text-sm text-ink/80">
                  <li>
                    <strong>Binding Legal Process:</strong> If Cast of Minds is served with a mandatory court
                    order, search warrant, or subpoena legally issued by a court of competent jurisdiction.
                  </li>
                  <li>
                    <strong>Imminent Threat to Life (Duty to Protect):</strong> If a client expresses a clear,
                    credible, and imminent intention to inflict severe physical harm or death upon themselves or
                    another person. In such emergencies, mental health professionals and platforms are ethically
                    and legally mandated to contact appropriate emergency rescue authorities to preserve human
                    life.
                  </li>
                </ol>
              </div>
            </article>

            {/* Section 8 */}
            <article id="your-rights" className="scroll-mt-28">
              <div className="flex items-center gap-3">
                <span className="font-display text-2xl font-semibold text-gold">08</span>
                <Heading level={2} size="subsection" className="text-ink-deep">
                  Your Rights &amp; Data Deletion
                </Heading>
              </div>
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-ink/80">
                <p>
                  You maintain ownership and control over your personal records. Depending on your region, you
                  have the right to:
                </p>
                <ul className="list-disc space-y-2 pl-5 text-sm text-ink/80">
                  <li>Access and export the personal data associated with your account.</li>
                  <li>Correct inaccurate profile details directly in your account settings.</li>
                  <li>
                    Request permanent deletion of your profile and login access by emailing{' '}
                    <a
                      href="mailto:contact@castofminds.com"
                      className="text-ink font-semibold underline decoration-gold"
                    >
                      contact@castofminds.com
                    </a>
                    .
                  </li>
                </ul>
                <p className="text-xs leading-relaxed text-ink/70">
                  Please note that certain financial transaction receipts must be retained for statutory tax
                  and accounting periods, and clinical records may be retained in accordance with professional
                  healthcare licensing regulations.
                </p>
              </div>
            </article>

            {/* Bottom Support & Questions Card */}
            <div className="rounded-2xl border border-ink/10 bg-mist/60 p-8 text-center sm:p-10">
              <Heading level={3} size="subsection" className="text-ink-deep">
                Questions About Your Data or Rights?
              </Heading>
              <p className="mx-auto mt-3 max-w-lg text-sm text-ink/75">
                Our data protection team is available to assist you with any privacy questions or data
                inquiries.
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
