import { useState } from 'react';
import { Plus, Minus, Stethoscope, Smile, Baby, Zap, Scissors, Droplets, Activity, Shield, Eye, Clock, Pill, Wrench, AlertCircle, Star, Heart } from 'lucide-react';

const Services = () => {
  const [expandedService, setExpandedService] = useState<number | null>(null);

  const services = [
    {
      icon: Clock,
      title: 'Regular Checkups',
      description: 'Preventive care and routine dental visits.',
      details: 'Regular dental checkups, cleanings, fluoride treatments, and oral cancer screenings to maintain healthy teeth and catch problems early.'
    },
    {
      icon: Stethoscope,
      title: 'Teeth Cleaning',
      description: 'Regular cleanings, checkups, and basic dental care.',
      details: 'Our general dentistry services include routine teeth cleaning, dental exams, fillings, and preventive care to keep your teeth healthy and prevent problems.'
    },
    {
      icon: Wrench,
      title: 'Dental Fillings',
      description: 'Repair cavities with tooth-colored fillings.',
      details: 'Modern composite fillings that match your natural tooth color. We repair cavities quickly and comfortably to restore your tooth\'s function and appearance.'
    },
    {
      icon: AlertCircle,
      title: 'Tooth Pain Relief',
      description: 'Immediate treatment for toothaches and dental pain.',
      details: 'Quick relief from tooth pain, sensitivity, and dental discomfort. We diagnose the cause and provide immediate treatment to get you comfortable again.'
    },
    {
      icon: Pill,
      title: 'Root Canal',
      description: 'Save infected teeth with painless root canal treatment.',
      details: 'Advanced root canal therapy to save infected or damaged teeth. Our gentle approach ensures minimal discomfort while preserving your natural tooth.'
    },
    {
      icon: Scissors,
      title: 'Tooth Extraction',
      description: 'Gentle tooth removal when necessary.',
      details: 'Safe and comfortable tooth extractions for damaged, decayed, or problematic teeth. We ensure minimal pain and quick recovery.'
    },
    {
      icon: Smile,
      title: 'Teeth Whitening',
      description: 'Professional whitening and smile makeover treatments.',
      details: 'Brighten your smile with our professional teeth whitening, veneers, and cosmetic treatments to give you the beautiful smile you deserve.'
    },
    {
      icon: Baby,
      title: 'Kids Dentistry',
      description: 'Gentle dental care for children in a fun environment.',
      details: 'We make dental visits fun for kids with our child-friendly approach, gentle treatments, and preventive care to establish healthy habits early.'
    },
    {
      icon: Droplets,
      title: 'Gum Treatment',
      description: 'Treatment for gum disease and gum health.',
      details: 'Comprehensive gum care including deep cleanings, gum disease treatment, and maintenance therapy to keep your gums healthy and prevent tooth loss.'
    },
    {
      icon: Scissors,
      title: 'Wisdom Teeth Removal',
      description: 'Safe and comfortable wisdom teeth extraction.',
      details: 'Expert wisdom teeth removal, dental extractions, and oral surgery procedures performed with care and precision in a comfortable setting.'
    },
    {
      icon: Activity,
      title: 'Braces',
      description: 'Teeth straightening with braces and clear aligners.',
      details: 'Straighten your teeth with traditional braces, clear aligners, and retainers for a perfect smile and better oral health at any age.'
    },
    {
      icon: Zap,
      title: 'Dental Implants',
      description: 'Replace missing teeth with permanent dental implants.',
      details: 'Restore your smile with dental implants, crowns, bridges, and dentures using the latest technology for natural-looking, long-lasting results.'
    },
    {
      icon: Shield,
      title: 'Emergency Care',
      description: '24/7 urgent dental care for pain and emergencies.',
      details: 'Immediate relief for tooth pain, broken teeth, lost fillings, and other dental emergencies. We provide prompt care when you need it most.'
    },
    {
      icon: Eye,
      title: 'Dental X-Rays',
      description: 'Digital X-rays and imaging for accurate diagnosis.',
      details: 'Advanced digital X-rays, panoramic imaging, and 3D scans provide clear views of your teeth and jaw for precise diagnosis and treatment planning.'
    },
    {
      icon: Star,
      title: 'Crowns & Bridges',
      description: 'Restore damaged teeth with crowns and bridges.',
      details: 'High-quality dental crowns and bridges to restore damaged or missing teeth. We use durable materials that look and feel natural for long-lasting results.'
    },
    {
      icon: Heart,
      title: 'Dental Care for Seniors',
      description: 'Specialized dental care for older adults.',
      details: 'Comprehensive dental care tailored for seniors including denture care, dry mouth treatment, and age-related dental issues to maintain oral health in your golden years.'
    }
  ];

  const toggleService = (index: number) => {
    setExpandedService(expandedService === index ? null : index);
  };

  return (
    <section id="services" className="py-8 lg:py-12 section-gradient">
      <div className="container mx-auto px-4">
        {/* Services Grid - 2 Columns for better readability */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {services.map((service, index) => {
            const IconComponent = service.icon;
            const isExpanded = expandedService === index;

            return (
              <div key={index} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 border border-gray-100">
                {/* Service Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-accent/10 rounded-xl">
                      <IconComponent className="w-8 h-8 text-accent" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-primary mb-1">
                        {service.title}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {service.description}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleService(index)}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
                    aria-label={isExpanded ? 'Collapse service' : 'Expand service'}
                  >
                    {isExpanded ? (
                      <Minus className="w-5 h-5 text-accent" />
                    ) : (
                      <Plus className="w-5 h-5 text-accent" />
                    )}
                  </button>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-gray-700 leading-relaxed">
                      {service.details}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <div className="bg-gradient-to-r from-accent/10 to-primary/10 rounded-xl p-8">
            <h3 className="text-2xl font-bold text-primary mb-4">
              Ready to Schedule Your Appointment?
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Don't wait for dental problems to get worse. Book your appointment today and take the first step towards a healthier smile.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/appointment" 
                className="bg-accent text-white px-8 py-3 rounded-lg font-semibold hover:bg-accent/90 transition-colors text-center"
              >
                Book Appointment
              </a>
              <a 
                href="tel:+1234567890" 
                className="border-2 border-accent text-accent px-8 py-3 rounded-lg font-semibold hover:bg-accent hover:text-white transition-colors text-center"
              >
                Call Now
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;