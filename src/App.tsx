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
      // App component rendering with optimized real-time
  
  // Lightweight real-time will be initialized by individual pages when clinic context is available
  
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Router
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true
            }}
          >
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
