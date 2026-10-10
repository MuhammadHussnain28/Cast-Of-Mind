import { Component } from 'react'
import Button from '../ui/Button'
import Heading from '../ui/Heading'
import Text from '../ui/Text'
// import logoInk from '../../assets/cast-of-mind-logo-ink.png'

/**
 * Last line of defence against a white screen when a render throws (12.1).
 * Sits outside Redux and the router, so its fallback depends on neither.
 * Logging is set on createRoot in main.jsx, not here.
 */
export default class RootErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? <CrashScreen /> : this.props.children
  }
}

function CrashScreen() {
  return (
    <main
      id="main"
      className="relative isolate grid min-h-dvh place-items-center overflow-hidden bg-paper px-4 py-16 sm:px-6"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-20 -z-10 size-96 rounded-full bg-sage/10 blur-[130px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -right-24 -z-10 size-80 rounded-full bg-sage/10 blur-[130px]"
      />

      <div className="flex w-full max-w-lg flex-col items-center text-center">
        {/* <img src={logoInk} alt="Cast of Minds" className="h-auto w-[74px]" /> */}

        <span
          aria-hidden="true"
          className="mt-10 inline-flex size-14 items-center justify-center rounded-full bg-sage/15 text-sage-deep"
        >
          <ReloadIcon />
        </span>

        <Heading level={1} size="section" className="mt-6">
          Something went wrong on this page
        </Heading>

        <Text tone="muted" className="mt-4 max-w-measure">
          The page stopped working unexpectedly. Reloading usually fixes it. If it
          keeps happening, go back to the homepage and try again a little later.
        </Text>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" onClick={() => window.location.reload()}>
            Reload the page
          </Button>
          {/* A plain link, not <Link>: the router may be what broke. */}
          <Button as="a" href="/" variant="ghost" size="lg">
            Go to the homepage
          </Button>
        </div>
      </div>
    </main>
  )
}

function ReloadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" />
      <path d="M19.5 4.5v3.75h-3.75" />
    </svg>
  )
}
