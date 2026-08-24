import { useState } from 'react'
import {
  Badge, Button, Card, Checkbox, Heading, Input, Modal,
  RadioGroup, Select, Spinner, Text, Textarea, useToast,
} from '../components/ui'

/**
 * TEMPORARY — development only. Renders every UI primitive so states and
 * keyboard focus can be checked in one place.
 *
 * TODO: REMOVE BEFORE LAUNCH — this route must not ship to production.
 * Tracked as a pre-launch blocker in docs/ongoing.md.
 */

function Row({ title, children }) {
  return (
    <section className="border-t border-ink/10 py-10">
      <Heading level={2} size="subsection">{title}</Heading>
      <div className="mt-6 flex flex-wrap items-start gap-4">{children}</div>
    </section>
  )
}

export default function Styleguide() {
  const toast = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [checked, setChecked] = useState(false)
  const [radio, setRadio] = useState('female')

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-20 sm:px-10">
      <Heading level={1} size="section">Styleguide</Heading>
      <Text tone="muted" className="mt-4 max-w-measure">
        Development only. Every primitive with its states. Tab through this page
        — focus must stay visible on every control.
      </Text>
      <Badge tone="danger" className="mt-4">Remove before launch</Badge>

      <Row title="Palette">
        <ul className="grid w-full grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-4 lg:grid-cols-8">
          {[
            ['ink', '#19122B', 'bg-ink'],
            ['ink-deep', '#0D0916', 'bg-ink-deep'],
            ['gold', '#F5C518', 'bg-gold'],
            ['paper', '#FFFFFF', 'bg-paper'],
            ['mist', '#F4F2F7', 'bg-mist'],
            ['sage', '#7C9082', 'bg-sage'],
            ['clay', '#B3453A', 'bg-clay'],
            ['sage-deep', '#5A6E60', 'bg-sage-deep'],
          ].map(([token, hex, bg]) => (
            <li key={token}>
              <div className={`h-24 w-full rounded-xl ${bg} ${token === 'paper' ? 'ring-1 ring-ink/15 ring-inset' : ''}`} />
              <p className="mt-3 text-caption font-medium text-ink">{token}</p>
              <p className="text-caption text-ink/70" data-numeric>{hex}</p>
            </li>
          ))}
        </ul>
      </Row>

      <Row title="Buttons">
        {['primary', 'secondary', 'ghost', 'danger'].map((v) => (
          <Button key={v} variant={v}>{v}</Button>
        ))}
      </Row>

      <Row title="Button sizes">
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
      </Row>

      <Row title="Button states">
        <Button loading>Saving</Button>
        <Button disabled>Disabled</Button>
        <Button variant="secondary" loading>Loading</Button>
        <Button variant="danger" disabled>Disabled</Button>
      </Row>

      <Row title="Text inputs">
        <div className="grid w-full gap-6 sm:grid-cols-2">
          <Input label="Full name" placeholder="Jane Doe" required />
          <Input label="Email" type="email" placeholder="you@example.com"
                 helper="We only use this to send your login details." />
          <Input label="Password" type="password"
                 error="Password must be at least 8 characters. Add a few more." />
          <Input label="Disabled" placeholder="Not editable" disabled />
        </div>
      </Row>

      <Row title="Textarea and select">
        <div className="grid w-full gap-6 sm:grid-cols-2">
          <Textarea label="How are you feeling?"
                    placeholder="Write as much or as little as you like."
                    helper="Your therapist reads this before your first session." />
          <Select label="Country" placeholder="Choose a country"
                  defaultValue=""
                  options={[
                    { value: 'ie', label: 'Ireland' },
                    { value: 'de', label: 'Germany' },
                    { value: 'fr', label: 'France' },
                  ]} />
          <Select label="Timezone" error="Choose a timezone so session times show correctly."
                  defaultValue=""
                  placeholder="Choose a timezone"
                  options={[{ value: 'utc', label: 'UTC' }]} />
        </div>
      </Row>

      <Row title="Checkbox and radio">
        <div className="grid w-full gap-8 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Checkbox label="Email me before each renewal"
                      checked={checked}
                      onChange={(e) => setChecked(e.target.checked)} />
            <Checkbox label="I agree to the terms"
                      error="You need to accept the terms to continue." />
            <Checkbox label="Disabled option" disabled />
          </div>
          <RadioGroup legend="Preferred therapist gender"
                      name="gender" value={radio} onChange={setRadio}
                      helper="This orders your matches. It never hides anyone."
                      options={[
                        { value: 'female', label: 'Female' },
                        { value: 'male', label: 'Male' },
                        { value: 'none', label: 'No preference' },
                      ]} />
        </div>
      </Row>

      <Row title="Cards">
        <div className="grid w-full gap-4 sm:grid-cols-3">
          <Card><Text size="ui">Paper surface</Text></Card>
          <Card tone="mist"><Text size="ui">Mist surface</Text></Card>
          <Card tone="ink">
            <Text size="ui" tone="inverse">Ink surface</Text>
            <Button size="sm" variant="primary" className="mt-4">Focus me</Button>
          </Card>
        </div>
      </Row>

      <Row title="Badges">
        <Badge>Neutral</Badge>
        <Badge tone="accent">Accent</Badge>
        <Badge tone="success">Active</Badge>
        <Badge tone="danger">Past due</Badge>
      </Row>

      <Row title="Spinner">
        <Spinner size="sm" /><Spinner size="md" /><Spinner size="lg" />
      </Row>

      <Row title="Toast">
        <Button variant="secondary" onClick={() => toast.show('Your changes were saved.')}>
          Neutral toast
        </Button>
        <Button variant="secondary" onClick={() => toast.success('Session booked for Thursday.')}>
          Success toast
        </Button>
        <Button variant="danger" onClick={() => toast.error('That did not send. Check your connection and try again.')}>
          Error toast
        </Button>
      </Row>

      <Row title="Modal">
        <Button onClick={() => setModalOpen(true)}>Open modal</Button>
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Cancel your subscription?"
          description="You keep full access until the end of the period you have already paid for."
          footer={
            <>
              <Button variant="ghost" onClick={() => setModalOpen(false)}>Keep it</Button>
              <Button variant="danger" onClick={() => setModalOpen(false)}>Cancel subscription</Button>
            </>
          }
        >
          <Input label="Tell us why (optional)" placeholder="Anything you want us to know" />
        </Modal>
      </Row>

      <Row title="Type scale">
        <div className="flex w-full flex-col gap-6">
          <Heading level={2} size="hero">Hero heading</Heading>
          <Heading level={2} size="section">Section heading</Heading>
          <Heading level={2} size="subsection">Subsection heading</Heading>
          <Text>Body text at eighteen pixels with generous line height.</Text>
          <Text size="ui">UI text at sixteen pixels for controls.</Text>
          <Text size="caption" tone="muted">Caption text at fourteen pixels.</Text>
          <Text size="caption" tone="error">Error text uses clay.</Text>
          <Text size="caption" tone="success">Success text uses sage-deep.</Text>
        </div>
      </Row>
    </main>
  )
}
