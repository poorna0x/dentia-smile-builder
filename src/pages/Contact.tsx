/**
 * Modern Contact Page Component
 * 
 * A sleek, minimal contact page with:
 * - Google Maps integration
 * - WhatsApp direct messaging
 * - Click-to-call functionality
 * - Email contact
 * - Modern contact form
 * - Clean, minimal design
 * 
 * @returns JSX.Element - The rendered contact page
 */
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Navigation as NavigationIcon,
  Calendar,
  Star
} from 'lucide-react';

const ContactPage = () => {
  const phoneNumber = "6363116263";
  const email = "contact@jeshnadentalclinic.com";
  const address = "Jeshna Dental Clinic, Bangalore, Karnataka";
  const whatsappMessage = "Hello! I'd like to schedule an appointment or ask about your dental services.";

  return (
    <div className="min-h-screen bg-gradient-to-br from-dental-mint via-dental-cream to-white">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-6">
              📍 Get In Touch
            </div>
            <h1 className="heading-xl mb-6">
              <span className="text-gradient">Contact</span> Our Dental Team
            </h1>
            <p className="body-lg text-dental-slate">
              Ready to transform your smile? Reach out to us through any of the convenient methods below. 
              We're here to help you achieve the perfect dental care experience.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Contact Actions */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Call Button */}
            <a 
              href={`tel:${phoneNumber}`}
              className="group bg-white rounded-3xl p-8 text-center shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-2"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                <Phone className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-dental-charcoal mb-2">Call Now</h3>
              <p className="text-dental-slate text-sm mb-4">Speak directly with our team</p>
              <p className="font-medium text-blue-600">{phoneNumber}</p>
            </a>

            {/* WhatsApp Button */}
            <a 
              href={`https://wa.me/91${phoneNumber}?text=${encodeURIComponent(whatsappMessage)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white rounded-3xl p-8 text-center shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-2"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                <svg className="w-8 h-8 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
              </div>
              <h3 className="font-semibold text-dental-charcoal mb-2">WhatsApp</h3>
              <p className="text-dental-slate text-sm mb-4">Quick chat with our team</p>
              <p className="font-medium text-blue-600">Start Chat</p>
            </a>

            {/* Book Appointment */}
            <a 
              href="/appointment"
              className="group bg-white rounded-3xl p-8 text-center shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-2"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-dental-charcoal mb-2">Book Online</h3>
              <p className="text-dental-slate text-sm mb-4">Schedule your appointment</p>
              <p className="font-medium text-blue-600">Book Now</p>
            </a>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* Contact Details */}
            <Card className="card-dental">
              <CardHeader>
                <CardTitle className="heading-md text-dental-charcoal">Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <Phone className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-dental-charcoal mb-1">Phone</h4>
                        <a href={`tel:${phoneNumber}`} className="text-dental-slate hover:text-blue-600 transition-colors">
                          {phoneNumber}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <Mail className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-dental-charcoal mb-1">Email</h4>
                        <a href={`mailto:${email}`} className="text-dental-slate hover:text-blue-600 transition-colors">
                          {email}
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-dental-charcoal mb-1">Address</h4>
                        <p className="text-dental-slate">{address}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <Clock className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-dental-charcoal mb-1">Working Hours</h4>
                        <div className="text-dental-slate space-y-1">
                          <p>Monday - Saturday: 9:00 AM - 8:00 PM</p>
                          <p>Sunday: Closed</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Google Maps */}
            <Card className="card-dental overflow-hidden">
              <CardHeader>
                <CardTitle className="heading-md text-dental-charcoal flex items-center gap-2">
                  <NavigationIcon className="w-5 h-5 text-blue-600" />
                  Find Us
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-64 bg-dental-mint flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                    <p className="text-dental-slate font-medium">Interactive Map</p>
                    <p className="text-sm text-dental-slate">Click to open in Google Maps</p>
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                    >
                      <NavigationIcon className="w-4 h-4" />
                      Open in Maps
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-16 bg-white/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="heading-md text-dental-charcoal mb-4">Why Choose Jeshna Dental Care?</h2>
            <p className="text-dental-slate max-w-2xl mx-auto">
              Experience the difference of personalized dental care with modern technology and compassionate service.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-dental-charcoal mb-2">5.0 Rating</h3>
              <p className="text-dental-slate text-sm">Based on 100+ patient reviews</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-dental-charcoal mb-2">Flexible Hours</h3>
              <p className="text-dental-slate text-sm">Open 6 days a week for your convenience</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-dental-charcoal mb-2">Quick Response</h3>
              <p className="text-dental-slate text-sm">We respond within 24 hours</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ContactPage;


