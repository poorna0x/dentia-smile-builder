import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import AboutUs from '@/components/AboutUs';
import Services from '@/components/Services';
import Stats from '@/components/Stats';
import WhyChooseUs from '@/components/WhyChooseUs';
import Team from '@/components/Team';
import Gallery from '@/components/Gallery';
import FAQ from '@/components/FAQ';
import Testimonials from '@/components/Testimonials';
import CTA from '@/components/CTA';
import CheckAppointmentStatus from '@/components/CheckAppointmentStatus';
import PatientDataAccess from '@/components/PatientDataAccess';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useClinic } from '@/contexts/ClinicContext';
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const Home = () => {
  const [searchParams] = useSearchParams();
  const { clinic, loading, error } = useClinic();
  
  // Ensure page starts at top
  useScrollToTop();
  
  // Handle scroll to check status section
  useEffect(() => {
    const scrollTo = searchParams.get('scroll');
    if (scrollTo === 'check-status') {
      // Wait for page to load, then scroll to the section
      setTimeout(() => {
        const element = document.getElementById('check-appointment-status');
        if (element) {
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }
      }, 500); // Small delay to ensure page is loaded
    }
  }, [searchParams]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading clinic data...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait while we set up your experience</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Clinic</h1>
          <p className="text-red-800 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        <Hero />
        <AboutUs />
        <Services />
        <Stats />
        <WhyChooseUs />
        <Team />
        <Gallery />
        <FAQ />
        <Testimonials />
        <CTA />
        
        {/* Patient Data Access Section */}
        <section id="patient-data-access" className="py-16 bg-gradient-to-br from-green-50 to-emerald-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Access Your Medical Information
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                View your appointments, treatments, prescriptions, and medical records. Simply enter your phone number to access your complete medical history.
              </p>
            </div>
            <div className="max-w-4xl mx-auto">
              <PatientDataAccess />
            </div>
          </div>
        </section>

        {/* Check Appointment Status Section */}
        <section id="check-appointment-status" className="py-16 bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Check Your Appointment Status
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Already have an appointment? Enter your details below to view your upcoming appointment details and get directions to our clinic.
              </p>
            </div>
            <div className="max-w-4xl mx-auto">
              <CheckAppointmentStatus />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Home;