import { Users, Sparkles, Shield, Calendar } from 'lucide-react';

const Stats = () => {
  const stats = [
    {
      icon: Users,
      number: '10,000+',
      label: 'Happy Patients',
      description: 'Trusted by thousands'
    },
    {
      icon: Sparkles,
      number: '2,500+',
      label: 'Teeth Whitened',
      description: 'Brighter smiles delivered'
    },
    {
      icon: Shield,
      number: '800+',
      label: 'Dental Implants',
      description: 'Successful procedures'
    },
    {
      icon: Calendar,
      number: '15+',
      label: 'Years of Experience',
      description: 'Proven expertise'
    }
  ];

  return (
    <section className="py-16 lg:py-24 bg-primary">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-12">
          <h2 className="heading-lg text-primary-foreground">Our Track Record</h2>
          <p className="body-lg text-primary-foreground/80 max-w-2xl mx-auto">
            Numbers that speak to our commitment to excellence and the trust our patients place in us.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            
            return (
              <div key={index} className="text-center space-y-4 group">
                <div className="flex justify-center">
                  <div className="p-4 bg-accent/20 rounded-3xl group-hover:bg-accent/30 transition-colors">
                    <IconComponent className="w-10 h-10 text-accent" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-3xl lg:text-4xl font-bold text-primary-foreground">
                    {stat.number}
                  </h3>
                  <p className="text-xl font-semibold text-accent">
                    {stat.label}
                  </p>
                  <p className="text-primary-foreground/70">
                    {stat.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Stats;