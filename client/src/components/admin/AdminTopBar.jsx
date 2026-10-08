import { Link } from 'react-router-dom'
import { Heading, Text } from '../ui'
import SignOutButton from '../auth/SignOutButton'
import { MenuIcon } from './AdminIcons'

/**
 * Thin bar over the content column: where you are on the left, who you are on
 * the right. Sticky, because an admin scrolling a long table should not lose
 * the sign-out control or the section they are in.
 *
 * No display face here on purpose. §24.3 restricts Fraunces to display sizes,
 * and a serif over dense table data is the "display font where a label should
 * be" mistake. The palette carries the brand in this portal, not the serif.
 */
export default function AdminTopBar({ title, parent, email, onOpenNav }) {
  return (
    <header className="sticky top-0 z-30 border-b border-ink/12 bg-paper">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={onOpenNav}
          aria-label="Open admin menu"
          className="-ml-1 flex size-11 shrink-0 items-center justify-center rounded-xl text-ink hover:bg-mist lg:hidden"
        >
          <MenuIcon />
        </button>

        <div className="min-w-0 flex-1">
          {/* Without this the header reads "Applications" while you are looking
              at one application — it stops being useful exactly when you are
              deepest in. */}
          {parent && (
            <nav aria-label="Breadcrumb" className="mb-0.5">
              <Link
                to={parent.to}
                className="font-body text-caption text-ink/70 underline decoration-ink/25 underline-offset-4 transition-colors duration-200 ease-out hover:text-ink hover:decoration-ink"
              >
                {parent.label}
              </Link>
            </nav>
          )}
          <Heading level={1} size="subsection" className="truncate">
            {title}
          </Heading>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {email && (
            <Text size="caption" tone="muted" className="hidden truncate sm:block">
              {email}
            </Text>
          )}
          <SignOutButton variant="ghost" />
        </div>
      </div>
    </header>
  )
}
