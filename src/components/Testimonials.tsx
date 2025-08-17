import { Star, Quote } from 'lucide-react';

const Testimonials = () => {
  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Mother of Two',
      rating: 5,
      text: 'Dentia has been incredible for our family. Dr. Bennett is so gentle with my kids, and they actually look forward to their dental visits now! The staff is amazing and the office is beautiful.',
      image: '👩‍💼' // Using emoji as placeholder
    },
    {
      name: 'Michael Chen',
      role: 'Business Executive',
      rating: 5,
      text: 'I was nervous about getting dental implants, but Dr. Lin made the entire process comfortable and explained everything clearly. The results exceeded my expectations. Highly recommend!',
      image: '👨‍💼'
    },
    {
      name: 'Emma Rodriguez',
      role: 'Teacher',
      rating: 5,
      text: 'The cosmetic dentistry work I had done has completely transformed my confidence. Dr. Maya Lin is an artist! The teeth whitening and veneers look so natural. Thank you Dentia!',
      image: '👩‍🏫'
    },
    {
      name: 'David Thompson',
      role: 'Retiree',
      rating: 5,
      text: 'After years of dental anxiety, I finally found a place where I feel comfortable. The team at Dentia is patient, understanding, and their gentle approach has changed my perspective on dental care.',
      image: '👨‍🦳'
    }
  ];

  return (
    <section className="py-16 lg:py-24 section-gradient">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center space-y-4 mb-12 lg:mb-16">
          <h2 className="heading-lg text-primary">What Our Patients Say</h2>
          <p className="body-lg text-muted-foreground max-w-2xl mx-auto">
            Don't just take our word for it. Here's what our satisfied patients have to say about 
            their experience at Dentia Clinic.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="card-dental relative">
              {/* Quote Icon */}
              <div className="absolute -top-4 -left-4 w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                <Quote className="w-4 h-4 text-accent-foreground" />
              </div>

              {/* Content */}
              <div className="space-y-6">
                {/* Stars */}
                <div className="flex space-x-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                {/* Testimonial Text */}
                <blockquote className="body-md text-primary leading-relaxed">
                  "{testimonial.text}"
                </blockquote>

                {/* Author */}
                <div className="flex items-center space-x-4 pt-4 border-t border-border">
                  <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center text-2xl">
                    {testimonial.image}
                  </div>
                  <div>
                    <p className="font-semibold text-primary">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center space-x-2 bg-white/80 rounded-2xl px-6 py-3">
            <div className="flex space-x-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <span className="font-semibold text-primary">5.0 Rating</span>
            <span className="text-muted-foreground">from 1,200+ verified reviews</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;