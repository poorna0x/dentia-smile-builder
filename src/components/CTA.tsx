import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar, Phone } from 'lucide-react';

const CTA = () => {
  return (
    <section className="py-16 lg:py-24 bg-primary">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Headline */}
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground">
              Ready to book your <span className="text-accent">dental care session?</span>
            </h2>
            <p className="body-lg text-primary-foreground/90 max-w-2xl mx-auto">
              Take the first step towards a healthier, more beautiful smile. Our friendly team 
              is ready to provide you with exceptional dental care tailored to your needs.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <Link to="/appointment">
              <Button className="btn-appointment text-lg px-8 py-4 w-full sm:w-auto">
                <Calendar className="w-5 h-5 mr-2" />
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

          {/* Additional Info */}
          <div className="pt-8 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-primary-foreground/80">
              <div className="space-y-2">
                <p className="font-semibold text-accent">Same Day Appointments</p>
                <p className="text-sm">Available for urgent cases</p>
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-accent">Flexible Scheduling</p>
                <p className="text-sm">Evening and weekend hours</p>
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-accent">Insurance Accepted</p>
                <p className="text-sm">Most major plans welcome</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;