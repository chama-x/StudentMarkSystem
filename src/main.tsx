import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Debug log to check if this file is being executed
console.log('main.tsx is executing')

const rootElement = document.getElementById('root')

if (rootElement) {
  console.log('Root element found, mounting React app')
  createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
} else {
  console.error('Root element not found! Check your HTML structure.')
}
