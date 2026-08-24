import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import SkipLink from './SkipLink'

/**
 * Wraps every public page: navbar on top, page in the middle, footer below.
 * flex-1 on <main> keeps the footer at the bottom even on short pages.
 */
export default function PublicLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <SkipLink />
      <Navbar />
      <main id="main" tabIndex={-1} className="flex-1 focus-visible:outline-none">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
