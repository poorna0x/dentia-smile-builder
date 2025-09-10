import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Ensure React is available globally and wait for it to be ready
if (typeof window !== 'undefined') {
  window.React = React;
  // Also ensure React is available on the global object
  (window as any).React = React;
}

// Wait a bit to ensure all modules are loaded
const waitForReact = () => {
  return new Promise<void>((resolve) => {
    if (React && typeof React.createElement === 'function') {
      resolve();
    } else {
      setTimeout(() => waitForReact().then(resolve), 10);
    }
  });
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

// Wait for DOM to be ready before initializing React
async function initializeApp() {
  const rootElement = document.getElementById("root");
  if (rootElement) {
    try {
      // Wait for React to be fully loaded
      await waitForReact();
      
      // Double check React is available
      if (!React || typeof React.createElement !== 'function') {
        throw new Error('React is not properly loaded');
      }
      
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
