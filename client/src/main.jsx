import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './store'
import { installAuthInterceptors } from './lib/api/interceptors'
import { sessionEnded } from './store/authSlice'
import './index.css'
import App from './App.jsx'

// Registered once, before anything renders, so no request can slip out
// without its token or miss the silent refresh on a 401.
installAuthInterceptors({
  onSessionLost: () => store.dispatch(sessionEnded()),
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
)
