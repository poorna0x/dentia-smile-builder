import { Award, Zap, Heart } from 'lucide-react';
import dentistPatientImage from '@/assets/dentist-patient1.jpg';

const WhyChooseUs = () => {
  const reasons = [
    {
      icon: Award,
      title: 'Experienced Professionals',
      description: 'Our team of highly qualified dentists brings years of expertise and continuous training to provide you with the best care possible.'
    },
    {
      icon: Zap,
      title: 'Advanced Technology',
      description: 'We use cutting-edge dental technology and modern techniques to ensure precise, comfortable, and efficient treatments.'
    },
    {
      icon: Heart,
      title: 'Personal Touch',
      description: 'Every patient receives individualized attention and customized treatment plans tailored to their unique needs and preferences.'
    }
  ];

  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center space-y-4 mb-12 lg:mb-16">
          <h2 className="heading-lg text-primary">
            Exceptional Service With a Personal Touch
          </h2>
          <p className="body-lg text-muted-foreground max-w-3xl mx-auto">
            What sets us apart is our commitment to providing personalized dental care that combines 
            the latest technology with genuine compassion. We believe in treating every patient like family.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-16">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h3 className="heading-md text-primary">
                Why Thousands Choose Dentia
              </h3>
              <p className="body-lg text-muted-foreground">
                We've built our reputation on delivering exceptional dental care that goes beyond expectations. 
                Our patient-first approach ensures you receive the attention and quality care you deserve.
              </p>
            </div>

            {/* Reasons List */}
            <div className="space-y-6">
              {reasons.map((reason, index) => {
                const IconComponent = reason.icon;
                
                return (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="p-3 bg-accent/10 rounded-2xl flex-shrink-0">
                      <IconComponent className="w-6 h-6 text-accent" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-lg font-semibold text-primary">
                        {reason.title}
                      </h4>
                      <p className="body-md text-muted-foreground">
                        {reason.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Images */}
          <div className="space-y-6">
            <div className="rounded-3xl overflow-hidden shadow-xl">
              <img
                src={dentistPatientImage}
                alt="Professional dental care"
                className="w-full h-auto"
              />
            </div>
            
            {/* Additional image grid could go here if needed */}
            <div className="grid grid-cols-2 gap-4">
              <div className="aspect-square bg-secondary rounded-2xl flex items-center justify-center">
                <Award className="w-12 h-12 text-accent" />
              </div>
              <div className="aspect-square bg-secondary rounded-2xl flex items-center justify-center">
                <Zap className="w-12 h-12 text-accent" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;