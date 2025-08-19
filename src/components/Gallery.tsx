import { useEffect, useState } from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
import img1 from '@/assets/dentist-patient.jpg';

const Gallery = () => {
  const [api, setApi] = useState<CarouselApi | undefined>(undefined);

  useEffect(() => {
    if (!api) return;
    const interval = setInterval(() => {
      api.scrollNext();
    }, 1000);
    return () => clearInterval(interval);
  }, [api]);

  const images = [img1, img1, img1, img1];

  return (
    <section className="py-12 lg:py-20" aria-label="Clinic Gallery">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="heading-xl text-primary">Gallery</h2>
            <p className="text-muted-foreground">A glimpse into our clinic</p>
          </div>
        </div>

        <div className="relative">
          <Carousel setApi={setApi} opts={{ loop: true }}>
            <CarouselContent>
              {images.map((src, idx) => (
                <CarouselItem key={idx} className="md:basis-1/2 lg:basis-1/3">
                  <div className="p-2">
                    <div className="overflow-hidden rounded-2xl shadow-md">
                      <img src={src} alt={`Gallery ${idx + 1}`} className="w-full h-64 object-cover" />
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex" />
            <CarouselNext className="hidden sm:flex" />
          </Carousel>
        </div>
      </div>
    </section>
  );
};

export default Gallery;



