import { Link } from 'react-router-dom';
import { Facebook, Twitter, MessageCircle, Instagram, Youtube, MapPin, Phone, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer id="contact" className="bg-primary text-primary-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                <span className="text-accent-foreground font-bold text-sm">🦷</span>
              </div>
              <span className="text-xl font-bold">Dentia</span>
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
              <li><Link to="/" className="text-primary-foreground/80 hover:text-accent transition-colors">Home</Link></li>
              <li><span className="text-primary-foreground/80 hover:text-accent cursor-pointer transition-colors">About Us</span></li>
              <li><span className="text-primary-foreground/80 hover:text-accent cursor-pointer transition-colors">Services</span></li>
              <li><span className="text-primary-foreground/80 hover:text-accent cursor-pointer transition-colors">Our Team</span></li>
              <li><span className="text-primary-foreground/80 hover:text-accent cursor-pointer transition-colors">Blog</span></li>
              <li><span className="text-primary-foreground/80 hover:text-accent cursor-pointer transition-colors">Contact</span></li>
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Services</h3>
            <ul className="space-y-2 text-sm">
              <li><span className="text-primary-foreground/80 hover:text-accent cursor-pointer transition-colors">General Dentistry</span></li>
              <li><span className="text-primary-foreground/80 hover:text-accent cursor-pointer transition-colors">Cosmetic Dentistry</span></li>
              <li><span className="text-primary-foreground/80 hover:text-accent cursor-pointer transition-colors">Pediatric Dentistry</span></li>
              <li><span className="text-primary-foreground/80 hover:text-accent cursor-pointer transition-colors">Restorative Dentistry</span></li>
              <li><span className="text-primary-foreground/80 hover:text-accent cursor-pointer transition-colors">Dental Implants</span></li>
              <li><span className="text-primary-foreground/80 hover:text-accent cursor-pointer transition-colors">Teeth Whitening</span></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Contact Info</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-accent mt-1 flex-shrink-0" />
                <span className="text-primary-foreground/80">100 Main St, New York, NY 10001</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-accent" />
                <span className="text-primary-foreground/80">+1 123 456 789</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-accent" />
                <span className="text-primary-foreground/80">contact@dentiaclinic.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-primary-foreground/20 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-primary-foreground/60 text-sm">
            © 2024 Dentia Clinic. All rights reserved.
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