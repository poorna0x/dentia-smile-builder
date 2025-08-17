import { Star, Quote, ThumbsUp, Heart, Smile } from 'lucide-react';

const Testimonials = () => {
  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Mother of Two',
      rating: 5,
      text: 'Dentia has been incredible for our family. Dr. Bennett is so gentle with my kids, and they actually look forward to their dental visits now! The staff is amazing and the office is beautiful.',
      icon: Heart
    },
    {
      name: 'Michael Chen',
      role: 'Business Executive',
      rating: 5,
      text: 'I was nervous about getting dental implants, but Dr. Bennett made the entire process comfortable and explained everything clearly. The results exceeded my expectations.',
      icon: ThumbsUp
    },
    {
      name: 'Emma Rodriguez',
      role: 'Teacher',
      rating: 5,
      text: 'The cosmetic dentistry work I had done has completely transformed my confidence. Dr. Bennett is an artist! The teeth whitening and veneers look so natural.',
      icon: Smile
    },
    {
      name: 'David Thompson',
      role: 'Retiree',
      rating: 5,
      text: 'After years of dental anxiety, I finally found a place where I feel comfortable. The team at Dentia is patient, understanding, and their gentle approach changed my perspective.',
      icon: Heart
    }
  ];

  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center space-y-4 mb-12 lg:mb-16">
          <h2 className="heading-lg text-primary">What Our Patients Say</h2>
          <p className="body-lg text-muted-foreground max-w-2xl mx-auto">
            Real stories from real patients who trust us with their smiles. 
            Here's what makes the Dentia experience special.
          </p>
        </div>

        {/* Testimonials Slider Style Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => {
            const IconComponent = testimonial.icon;
            
            return (
              <div 
                key={index} 
                className="group relative bg-gradient-to-br from-secondary to-white p-8 rounded-3xl border border-border/50 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
              >
                {/* Decorative Icon */}
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-accent rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <IconComponent className="w-6 h-6 text-accent-foreground" />
                </div>

                {/* Stars */}
                <div className="flex space-x-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                {/* Testimonial Text */}
                <blockquote className="body-md text-primary leading-relaxed mb-6 relative">
                  <Quote className="absolute -top-2 -left-2 w-8 h-8 text-accent/20" />
                  <span className="relative z-10">"{testimonial.text}"</span>
                </blockquote>

                {/* Author */}
                <div className="flex items-center space-x-4">
                 
                  <div>
                    <p className="font-bold text-primary text-lg">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>

                {/* Hover Effect Line */}
                <div className="absolute bottom-0 left-0 w-0 h-1 bg-gradient-to-r from-accent to-primary group-hover:w-full transition-all duration-500 rounded-b-3xl"></div>
              </div>
            );
          })}
        </div>

        {/* Bottom Stats */}
        <div className="text-center mt-16">
          <div className="inline-flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-8 bg-gradient-to-r from-secondary to-white rounded-3xl px-8 py-6 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="font-bold text-primary text-xl">5.0 Rating</span>
            </div>
            <div className="text-muted-foreground">
              <span className="font-semibold text-primary">100+</span> verified reviews
            </div>
            <div className="text-muted-foreground">
              <span className="font-semibold text-primary">100%</span> recommend us
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;