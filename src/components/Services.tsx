import { useState } from 'react';
import { Plus, Minus, Shield, Sparkles, Heart, Wrench } from 'lucide-react';

const Services = () => {
  const [expandedService, setExpandedService] = useState<number | null>(null);

  const services = [
    {
      icon: Shield,
      title: 'General Dentistry',
      description: 'Comprehensive oral health care including cleanings, fillings, and preventive treatments.',
      details: 'Our general dentistry services form the foundation of oral health. We provide routine cleanings, comprehensive exams, fillings, and preventive care to keep your smile healthy and bright.'
    },
    {
      icon: Sparkles,
      title: 'Cosmetic Dentistry',
      description: 'Transform your smile with whitening, veneers, and aesthetic treatments.',
      details: 'Enhance your natural beauty with our cosmetic dentistry options including professional teeth whitening, porcelain veneers, smile makeovers, and aesthetic bonding procedures.'
    },
    {
      icon: Heart,
      title: 'Pediatric Dentistry',
      description: 'Specialized gentle care for children in a fun, comfortable environment.',
      details: 'We make dental visits enjoyable for kids with our child-friendly approach, specialized pediatric treatments, and prevention-focused care to establish lifelong healthy oral habits.'
    },
    {
      icon: Wrench,
      title: 'Restorative Dentistry',
      description: 'Repair and restore damaged teeth with crowns, bridges, and implants.',
      details: 'Restore your smile\'s function and appearance with our advanced restorative treatments including dental implants, crowns, bridges, and dentures using the latest materials and techniques.'
    }
  ];

  const toggleService = (index: number) => {
    setExpandedService(expandedService === index ? null : index);
  };

  return (
    <section id="services" className="py-16 lg:py-24 section-gradient">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center space-y-4 mb-12 lg:mb-16">
          <h2 className="heading-lg text-primary">Our Comprehensive Services</h2>
          <p className="body-lg text-muted-foreground max-w-2xl mx-auto">
            From routine cleanings to advanced procedures, we offer a full range of dental services 
            to meet all your oral health needs under one roof.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {services.map((service, index) => {
            const IconComponent = service.icon;
            const isExpanded = expandedService === index;

            return (
              <div key={index} className="card-dental group">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-accent/10 rounded-2xl group-hover:bg-accent/20 transition-colors">
                    <IconComponent className="w-8 h-8 text-accent" />
                  </div>
                  <button
                    onClick={() => toggleService(index)}
                    className="p-2 rounded-full hover:bg-muted transition-colors"
                    aria-label={isExpanded ? 'Collapse service' : 'Expand service'}
                  >
                    {isExpanded ? (
                      <Minus className="w-5 h-5 text-accent" />
                    ) : (
                      <Plus className="w-5 h-5 text-accent" />
                    )}
                  </button>
                </div>

                <div className="space-y-3">
                  <h3 className="heading-md text-primary">{service.title}</h3>
                  <p className="body-md text-muted-foreground">
                    {service.description}
                  </p>
                  
                  {isExpanded && (
                    <div className="pt-3 border-t border-border">
                      <p className="body-md text-primary">
                        {service.details}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Services;