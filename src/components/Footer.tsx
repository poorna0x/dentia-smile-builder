import { Link } from 'react-router-dom';
import { Facebook, Twitter, MessageCircle, Instagram, Youtube, MapPin, Phone, Mail } from 'lucide-react';
import logo from '@/assets/logo.png';

const Footer = () => {
  const currentYear = new Date().getFullYear(); // Dynamic year

  return (
    <footer id="contact" className="bg-primary text-primary-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center">
              <div className="w-15 h-14 rounded-full overflow-hidden mr-0">
                <img 
                  src={logo} 
                  alt="Jeshna Dental Logo" 
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xl font-bold ml-[-15px]">Jeshna</span>
            </Link>
            <p className="text-primary-foreground/80 text-sm leading-relaxed">
              Providing exceptional dental care with a personal touch. Your smile is our priority, and we're committed to helping you achieve optimal oral health.
            </p>
            <div className="flex space-x-4">
              <Facebook className="w-5 h-5 text-primary-foreground/60 hover:text-accent cursor-pointer transition-colors" />
              <Twitter className="w-5 h-5 text-primary-foreground/60 hover:text-accent cursor-pointer transition-colors" />
              <MessageCircle className="w-5 h-5 text-primary-foreground/60 hover:text-accent cursor-pointer transition-colors" />
              <Instagram className="w-5 h-5 text-primary-foreground/60 hover:text-accent cursor-pointer transition-colors" />
              <Youtube className="w-5 h-5 text-primary-foreground/60 hover:text-accent cursor-pointer transition-colors" />
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <button 
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="text-primary-foreground/80 hover:text-accent transition-colors text-left"
                >
                  Home
                </button>
              </li>
              <li><button 
                onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-primary-foreground/80 hover:text-accent transition-colors text-left"
              >
                Services
              </button></li>
              <li><button 
                onClick={() => document.getElementById('team')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-primary-foreground/80 hover:text-accent transition-colors text-left"
              >
                Dentists
              </button></li>
              <li><button 
                onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: 'smooth' })}
                className="text-primary-foreground/80 hover:text-accent transition-colors text-left"
              >
                Contact
              </button></li>
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Services</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/services#general" className="text-primary-foreground/80 hover:text-accent transition-colors">General Dentistry</Link></li>
              <li><Link to="/services#cosmetic" className="text-primary-foreground/80 hover:text-accent transition-colors">Cosmetic Dentistry</Link></li>
              <li><Link to="/services#pediatric" className="text-primary-foreground/80 hover:text-accent transition-colors">Pediatric Dentistry</Link></li>
              <li><Link to="/services#restorative" className="text-primary-foreground/80 hover:text-accent transition-colors">Restorative Dentistry</Link></li>
              <li><Link to="/services#implants" className="text-primary-foreground/80 hover:text-accent transition-colors">Dental Implants</Link></li>
              <li><Link to="/services#whitening" className="text-primary-foreground/80 hover:text-accent transition-colors">Teeth Whitening</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Contact Info</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-accent mt-1 flex-shrink-0" />
                <a 
                  href="https://maps.app.goo.gl/yuqc2tEqDEyP1L537" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-primary-foreground/80 hover:text-accent transition-colors"
                >
                  Location
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-accent" />
                <a 
                  href="tel:+6363116263" 
                  className="text-primary-foreground/80 hover:text-accent transition-colors"
                >
                  Contact us
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-accent" />
                <a 
                  href="mailto:contact@jeshnadentalclinic.com" 
                  className="text-primary-foreground/80 hover:text-accent transition-colors"
                >
                  contact@jeshnadentalclinic.com
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-primary-foreground/20 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-primary-foreground/60 text-sm">
            © {currentYear} Jeshna Dental Clinic. All rights reserved.
          </p>
          <div className="flex space-x-6 text-sm">
            <span className="text-primary-foreground/60 hover:text-accent cursor-pointer transition-colors">Terms & Conditions</span>
            <span className="text-primary-foreground/60 hover:text-accent cursor-pointer transition-colors">Privacy Policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;