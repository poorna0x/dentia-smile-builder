import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const FAQ = () => {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const faqs = [
    {
      question: 'How often should I visit the dentist?',
      answer: 'We recommend visiting the dentist every 6 months for routine cleanings and checkups. However, some patients may need more frequent visits based on their individual oral health needs. Regular visits help prevent problems and catch issues early when they\'re easier to treat.'
    },
    {
      question: 'What should I expect during my first visit?',
      answer: 'During your first visit, we\'ll conduct a comprehensive examination including X-rays, oral cancer screening, and assessment of your teeth and gums. We\'ll discuss your medical history, current concerns, and develop a personalized treatment plan. The visit typically takes 60-90 minutes.'
    },
    {
      question: 'Is teeth whitening safe?',
      answer: 'Professional teeth whitening performed in our office is completely safe when done correctly. We use clinically proven whitening agents and custom-fitted trays to ensure even results while protecting your teeth and gums. The procedure is comfortable and provides dramatic results.'
    },
    {
      question: 'What age should children start seeing a dentist?',
      answer: 'Children should have their first dental visit by age 1 or within 6 months after their first tooth appears. Early visits help establish good oral hygiene habits, prevent problems, and ensure proper dental development. We make pediatric visits fun and comfortable.'
    },
    {
      question: 'How can I maintain good oral health at home?',
      answer: 'Brush twice daily with fluoride toothpaste, floss daily, use an antimicrobial mouthwash, eat a balanced diet low in sugary snacks, and avoid tobacco products. Regular dental visits complement your home care routine for optimal oral health.'
    }
  ];

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center space-y-4 mb-12 lg:mb-16">
          <h2 className="heading-lg text-primary">Frequently Asked Questions</h2>
          <p className="body-lg text-muted-foreground max-w-2xl mx-auto">
            Find answers to common questions about dental care, our services, and what to expect 
            during your visit to our clinic.
          </p>
        </div>

        {/* FAQ Items */}
        <div className="max-w-4xl mx-auto space-y-4">
          {faqs.map((faq, index) => {
            const isExpanded = expandedFaq === index;

            return (
              <div key={index} className="card-dental">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between text-left"
                  aria-expanded={isExpanded}
                >
                  <h3 className="text-lg font-semibold text-primary pr-4">
                    {faq.question}
                  </h3>
                  <div className="flex-shrink-0">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-accent" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-accent" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="pt-4 border-t border-border mt-4">
                    <p className="body-md text-muted-foreground">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQ;