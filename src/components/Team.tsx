import { Link } from 'react-router-dom';
import { Phone } from 'lucide-react';
import drSarahBennett from '@/assets/dr-sarah-bennett.jpg';
import { Button } from '@/components/ui/button';

const Team = () => {
  const teamMember = {
    name: 'Dr. Prasanna A Chandan',
    role: 'Lead Dentist & Practice Owner',
    image: drSarahBennett,
    specialties: ['General Dentistry', 'Cosmetic Dentistry', 'Pediatric Dentistry', 'Dental Implants'],
    experience: '15+ Years Experience',
    description: 'Dr. Prasanna is passionate about creating beautiful, healthy smiles while ensuring every patient feels comfortable and cared for during their visit.'
  };

  return (
    <section id="team" className="py-16 lg:py-24 section-gradient">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center space-y-4 mb-12 lg:mb-16">
          <h2 className="heading-lg text-primary">Meet Our Lead Dentist</h2>
          <p className="body-lg text-muted-foreground max-w-2xl mx-auto">
            Our experienced dental professional is committed to providing you with the highest quality 
            care in a comfortable and welcoming environment.
          </p>
        </div>

        {/* Featured Doctor */}
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Image Section */}
            <div className="relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl group">
                <img
                  src={teamMember.image}
                  alt={teamMember.name}
                  className="w-full h-auto group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            </div>

            {/* Content Section */}
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-3xl lg:text-4xl font-bold text-primary">{teamMember.name}</h3>
                <p className="text-xl text-accent font-semibold">{teamMember.role}</p>
                <p className="text-lg text-muted-foreground">{teamMember.experience}</p>
              </div>

              <div className="space-y-4">
                <p className="body-lg text-primary leading-relaxed">
                  {teamMember.description}
                </p>
                
               

                <div className="space-y-3">
                  <p className="font-semibold text-primary">Specialties:</p>
                  <div className="flex flex-wrap gap-2">
                    {teamMember.specialties.map((specialty, i) => (
                      <span
                        key={i}
                        className="px-4 py-2 bg-accent/10 text-accent rounded-full text-sm font-medium border border-accent/20"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="pt-6 flex flex-col sm:flex-row gap-3">
                  <Link to="/appointment">
                    <Button className="btn-appointment w-full sm:w-auto">
                      Book with Dr. Prasanna
                    </Button>
                  </Link>
                  <a href="tel:+6363116263">
                    <Button className="btn-call w-full sm:w-auto">
                      <Phone className="w-4 h-4 mr-2" />
                      Call Direct
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Team;