/**
 * Navigation Component
 * 
 * This component provides the main navigation for the dental clinic website.
 * It includes:
 * - Contact information bar (desktop only)
 * - Main navigation with logo and menu items
 * - Mobile-responsive hamburger menu
 * - Call-to-action buttons
 * 
 * Navigation Features:
 * - Logo links to home page (/)
 * - Responsive design for mobile and desktop
 * - Active state highlighting for current page
 * - Direct phone call functionality
 * - Appointment booking link
 * 
 * @returns JSX.Element - The navigation component
 */
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Phone, Clock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.webp';
const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Contact Bar */}
      <div className="hidden md:block bg-secondary py-2">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center space-x-8 text-sm text-secondary-foreground">
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-accent" />
              <span>6363116263</span> {/* TODO: Change to your clinic phone number */}
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-accent" />
              <span>Mon to Sat 09:00 - 20:00</span> {/* TODO: Change to your clinic working hours */}
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-accent" />
              <span>contact@jeshnadentalclinic.com</span> {/* TODO: Change to your clinic email */}
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="nav-dental sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <img 
                src={logo} 
                alt="Jeshna Dental Logo" 
                className="h-12 w-auto" 
              /> {/* TODO: Change logo and alt text to your clinic */}
              <span className="text-xl font-bold text-primary hidden sm:block">
                Jeshna Dental {/* TODO: Change to your clinic name */}
              </span>
            </Link>


            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center space-x-8">
              <Link 
                to="/" 
                className={`font-medium transition-colors hover:text-accent ${
                  isActive('/') ? 'text-accent' : 'text-primary-foreground'
                }`}
              >
                Home
              </Link>
              <Link 
                to="/services" 
                className={`font-medium transition-colors hover:text-accent ${
                  isActive('/services') ? 'text-accent' : 'text-primary-foreground'
                }`}
              >
                Services
              </Link>
              <Link 
                to="/dentists" 
                className={`font-medium transition-colors hover:text-accent ${
                  isActive('/dentists') ? 'text-accent' : 'text-primary-foreground'
                }`}
              >
                Dentists
              </Link>
              <Link 
                to="/contact" 
                className={`font-medium transition-colors hover:text-accent ${
                  isActive('/contact') ? 'text-accent' : 'text-primary-foreground'
                }`}
              >
                Contact
              </Link>
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden md:flex items-center space-x-3">
              <a href="tel:6363116263">
                <Button className="btn-call">
                  <Phone className="w-4 h-4 mr-2" />
                  Call Now
                </Button>
              </a>
              <Link to="/appointment">
                <Button className="btn-appointment">
                  Book Appointment
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden text-primary-foreground"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden bg-primary border-t border-primary-foreground/20">
            <div className="container mx-auto px-4 py-4 space-y-4">
              <Link 
                to="/" 
                className={`block py-2 font-medium transition-colors hover:text-accent ${
                  isActive('/') ? 'text-accent' : 'text-primary-foreground'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                to="/services" 
                className={`block py-2 font-medium transition-colors hover:text-accent ${
                  isActive('/services') ? 'text-accent' : 'text-primary-foreground'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Services
              </Link>
              <Link 
                to="/dentists" 
                className={`block py-2 font-medium transition-colors hover:text-accent ${
                  isActive('/dentists') ? 'text-accent' : 'text-primary-foreground'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Dentists
              </Link>
              <Link 
                to="/contact" 
                className={`block py-2 font-medium transition-colors hover:text-accent ${
                  isActive('/contact') ? 'text-accent' : 'text-primary-foreground'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
              <div className="space-y-2 pt-4">
                <a href="tel:6363116263" onClick={() => setIsMenuOpen(false)}> {/* TODO: Change to your clinic phone number */}
                  <Button className="btn-call w-full">
                    <Phone className="w-4 h-4 mr-2" />
                    Call Now
                  </Button>
                </a>
                <p></p>
                <Link to="/appointment" onClick={() => setIsMenuOpen(false)}>
                  <Button className="btn-appointment w-full">
                    Book Appointment
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navigation;