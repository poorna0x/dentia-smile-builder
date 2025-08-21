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
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const Home = () => {
  const [searchParams] = useSearchParams();
  
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
        
        {/* Check Appointment Status Section */}
        <section id="check-appointment-status" className="py-16 bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Check Your Appointment Status
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Already have an appointment? Enter your details below to view your upcoming appointment details and get directions to our clinic.
              </p>
            </div>
            <CheckAppointmentStatus />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Home;