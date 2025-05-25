import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Debug log to check if this file is being executed
console.log('main.tsx is executing')

// Add error handling for the entire module
try {
  const rootElement = document.getElementById('root')

  if (rootElement) {
    console.log('Root element found, mounting React app')
    
    try {
      const root = createRoot(rootElement);
      root.render(
        <StrictMode>
          <App />
        </StrictMode>
      );
      console.log('React app render called successfully');
    } catch (renderError) {
      const errorMessage = renderError instanceof Error ? renderError.message : String(renderError);
      console.error('Error during React render:', renderError);
      // Fallback: show error message in the root div
      rootElement.innerHTML = `
        <div style="padding: 20px; color: red; font-family: Arial, sans-serif;">
          <h2>React App Failed to Load</h2>
          <p>Error: ${errorMessage}</p>
          <p>Check the browser console for more details.</p>
        </div>
      `;
    }
  } else {
    console.error('Root element not found! Check your HTML structure.')
    // Try to show error in body if root is missing
    document.body.innerHTML = `
      <div style="padding: 20px; color: red; font-family: Arial, sans-serif;">
        <h2>Root Element Missing</h2>
        <p>The root div element was not found in the HTML.</p>
      </div>
    `;
  }
} catch (mainError) {
  const errorMessage = mainError instanceof Error ? mainError.message : String(mainError);
  console.error('Critical error in main.tsx:', mainError);
  // Last resort error display
  document.body.innerHTML = `
    <div style="padding: 20px; color: red; font-family: Arial, sans-serif;">
      <h2>Critical Error</h2>
      <p>Error: ${errorMessage}</p>
      <p>The application failed to initialize.</p>
    </div>
  `;
}
