import React, { Component, ErrorInfo, ReactNode, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@radix-ui/react-tooltip'
import { useFeatureToggles } from './hooks/useFeatureToggles'
import WebsiteStatusWrapper from './components/WebsiteStatusWrapper'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

import { ClinicProvider } from './contexts/ClinicContext'
import { supabase } from './lib/supabase'

import Home from './pages/Home'
import Appointment from './pages/Appointment'
import Admin from './pages/Admin'

import Contact from './pages/Contact'
import Services from './pages/Services'
import Dentists from './pages/Dentists'
import NotFound from './pages/NotFound'
import BookingComplete from './pages/BookingComplete'
import CheckAppointmentStatus from './components/CheckAppointmentStatus'
import PatientLogin from './pages/PatientLogin'
import PatientDashboard from './pages/PatientDashboard'
import AdminPatientManagement from './pages/AdminPatientManagement'
import SuperAdmin from './pages/SuperAdmin'
import WebsiteDisabled from './components/WebsiteDisabled'
import UnifiedLogin from './pages/UnifiedLogin'

import './App.css'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
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
          <AuthProvider>
            <Router
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true
              }}
            >
              <ClinicProvider>
                <WebsiteStatusWrapper>
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/appointment" element={<Appointment />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/services" element={<Services />} />
                    <Route path="/dentists" element={<Dentists />} />
                    <Route path="/booking-complete" element={<BookingComplete />} />
                    <Route path="/check-appointment" element={<CheckAppointmentStatus />} />
                    
                    {/* Login Route */}
                    <Route path="/login" element={<UnifiedLogin />} />
                    
                    {/* Protected Routes - Single Login Required */}
                    <Route path="/admin" element={
                      <ProtectedRoute>
                        <Admin />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/patients" element={
                      <ProtectedRoute>
                        <AdminPatientManagement />
                      </ProtectedRoute>
                    } />
                    <Route path="/patient/dashboard" element={
                      <ProtectedRoute>
                        <PatientDashboard />
                      </ProtectedRoute>
                    } />
                    
                    {/* Super Admin Route (separate authentication) */}
                    <Route path="/super-admin" element={<SuperAdmin />} />
                    
                    {/* Legacy routes for backward compatibility */}
                    <Route path="/patient/login" element={<PatientLogin />} />
                    
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </WebsiteStatusWrapper>
              </ClinicProvider>
            </Router>
            <Toaster 
              position="top-right"
              richColors
              closeButton
              duration={4000}
            />
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
