import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { ToastProvider } from './components/ui'
import PublicLayout from './components/layout/PublicLayout'
import AuthBootstrap from './components/auth/AuthBootstrap'
import ProtectedRoute from './components/auth/ProtectedRoute'

import Home from './pages/Home'
import About from './pages/About'
import HowItWorks from './pages/HowItWorks'
import JoinAsTherapist from './pages/JoinAsTherapist'
import Contact from './pages/Contact'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Questionnaire from './pages/Questionnaire'
import Matches from './pages/Matches'
import Checkout from './pages/Checkout'
import CheckoutCancelled from './pages/CheckoutCancelled'
import Welcome from './pages/Welcome'
// Aliased: pages/admin/TherapistDetail is the admin's view of a therapist.
// This is the public profile a client reads while choosing one.
import PublicTherapistDetail from './pages/TherapistDetail'
import PortalLayout from './pages/portal/PortalLayout'
import PortalHome from './pages/portal/PortalHome'
import PortalChat from './pages/portal/client/Chat'
import PortalWorksheets from './pages/portal/client/Worksheets'
import PortalJournal from './pages/portal/client/Journal'
import PortalSessions from './pages/portal/client/Sessions'
import PortalAccount from './pages/portal/client/Account'
import ClientWorkspace from './pages/portal/therapist/ClientWorkspace'
import { DEFAULT_WORKSPACE_TAB } from './data/therapistPortalContent'
import TherapistNotifications from './pages/portal/therapist/Notifications'
import TherapistProfile from './pages/portal/TherapistProfile'
import AdminLayout from './pages/admin/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import Applications from './pages/admin/Applications'
import ApplicationDetail from './pages/admin/ApplicationDetail'
import Therapists from './pages/admin/Therapists'
import TherapistDetail from './pages/admin/TherapistDetail'
import Clients from './pages/admin/Clients'
import Bookings from './pages/admin/Bookings'
import AdminNotFound from './components/admin/AdminNotFound'
import Privacy from './pages/legal/Privacy'
import Terms from './pages/legal/Terms'
import Refund from './pages/legal/Refund'
import NotFound from './pages/NotFound'
// TODO: REMOVE BEFORE LAUNCH - development-only styleguide route.
import Styleguide from './pages/Styleguide'

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        {/* Restores the session from the refresh cookie before any route
            decides whether the visitor is signed in. Inside BrowserRouter so
            everything below can navigate. */}
        <AuthBootstrap>
          <Routes>
            {/* Every public page shares the navbar and footer. */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/about" element={<About />} />
              {/* The standalone team page was merged into About (§24.7 and
                  docs/04 §5). Anyone arriving at /team — an old link, a
                  bookmark, a search result — lands on the team grid rather than
                  on a 404. `replace` keeps it out of history, so the back
                  button returns where they came from instead of bouncing them
                  through the redirect again.

                  The scroll itself is done by ScrollToHash in PublicLayout:
                  React Router sets location.hash and does NOT scroll, so
                  without it this redirect silently lands at the top of the
                  page and looks like it worked. */}
              <Route path="/team" element={<Navigate to="/about#team" replace />} />
              <Route path="/join-as-therapist" element={<JoinAsTherapist />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/questionnaire" element={<Questionnaire />} />
              <Route path="/matches" element={<Matches />} />
              <Route path="/therapist/:id" element={<PublicTherapistDetail />} />
              <Route path="/checkout" element={<Checkout />} />
              {/* Where Stripe returns someone who closed the payment page. */}
              <Route path="/checkout/cancel" element={<CheckoutCancelled />} />
              {/* Shown after a successful payment. It REPORTS only — the
                  account is created by the webhook, never by this page. */}
              <Route path="/welcome" element={<Welcome />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/refund" element={<Refund />} />

              <Route path="*" element={<NotFound />} />
            </Route>

            {/* Clients and therapists share this route; PortalLayout picks the
                shell by role. Its own chrome, not the marketing layout — a
                navbar and footer wrapped round a signed-in surface was the same
                mistake the admin portal fixed in 4.1.

                The children split by role and PortalLayout redirects anyone on
                the wrong set: chat/worksheets/journal/sessions/account are the
                client's features (§7), and clients/profile/notifications are
                the therapist's inbox (§8).

                The therapist's selected client lives in the URL rather than in
                state, so a refresh keeps their place, §8.8's notification can
                link straight to a client, and the phone's list-then-detail
                split needs no extra machinery.

                Guarding the LAYOUT covers every child, so a feature added in a
                later chunk cannot ship unprotected. The server enforces both the
                role and the subscription on every /api/v1/client request; this
                only decides what renders. */}
            <Route
              path="/portal"
              element={
                <ProtectedRoute roles={['client', 'therapist']}>
                  <PortalLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<PortalHome />} />

              {/* Client (§7) */}
              <Route path="chat" element={<PortalChat />} />
              <Route path="worksheets" element={<PortalWorksheets />} />
              <Route path="journal" element={<PortalJournal />} />
              <Route path="sessions" element={<PortalSessions />} />
              <Route path="account" element={<PortalAccount />} />

              {/* Therapist (§8). The TAB is in the URL so a refresh keeps the
                  therapist where they were, and the sidebar carries it across
                  when they open the next client. A bare client id redirects to
                  the default tab rather than rendering a tabless workspace. */}
              <Route
                path="clients/:bookingId"
                element={<Navigate to={DEFAULT_WORKSPACE_TAB} replace />}
              />
              <Route path="clients/:bookingId/:tab" element={<ClientWorkspace />} />
              <Route path="profile" element={<TherapistProfile />} />
              <Route path="notifications" element={<TherapistNotifications />} />

              <Route path="*" element={<NotFound />} />
            </Route>

            {/* The admin portal has its own shell — no marketing navbar or
                footer. Guarding the LAYOUT covers every child route, so a
                section added in a later chunk cannot be left unprotected by
                forgetting to wrap it. The server enforces the same thing on
                every /api/v1/admin request; this only decides what renders. */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="applications" element={<Applications />} />
              <Route path="applications/:id" element={<ApplicationDetail />} />
              <Route path="therapists" element={<Therapists />} />
              <Route path="therapists/:id" element={<TherapistDetail />} />
              <Route path="clients" element={<Clients />} />
              <Route path="bookings" element={<Bookings />} />
              {/* Not the public 404 — that renders its own <main> and would
                  nest a second landmark inside this one. */}
              <Route path="*" element={<AdminNotFound />} />
            </Route>

            {/* TODO: REMOVE BEFORE LAUNCH - development only, no layout. */}
            <Route path="/styleguide" element={<Styleguide />} />
          </Routes>
        </AuthBootstrap>
      </BrowserRouter>
    </ToastProvider>
  )
}
