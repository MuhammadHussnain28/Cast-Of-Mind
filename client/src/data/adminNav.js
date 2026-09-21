/**
 * The admin portal's five sections — master spec §9.
 *
 * One manifest so the sidebar, the page title in the top bar, and the document
 * title cannot drift apart. `icon` is a key, not a component: this file holds
 * no JSX, so importing it never drags the icon set into a page that has no
 * sidebar.
 */
export const ADMIN_NAV = [
  {
    to: '/admin',
    // Only the dashboard needs `end` — without it every other admin path would
    // also mark it active, since they all begin with /admin.
    end: true,
    label: 'Dashboard',
    icon: 'dashboard',
  },
  {
    to: '/admin/applications',
    label: 'Applications',
    icon: 'applications',
  },
  {
    to: '/admin/therapists',
    label: 'Therapists',
    icon: 'therapists',
  },
  {
    to: '/admin/clients',
    label: 'Clients',
    icon: 'clients',
  },
  {
    to: '/admin/bookings',
    label: 'Bookings',
    icon: 'bookings',
  },
]
