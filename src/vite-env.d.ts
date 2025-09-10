/// <reference types="vite/client" />

// Global React declaration
declare global {
  interface Window {
    React: typeof import('react');
  }
}
