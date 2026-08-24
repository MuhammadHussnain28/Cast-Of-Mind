import { BrowserRouter, Routes, Route } from 'react-router-dom'

import { ToastProvider } from './components/ui'
import PublicLayout from './components/layout/PublicLayout'

import Home from './pages/Home'
import About from './pages/About'
import HowItWorks from './pages/HowItWorks'
import JoinAsTherapist from './pages/JoinAsTherapist'
import Contact from './pages/Contact'
import Login from './pages/Login'
import Questionnaire from './pages/Questionnaire'
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
        <Routes>
          {/* Every public page shares the navbar and footer. */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/about" element={<About />} />
            <Route path="/join-as-therapist" element={<JoinAsTherapist />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/questionnaire" element={<Questionnaire />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/refund" element={<Refund />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* TODO: REMOVE BEFORE LAUNCH - development only, no layout. */}
          <Route path="/styleguide" element={<Styleguide />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}
