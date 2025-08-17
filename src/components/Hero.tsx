import { Link } from 'react-router-dom';
import { Star, Phone, Clock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import heroFamilyImage from '@/assets/hero-family.jpg';

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center hero-gradient">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroFamilyImage}
          alt="Happy family with beautiful smiles"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-primary/60"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center text-white space-y-8">
          {/* Main Headline */}
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Family Dental Care: <br />
              <span className="text-accent">Elevating Smiles</span> with Expert Care and a Gentle Touch
            </h1>
            
            {/* Google Rating */}
            <div className="flex justify-center items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-3 w-fit mx-auto">
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="font-semibold text-lg">5.0</span>
              <span className="text-white/90">Based on 28K reviews</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/appointment">
              <Button className="btn-appointment text-lg px-8 py-4 w-full sm:w-auto">
                Book Appointment
              </Button>
            </Link>
            <a href="tel:+1123456789">
              <Button className="btn-call text-lg px-8 py-4 w-full sm:w-auto">
                <Phone className="w-5 h-5 mr-2" />
                Call Now
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* Contact Bar - Mobile */}
      <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm md:hidden">
        <div className="container mx-auto px-4 py-4">
          <div className="space-y-3 text-sm text-primary">
            <div className="flex items-center justify-center space-x-2">
              <Phone className="w-4 h-4 text-accent" />
              <span>+1 123 456 789</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Clock className="w-4 h-4 text-accent" />
              <span>Mon to Sat 08:00 - 20:00</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Mail className="w-4 h-4 text-accent" />
              <span>contact@dentiaclinic.com</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;