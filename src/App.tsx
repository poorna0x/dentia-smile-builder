import React, { Component, ErrorInfo, ReactNode, useEffect, Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@radix-ui/react-tooltip'
import { useFeatureToggles } from './hooks/useFeatureToggles'
import WebsiteStatusWrapper from './components/WebsiteStatusWrapper'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import PerformanceMonitor from './components/PerformanceMonitor'

import { ClinicProvider } from './contexts/ClinicContext'
import { supabase } from './lib/supabase'

// Lazy load components for better performance
const Home = lazy(() => import('./pages/Home'))
const Appointment = lazy(() => import('./pages/Appointment'))
const Contact = lazy(() => import('./pages/Contact'))
const Services = lazy(() => import('./pages/Services'))
const Dentists = lazy(() => import('./pages/Dentists'))
const NotFound = lazy(() => import('./pages/NotFound'))
const BookingComplete = lazy(() => import('./pages/BookingComplete'))
const CheckAppointmentStatus = lazy(() => import('./components/CheckAppointmentStatus'))
const PatientLogin = lazy(() => import('./pages/PatientLogin'))
const PatientDashboard = lazy(() => import('./pages/PatientDashboard'))
const RoleBasedLogin = lazy(() => import('./pages/RoleBasedLogin'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
const TermsConditions = lazy(() => import('./pages/TermsConditions'))

// Admin components (heaviest - lazy load)
const Admin = lazy(() => import('./pages/Admin'))
const AdminPatientManagement = lazy(() => import('./pages/AdminPatientManagement'))
const AdminPaymentAnalytics = lazy(() => import('./pages/AdminPaymentAnalytics'))
const SuperAdmin = lazy(() => import('./pages/SuperAdmin'))

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
)

import './App.css'

// Create a client with optimized settings for performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      // Enable background refetch for better UX
      refetchInterval: false,
      // Optimize network requests
      networkMode: 'online',
    },
    mutations: {
      retry: 1,
      networkMode: 'online',
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
                  <PerformanceMonitor />
                  <Suspense fallback={<LoadingSpinner />}>
                    <Routes>
                      {/* Public Routes */}
                      <Route path="/" element={<Home />} />
                      <Route path="/appointment" element={<Appointment />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/services" element={<Services />} />
                      <Route path="/dentists" element={<Dentists />} />
                      <Route path="/booking-complete" element={<BookingComplete />} />
                      <Route path="/check-appointment" element={<CheckAppointmentStatus />} />
                      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                      <Route path="/terms-conditions" element={<TermsConditions />} />
                      
                      {/* Login Route */}
                      <Route path="/login" element={<RoleBasedLogin />} />
                      
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
                      <Route path="/admin/payments" element={
                        <ProtectedRoute>
                          <AdminPaymentAnalytics />
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
                  </Suspense>
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
