/**
 * Main Application Component
 * 
 * This is the root component that sets up the application structure and routing.
 * It includes:
 * - Query client provider for data fetching
 * - Tooltip provider for enhanced UI interactions
 * - Toast notifications for user feedback
 * - Browser router for navigation
 * - Route definitions for all pages
 * 
 * Application Structure:
 * - Home page: Main landing page with all sections
 * - Services page: Dedicated page for dental services
 * - Dentists page: Team and professional information
 * - Contact page: Contact information and inquiry form
 * - Appointment page: Appointment booking system
 * - Admin pages: Administrative dashboard and login
 * - 404 page: Not found error handling
 * 
 * Features:
 * - Client-side routing with React Router
 * - Global state management with React Query
 * - Toast notifications for user feedback
 * - Tooltip system for enhanced UX
 * - Error boundary handling
 * - SEO-friendly routing structure
 * 
 * @returns JSX.Element - The main application component
 */
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ClinicProvider } from "./contexts/ClinicContext";
import Home from "./pages/Home";
import Services from "./pages/Services";
import Dentists from "./pages/Dentists";
import Contact from "./pages/Contact";
import Appointment from "./pages/Appointment";
import BookingComplete from "./pages/BookingComplete";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import NotFound from "./pages/NotFound";
// import PWAInstall from "./components/PWAInstall";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ClinicProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<Services />} />
            <Route path="/dentists" element={<Dentists />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/appointment" element={<Appointment />} />
            <Route path="/booking-complete" element={<BookingComplete />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<Admin />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ClinicProvider>
        {/* <PWAInstall /> */}
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
