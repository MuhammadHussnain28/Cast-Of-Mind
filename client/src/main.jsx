import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './store'
import { installAuthInterceptors } from './lib/api/interceptors'
import { sessionEnded } from './store/authSlice'
import RootErrorBoundary from './components/states/RootErrorBoundary'
import { initSentry, trackSignedInUser, withSentry } from './lib/sentry'
import './index.css'
import App from './App.jsx'

// Error reporting (12.4): off unless a production build with VITE_SENTRY_DSN.
initSentry()
trackSignedInUser(store)

// Registered once, before anything renders, so no request can slip out
// without its token or miss the silent refresh on a 401.
installAuthInterceptors({
  onSessionLost: () => store.dispatch(sessionEnded()),
})

// React logs a caught error's full message by default, even in production. A
// message can carry text from the screen, so production logs the name only.
const onCaughtError = withSentry(
  import.meta.env.DEV
    ? (error, info) => console.error(error, info?.componentStack)
    : (error) => console.error(`[render] ${error?.name ?? 'Error'}`),
)

createRoot(document.getElementById('root'), { onCaughtError }).render(
  <StrictMode>
    <RootErrorBoundary>
      <Provider store={store}>
        <App />
      </Provider>
    </RootErrorBoundary>
  </StrictMode>,
)
