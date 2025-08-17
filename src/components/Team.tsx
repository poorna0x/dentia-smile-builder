import drSarahBennett from '@/assets/dr-sarah-bennett.jpg';
import drMayaLin from '@/assets/dr-maya-lin.jpg';
import drMichaelReyes from '@/assets/dr-michael-reyes.jpg';
import drJamesCarter from '@/assets/dr-james-carter.jpg';

const Team = () => {
  const teamMembers = [
    {
      name: 'Dr. Sarah Bennett',
      role: 'Lead Dentist',
      image: drSarahBennett,
      specialties: ['General Dentistry', 'Oral Surgery', 'Dental Implants']
    },
    {
      name: 'Dr. Maya Lin',
      role: 'Cosmetic Dentist',
      image: drMayaLin,
      specialties: ['Cosmetic Dentistry', 'Veneers', 'Teeth Whitening']
    },
    {
      name: 'Dr. Michael Reyes',
      role: 'Pediatric Specialist',
      image: drMichaelReyes,
      specialties: ['Pediatric Dentistry', 'Children\'s Care', 'Preventive Care']
    },
    {
      name: 'Dr. James Carter',
      role: 'Dental Hygienist',
      image: drJamesCarter,
      specialties: ['Preventive Care', 'Teeth Cleaning', 'Oral Health Education']
    }
  ];

  return (
    <section id="team" className="py-16 lg:py-24 section-gradient">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center space-y-4 mb-12 lg:mb-16">
          <h2 className="heading-lg text-primary">Meet Our Expert Team</h2>
          <p className="body-lg text-muted-foreground max-w-2xl mx-auto">
            Our skilled dental professionals are committed to providing you with the highest quality 
            care in a comfortable and welcoming environment.
          </p>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {teamMembers.map((member, index) => (
            <div key={index} className="card-dental text-center group">
              {/* Image */}
              <div className="relative mb-6">
                <div className="w-32 h-32 mx-auto rounded-full overflow-hidden shadow-lg">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
              </div>

              {/* Content */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-primary">{member.name}</h3>
                  <p className="text-accent font-semibold">{member.role}</p>
                </div>

                {/* Specialties */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-primary">Specialties:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {member.specialties.map((specialty, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-secondary text-secondary-foreground text-xs rounded-full"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Team;