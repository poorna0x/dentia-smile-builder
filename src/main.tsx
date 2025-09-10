// Import React first and ensure it's available globally
import * as React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Ensure React is available globally immediately
if (typeof window !== 'undefined') {
  window.React = React;
  (window as any).React = React;
  // Also set it on the global object for extra safety
  (globalThis as any).React = React;
}

// Simple check to ensure React is ready
const isReactReady = () => {
  return React && 
         typeof React.createElement === 'function' && 
         typeof React.useState === 'function' &&
         typeof React.useEffect === 'function';
};

// Register service worker for caching and performance
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Initialize React app
function initializeApp() {
  const rootElement = document.getElementById("root");
  if (rootElement) {
    try {
      // Check if React is ready
      if (!isReactReady()) {
        throw new Error('React is not properly loaded');
      }
      
      console.log('🚀 MAIN.TSX - RENDERING APP COMPONENT');
      // Create root and render
      const root = createRoot(rootElement);
      root.render(<App />);
    } catch (error) {
      console.error('Failed to render React app:', error);
      // Fallback: show error message
      rootElement.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif;">
          <div style="text-align: center;">
            <h2>Loading Error</h2>
            <p>Please refresh the page to try again.</p>
            <button onclick="window.location.reload()" style="padding: 10px 20px; margin-top: 10px; cursor: pointer;">
              Refresh Page
            </button>
          </div>
        </div>
      `;
    }
  } else {
    console.error('Root element not found');
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
