import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/react'
import { dark } from '@clerk/ui/themes'
import './index.css'
import App from './App.tsx'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl="/"
      appearance={{
        theme: dark,
        variables: {
          colorPrimary: '#e11d48',
          colorBackground: '#15171e',
          colorText: '#f4f1ec',
          colorTextSecondary: '#9ca3af',
          colorInputBackground: '#1c1f28',
          colorInputText: '#f4f1ec',
          borderRadius: '0.75rem',
        },
      }}
    >
      <App />
    </ClerkProvider>
  </StrictMode>,
)
