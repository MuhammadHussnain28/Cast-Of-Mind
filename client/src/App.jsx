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
import Portal from './pages/portal/Portal'
import Admin from './pages/admin/Admin'
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
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/refund" element={<Refund />} />

              {/* Signed-in only. The guard decides what to RENDER; the real
                  protection is the server-side role checks from chunk 1.4,
                  which run on every request whatever the browser shows. */}
              <Route
                path="/portal"
                element={
                  <ProtectedRoute roles={['client', 'therapist']}>
                    <Portal />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute roles={['admin']}>
                    <Admin />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Route>

            {/* TODO: REMOVE BEFORE LAUNCH - development only, no layout. */}
            <Route path="/styleguide" element={<Styleguide />} />
          </Routes>
        </AuthBootstrap>
      </BrowserRouter>
    </ToastProvider>
  )
}
