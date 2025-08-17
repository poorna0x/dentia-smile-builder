import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import AboutUs from '@/components/AboutUs';
import Services from '@/components/Services';
import Stats from '@/components/Stats';
import WhyChooseUs from '@/components/WhyChooseUs';
import Team from '@/components/Team';
import FAQ from '@/components/FAQ';
import Testimonials from '@/components/Testimonials';
import CTA from '@/components/CTA';

const Home = () => {
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
        <FAQ />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </div>
  );
};

export default Home;