import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Phone, Clock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
              <span>6361631253</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-accent" />
              <span>Mon to Sat 08:00 - 20:00</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-accent" />
              <span>contact@dentiaclinic.com</span>
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
              <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                <span className="text-accent-foreground font-bold text-sm">🦷</span>
              </div>
              <span className="text-xl font-bold">Jeshna</span>
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
              <button 
                onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-primary-foreground/70 cursor-pointer hover:text-accent transition-colors font-medium"
              >
                Services
              </button>
              <button 
                onClick={() => document.getElementById('team')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-primary-foreground/70 cursor-pointer hover:text-accent transition-colors font-medium"
              >
                Dentists
              </button>
              <button 
                onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-primary-foreground/70 cursor-pointer hover:text-accent transition-colors font-medium"
              >
                Contact
              </button>
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden md:flex items-center space-x-3">
              <a href="tel:+1123456789">
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
              <button 
                onClick={() => {
                  document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
                  setIsMenuOpen(false);
                }}
                className="block py-2 text-primary-foreground/70 cursor-pointer hover:text-accent transition-colors font-medium text-left w-full"
              >
                Services
              </button>
              <button 
                onClick={() => {
                  document.getElementById('team')?.scrollIntoView({ behavior: 'smooth' });
                  setIsMenuOpen(false);
                }}
                className="block py-2 text-primary-foreground/70 cursor-pointer hover:text-accent transition-colors font-medium text-left w-full"
              >
                Dentists
              </button>
              <button 
                onClick={() => {
                  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                  setIsMenuOpen(false);
                }}
                className="block py-2 text-primary-foreground/70 cursor-pointer hover:text-accent transition-colors font-medium text-left w-full"
              >
                Contact
              </button>
              <div className="space-y-2 pt-4">
                <a href="tel:+1123456789" onClick={() => setIsMenuOpen(false)}>
                  <Button className="btn-call w-full">
                    <Phone className="w-4 h-4 mr-2" />
                    Call Now
                  </Button>
                </a>
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