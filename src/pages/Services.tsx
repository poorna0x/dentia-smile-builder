/**
 * Services Page Component
 * 
 * This page displays the dental services offered by the clinic.
 * It includes:
 * - Navigation header with clinic branding
 * - Page header with title and description
 * - Services component showing all available dental services
 * - Call-to-action section for appointment booking
 * - Footer with contact information
 * 
 * Features:
 * - Responsive design for all screen sizes
 * - SEO-friendly page structure
 * - Consistent branding with main site
 * - Clear service presentation
 * - Easy navigation back to main site
 * 
 * @returns JSX.Element - The rendered services page
 */
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import Services from '@/components/Services';
import CTA from '@/components/CTA';

const ServicesPage = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="pt-20">
        <div className="container mx-auto px-4 py-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary mb-4">Our Services</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover our comprehensive range of dental services designed to give you the perfect smile
            </p>
          </div>
        </div>
        <Services />
        <CTA />
      </main>
      <Footer />
    </div>
  );
};

export default ServicesPage;
