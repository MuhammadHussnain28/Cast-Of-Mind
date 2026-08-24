import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-paper px-6 py-24">
      <div className="w-full max-w-measure">
        <h1 className="font-display text-section text-balance text-ink">
          This page isn&rsquo;t here
        </h1>
        <p className="mt-6 text-body text-ink/70">
          The link may be out of date, or the address slightly off. Nothing has
          gone wrong with your account.
        </p>
        <Link
          to="/"
          className="mt-10 inline-flex min-h-11 items-center rounded-full bg-ink px-7 text-caption font-medium text-paper transition-colors duration-200 hover:bg-ink-deep"
        >
          Back to the homepage
        </Link>
      </div>
    </main>
  )
}
