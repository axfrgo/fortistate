import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import App from './App.tsx'
import { SettingsProvider } from './settingsContext.tsx'
import { AuthGate } from './auth/AuthGate'
import { FortistateAuthProvider } from './auth/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import { initInspector } from './utils/inspectorClient'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

// Initialize inspector integration in development
if (import.meta.env.DEV) {
  // Wait for stores to be created, then register with inspector
  setTimeout(() => {
    initInspector()
  }, 2000)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <FortistateAuthProvider>
          <SettingsProvider>
            <AuthGate>
              <App />
            </AuthGate>
          </SettingsProvider>
        </FortistateAuthProvider>
      </ClerkProvider>
    </ErrorBoundary>
  </StrictMode>,
)
