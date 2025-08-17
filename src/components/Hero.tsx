import { useState, useEffect } from 'react';
import {Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Star, Phone, Clock, Mail, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import heroFamilyImage from '@/assets/hero-family.jpg';
import heroOfficeImage from '@/assets/hero-office.jpg';
import heroSmileImage from '@/assets/hero-smile.jpg';

const Hero = () => {
  const [currentImage, setCurrentImage] = useState(0);
  
  const heroImages = [
    {
      src: heroFamilyImage,
      alt: 'Happy family with beautiful smiles'
    },
    {
      src: heroOfficeImage,
      alt: 'Modern dental office interior'
    },
    {
      src: heroSmileImage,
      alt: 'Perfect healthy smile'
    }
  ];

  // Auto-rotate images every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % heroImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [heroImages.length]);

  const goToPrevious = () => {
    setCurrentImage((prev) => (prev - 1 + heroImages.length) % heroImages.length);
  };

  const goToNext = () => {
    setCurrentImage((prev) => (prev + 1) % heroImages.length);
  };

  return (
    <section className="relative min-h-screen flex items-center hero-gradient">
      {/* Image Carousel */}
      <div className="absolute inset-0 z-0">
        {heroImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentImage ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={image.src}
              alt={image.alt}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-primary/60"></div>
      </div>

    

      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center text-white space-y-8">
          {/* Main Headline */}
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight animate-fade-in">
              Family Dental Care: <br />
              <span className="text-accent">Elevating Smiles</span> with Expert Care and a Gentle Touch
            </h1>
            
            {/* Google Rating */}
            <div className="flex justify-center items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-3 w-fit mx-auto animate-fade-in">
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
           <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in">
      <Link to="/appointment" className="w-52">
        <Button className="btn-appointment text-lg px-8 py-4 w-full flex items-center justify-center gap-2">
          <Calendar className="w-5 h-5" />
          Book Appointment
        </Button>
      </Link>

      <a href="tel:+1123456789" className="w-52">
        <Button className="btn-call text-lg px-8 py-4 w-full flex items-center justify-center gap-2">
          <Phone className="w-5 h-5" />
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