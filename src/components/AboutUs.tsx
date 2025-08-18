import { Link } from 'react-router-dom';
import { CheckCircle, Phone, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import dentistPatientImage from '@/assets/dentist-patient.jpg';

const AboutUs = () => {
  const features = [
    'Personalized Treatment Plans',
    'Gentle Care for Kids and Adults',
    'State-of-the-Art Technology',
    'Flexible Appointment Scheduling'
  ];

  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Image Section */}
          <div className="order-2 lg:order-1">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <img
                src={dentistPatientImage}
                alt="Professional dentist examining patient"
                className="w-full h-auto"
              />
            </div>
          </div>

          {/* Content Section */}
          <div className="order-1 lg:order-2 space-y-8">
            <div className="space-y-4">
              <h2 className="heading-lg text-primary">
                Professionals and Personalized Dental Excellence
              </h2>
              <p className="body-lg text-muted-foreground">
                At Jeshna, we believe every smile tells a unique story. Our experienced team combines 
                advanced dental technology with compassionate care to deliver exceptional results 
                tailored to your individual needs.
              </p>
            </div>

            {/* Features List */}
            <ul className="space-y-4">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
                  <span className="body-md text-primary font-medium">{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Link to="/appointment" className="w-52">
                <Button className="btn-appointment text-lg px-8 py-4 w-full flex items-center justify-center gap-2">
                  <Calendar className="w-6 h-6" />
                  Book Appointment
                </Button>
              </Link>

              <a href="tel:6363116263" className="w-52">
                <Button className="btn-call text-lg px-8 py-4 w-full flex items-center justify-center gap-2">
                  <Phone className="w-6 h-6" />
                  Call Now
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutUs;