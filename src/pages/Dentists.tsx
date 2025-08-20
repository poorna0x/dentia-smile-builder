/**
 * Dentists Page Component
 * 
 * This page displays information about the dental team and professionals.
 * It includes:
 * - Navigation header with clinic branding
 * - Page header with title and description about the team
 * - Team component showing all dental professionals
 * - Call-to-action section for appointment booking
 * - Footer with contact information
 * 
 * Features:
 * - Responsive design for all screen sizes
 * - SEO-friendly page structure
 * - Consistent branding with main site
 * - Professional team presentation
 * - Easy navigation back to main site
 * - Builds trust through team showcase
 * 
 * @returns JSX.Element - The rendered dentists page
 */
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import Team from '@/components/Team';
import CTA from '@/components/CTA';

const DentistsPage = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-primary mb-4">Our Expert Dentists</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Meet our team of experienced and qualified dental professionals dedicated to your oral health
            </p>
          </div>
        </div>
        <Team />
        <CTA />
      </main>
      <Footer />
    </div>
  );
};

export default DentistsPage;
