import React, { Component, ErrorInfo, ReactNode, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@radix-ui/react-tooltip'

import { ClinicProvider } from './contexts/ClinicContext'
import { supabase } from './lib/supabase'

import Home from './pages/Home'
import Appointment from './pages/Appointment'
import Admin from './pages/Admin'
import AdminLogin from './pages/AdminLogin'
import Contact from './pages/Contact'
import Services from './pages/Services'
import Dentists from './pages/Dentists'
import NotFound from './pages/NotFound'
import BookingComplete from './pages/BookingComplete'
import CheckAppointmentStatus from './components/CheckAppointmentStatus'

import './App.css'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// Error Boundary Component
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              🚨 Something went wrong!
            </h1>
            <p className="text-red-800 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

function App() {
  console.log('🎯 App component rendering with optimized real-time...')
  
  // Initialize optimized real-time system
  useEffect(() => {
    const initializeRealtime = async () => {
      try {
        console.log('📡 Initializing optimized real-time system...')
        const { initializeRealtime } = await import('./lib/optimized-realtime')
        initializeRealtime(supabase)
        console.log('✅ Optimized real-time system initialized successfully')
      } catch (error) {
        console.warn('⚠️ Failed to initialize optimized real-time, using fallback:', error)
        // Continue without optimized real-time - app will still work
      }
    }

    initializeRealtime()

    // Cleanup on unmount
    return () => {
      const cleanup = async () => {
        try {
          const { cleanupRealtime } = await import('./lib/optimized-realtime')
          cleanupRealtime()
          console.log('✅ Real-time cleanup completed')
        } catch (error) {
          console.warn('⚠️ Failed to cleanup real-time:', error)
        }
      }
      cleanup()
    }
  }, [])
  
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Router>
            <ClinicProvider>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/appointment" element={<Appointment />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/services" element={<Services />} />
                <Route path="/dentists" element={<Dentists />} />
                <Route path="/booking-complete" element={<BookingComplete />} />
                <Route path="/check-appointment" element={<CheckAppointmentStatus />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ClinicProvider>
          </Router>
          <Toaster 
            position="top-right"
            richColors
            closeButton
            duration={4000}
          />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
