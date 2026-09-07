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
    chunk: '4.4',
    summary: 'Revenue, active subscriptions, churn, and the counts that matter.',
  },
  {
    to: '/admin/applications',
    label: 'Applications',
    icon: 'applications',
    // Built in chunk 4.2 — no `chunk` or `summary`, because those two fields
    // exist only to drive the placeholder shown for sections not yet built.
  },
  {
    to: '/admin/therapists',
    label: 'Therapists',
    icon: 'therapists',
    chunk: '4.5',
    summary: 'Everyone onboarded, their profiles, and the fields only you can edit.',
  },
  {
    to: '/admin/clients',
    label: 'Clients',
    icon: 'clients',
    chunk: '10.1',
    summary: 'Client accounts, intake answers, and subscription status.',
  },
  {
    to: '/admin/bookings',
    label: 'Bookings',
    icon: 'bookings',
    chunk: '10.2',
    summary: 'Who is paired with whom right now, and when they next bill.',
  },
]
