/**
 * Chatbot Responses Configuration
 * 
 * This file contains all the chatbot responses and conversation flows.
 * Users can customize these responses to match their clinic's voice and services.
 */

export interface ChatbotResponse {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  followUpQuestions?: string[];
  action?: {
    type: 'book_appointment' | 'call_clinic' | 'view_services' | 'emergency' | 'none';
    data?: any;
  };
}

export interface ChatbotSettings {
  welcomeMessage: string;
  fallbackMessage: string;
  typingDelay: number;
  maxRetries: number;
  escalationMessage: string;
}

// Default chatbot responses - users can customize these
export const chatbotResponses: ChatbotResponse[] = [
  {
    id: 'welcome',
    question: 'hello|hi|hey|good morning|good afternoon|good evening',
    answer: 'Hello! Welcome to {clinicName}. I\'m here to help you with any questions about our dental services, appointments, or general inquiries. How can I assist you today?',
    keywords: ['hello', 'hi', 'hey', 'welcome'],
        followUpQuestions: [
          'I want to book an appointment',
          'What services do you offer?',
          'What are your office hours?',
          'How much does a consultation cost?',
          'What are your payment options?'
        ]
  },
  {
    id: 'appointment_booking',
    question: 'book|appointment|schedule|visit|come in|see dentist',
    answer: 'I\'d be happy to help you book an appointment! We offer convenient scheduling for all our dental services.\n\nQuick Actions:\n[Book Online](/appointment)\n[Call Now](tel:{phone})\n[WhatsApp](https://wa.me/{phone})\n\nWould you like to book online or speak with our staff?',
    keywords: ['book', 'appointment', 'schedule', 'visit'],
    action: {
      type: 'book_appointment'
    },
    followUpQuestions: [
      'Book online now',
      'Call to schedule',
      'What services do you offer?'
    ]
  },
  {
    id: 'office_hours',
    question: 'office hours|clinic hours|opening hours|when open|when closed|business hours',
    answer: 'Our office hours are:\n\nMonday - Friday: 8:00 AM - 6:00 PM\nSaturday: 9:00 AM - 2:00 PM\nSunday: Closed\n\nWe also offer 24/7 emergency services. Would you like to schedule an appointment?',
    keywords: ['office hours', 'clinic hours', 'opening hours', 'when open', 'when closed', 'business hours'],
    followUpQuestions: [
      'Book an appointment',
      'Emergency services',
      'Contact information'
    ]
  },
  {
    id: 'services',
    question: 'services|treatments|what do you do|dental care|procedures',
    answer: 'We offer comprehensive dental services including:\n\n• General Dentistry (cleanings, fillings, checkups)\n• Cosmetic Dentistry (whitening, veneers)\n• Pediatric Dentistry (children\'s care)\n• Restorative Dentistry (implants, crowns)\n• Emergency Care\n• And much more!\n\nWould you like more details about any specific service?',
    keywords: ['services', 'treatments', 'procedures', 'dental care'],
    action: {
      type: 'view_services'
    },
    followUpQuestions: [
      'General Dentistry',
      'Cosmetic Dentistry',
      'Emergency Care',
      'View all services'
    ]
  },
  {
    id: 'emergency',
    question: 'emergency|pain|hurt|urgent|broken tooth|accident',
    answer: 'For dental emergencies, please call us immediately at {emergencyPhone}. We provide 24/7 emergency services for severe pain, broken teeth, or dental accidents. Don\'t wait - we\'re here to help!',
    keywords: ['emergency', 'pain', 'hurt', 'urgent', 'broken'],
    action: {
      type: 'emergency'
    }
  },
  {
    id: 'payment_options',
    question: 'payment|cost|price|afford|finance|upi|cash|card',
    answer: 'We accept multiple payment methods for your convenience:\n\nPayment Options:\nCash payments\nCredit/Debit cards\nUPI (PhonePe, Google Pay, Paytm)\nNet banking\nCheque payments\n\nWe provide detailed cost estimates for all treatments. Would you like to know the cost of a specific treatment?',
    keywords: ['payment', 'cost', 'price', 'afford', 'finance', 'upi', 'cash', 'card'],
    followUpQuestions: [
      'Schedule consultation',
      'Call for details',
      'Treatment costs'
    ]
  },
  {
    id: 'location',
    question: 'location|address|where|directions|find|map',
    answer: 'We\'re located at:\n\n{address}\n\nQuick Actions:\n[Open in Google Maps](https://maps.google.com/?q={address})\n[Get Directions](https://maps.google.com/?daddr={address})\n\nWe\'re easily accessible by car and public transportation. Would you like to schedule an appointment?',
    keywords: ['location', 'address', 'where', 'directions'],
    followUpQuestions: [
      'Book appointment',
      'Contact information',
      'Office hours'
    ]
  },
  {
    id: 'contact',
    question: 'contact|phone|call|email|reach|speak',
    answer: 'You can reach us at:\n\nPhone: {phone}\nEmail: {email}\n\nQuick Actions:\n[Call Now](tel:{phone})\n[WhatsApp Now](https://wa.me/{phone})\n[Send Email](mailto:{email})\n\nWe\'re available during office hours and have 24/7 emergency services. How can we help you today?',
    keywords: ['contact', 'phone', 'call', 'email', 'reach'],
    action: {
      type: 'call_clinic'
    },
    followUpQuestions: [
      'Call now',
      'Book appointment',
      'Emergency services'
    ]
  },
  {
    id: 'cost_cleaning',
    question: 'cleaning cost|cleaning price|dental cleaning|preventive care cost|scaling cost|polishing cost|checkup cost|routine cleaning',
    answer: 'Our routine dental cleaning typically costs between ₹800-₹1,500. This includes scaling, polishing, and oral hygiene instructions.\n\nWhat to expect:\nPain: Minimal discomfort, mostly just pressure\nDuration: 30-60 minutes\nRecovery: No downtime, can eat normally immediately\nFrequency: Recommended every 6 months\n\nWe offer package deals for regular patients. Would you like to schedule a cleaning?',
    keywords: ['cleaning', 'scaling', 'polishing', 'checkup', 'routine', 'cost', 'price', 'preventive'],
    followUpQuestions: [
      'Schedule cleaning',
      'Preventive care packages',
      'Other services'
    ]
  },
  {
    id: 'cost_filling',
    question: 'filling cost|filling price|cavity|tooth repair|dental filling|tooth filling|composite filling|amalgam filling',
    answer: 'Dental fillings typically range from ₹1,500-₹4,000 depending on the size and material. We offer both composite (tooth-colored) and amalgam fillings.\n\nWhat to expect:\nPain: Local anesthesia used, minimal discomfort during procedure\nDuration: 30-60 minutes per filling\nRecovery: Can eat normally after 2-3 hours, avoid hard foods for 24 hours\nLongevity: 5-15 years depending on material and care\n\nComposite fillings are more aesthetic and cost slightly more. Would you like to schedule a consultation?',
    keywords: ['filling', 'cavity', 'repair', 'composite', 'amalgam', 'tooth', 'dental', 'cost'],
    followUpQuestions: [
      'Schedule consultation',
      'Filling materials',
      'Other treatments'
    ]
  },
  {
    id: 'cost_root_canal',
    question: 'root canal cost|root canal price|endodontic treatment|rct cost|rct price|nerve treatment|pulp treatment',
    answer: 'Root canal treatment typically costs between ₹8,000-₹15,000 depending on the tooth and complexity. This treatment can save your natural tooth and prevent extraction.\n\nWhat to expect:\nPain: Local anesthesia used, procedure is comfortable with modern techniques\nDuration: 1-2 visits, 60-90 minutes per visit\nRecovery: Mild discomfort for 2-3 days, avoid hard foods initially\nSuccess Rate: 95%+ success rate, can last 10+ years with proper care\n\nWe use modern techniques for comfortable treatment. Would you like to schedule a consultation?',
    keywords: ['root canal', 'rct', 'endodontic', 'nerve', 'pulp', 'treatment', 'cost', 'price'],
    followUpQuestions: [
      'Schedule consultation',
      'Alternative treatments',
      'Success rate'
    ]
  },
  {
    id: 'cost_implant',
    question: 'implant cost|implant price|dental implant|tooth replacement|artificial tooth|screw tooth|titanium implant',
    answer: 'Dental implants typically cost between ₹30,000-₹60,000 per tooth, including the implant, abutment, and crown. This is a long-term investment in your oral health.\n\nWhat to expect:\nPain: Local anesthesia used, mild discomfort for 3-5 days post-surgery\nDuration: 4-8 months total (3-6 months healing + crown placement)\nRecovery: Soft diet for 1-2 weeks, avoid smoking/alcohol during healing\nSuccess Rate: 95%+ success rate, can last 20+ years with proper care\n\nWould you like to schedule a consultation?',
    keywords: ['implant', 'artificial tooth', 'screw tooth', 'titanium', 'tooth replacement', 'cost', 'price'],
    followUpQuestions: [
      'Schedule consultation',
      'Treatment timeline',
      'Success rate'
    ]
  },
  {
    id: 'cost_whitening',
    question: 'whitening cost|whitening price|teeth whitening|bleaching|teeth bleaching|white teeth|brighten teeth',
    answer: 'Professional teeth whitening typically costs between ₹3,000-₹8,000 depending on the method. We offer both in-office and take-home whitening options.\n\nWhat to expect:\nPain: Minimal sensitivity during and after treatment\nDuration: 1-2 hours in-office, 2-4 weeks for take-home\nRecovery: Avoid dark foods/drinks for 48 hours, use sensitivity toothpaste\nResults: 2-8 shades whiter, lasts 1-2 years with proper care\n\nWould you like to schedule a whitening consultation?',
    keywords: ['whitening', 'bleaching', 'white teeth', 'brighten', 'cosmetic', 'cost'],
    followUpQuestions: [
      'Schedule consultation',
      'Other cosmetic treatments',
      'Treatment options'
    ]
  },
  {
    id: 'cost_crown',
    question: 'crown cost|crown price|dental crown|cap|tooth cap|porcelain crown|ceramic crown|metal crown',
    answer: 'Dental crowns typically cost between ₹8,000-₹15,000 depending on the material (porcelain, metal, or ceramic). Porcelain crowns look more natural and cost more.\n\nWhat to expect:\nPain: Local anesthesia used, minimal discomfort during procedure\nDuration: 2-3 visits over 2-3 weeks (preparation, lab work, placement)\nRecovery: Temporary crown for 1-2 weeks, avoid hard foods initially\nLongevity: 10-15 years with proper care and oral hygiene\n\nWould you like to schedule a consultation?',
    keywords: ['crown', 'cap', 'tooth cap', 'porcelain', 'ceramic', 'metal', 'cost', 'price'],
    followUpQuestions: [
      'Schedule consultation',
      'Crown materials',
      'Care instructions'
    ]
  },
  {
    id: 'cost_wisdom_tooth',
    question: 'wisdom tooth|wisdom teeth|third molar|impacted wisdom tooth|wisdom tooth pain|wisdom tooth removal|wisdom tooth extraction',
    answer: 'Wisdom tooth extraction typically costs between ₹3,000-₹8,000 per tooth, as it\'s usually a surgical procedure. The cost depends on whether the tooth is impacted or erupted.\n\nWhat to expect:\nPain: Local anesthesia used, procedure is comfortable\nDuration: 30-60 minutes per tooth (longer if impacted)\nRecovery: Swelling for 2-3 days, healing takes 1-2 weeks\nAftercare: Soft diet for 5-7 days, avoid smoking/drinking through straw\nCommon Issues: Pain, swelling, difficulty opening mouth (temporary)\n\nWould you like to schedule a consultation for wisdom tooth evaluation?',
    keywords: ['wisdom tooth', 'wisdom teeth', 'third molar', 'impacted', 'wisdom tooth pain', 'wisdom tooth removal', 'wisdom tooth extraction'],
    followUpQuestions: [
      'Schedule consultation',
      'Recovery process',
      'Pain management'
    ]
  },
  {
    id: 'cost_extraction',
    question: 'extraction cost|extraction price|tooth removal|pull tooth|remove tooth|wisdom tooth removal|surgical extraction|wisdom tooth|wisdom teeth|third molar|impacted tooth',
    answer: 'Tooth extraction typically costs between ₹1,500-₹4,000 for simple extractions and ₹3,000-₹8,000 for surgical extractions (like wisdom teeth). We ensure minimal discomfort during the procedure.\n\nWhat to expect:\nPain: Local anesthesia used, procedure is comfortable\nDuration: 15-45 minutes depending on complexity\nRecovery: Bleeding stops in 24 hours, healing takes 1-2 weeks\nAftercare: Soft diet for 3-5 days, avoid smoking/drinking through straw\n\nWould you like to schedule a consultation?',
    keywords: ['extraction', 'removal', 'pull', 'remove', 'wisdom tooth', 'wisdom teeth', 'third molar', 'impacted tooth', 'surgical', 'cost'],
    followUpQuestions: [
      'Schedule consultation',
      'Replacement options',
      'Recovery process'
    ]
  },
  {
    id: 'cost_braces',
    question: 'braces cost|braces price|orthodontics|straighten teeth|metal braces|ceramic braces|clear aligners|invisalign',
    answer: 'Orthodontic treatment typically costs between ₹30,000-₹70,000 depending on the type of braces and treatment duration. We offer metal braces, ceramic braces, and clear aligners.\n\nWhat to expect:\nPain: Mild discomfort for 3-5 days after adjustments\nDuration: 12-24 months depending on complexity\nRecovery: No downtime, can eat normally (avoid hard/sticky foods)\nMaintenance: Monthly adjustments, excellent long-term results\n\nWould you like to schedule a consultation?',
    keywords: ['braces', 'orthodontics', 'straighten', 'metal', 'ceramic', 'aligners', 'invisalign', 'cost'],
    followUpQuestions: [
      'Schedule consultation',
      'Types of braces',
      'Treatment duration'
    ]
  },
  {
    id: 'cost_consultation',
    question: 'consultation cost|consultation price|checkup|examination|dental checkup|oral examination|first visit|initial consultation',
    answer: 'Our consultation and examination typically costs ₹500-₹1,000. This includes oral examination, X-rays if needed, and treatment planning.\n\nWhat to expect:\nPain: No pain, just examination and discussion\nDuration: 30-45 minutes\nRecovery: No downtime, immediate return to normal activities\nIncludes: Oral examination, X-rays if needed (₹300-₹800), treatment planning, cost estimates\n\nWe provide detailed cost estimates for any recommended treatments. Would you like to schedule a consultation?',
    keywords: ['consultation', 'checkup', 'examination', 'dental checkup', 'oral examination', 'first visit', 'initial', 'cost'],
    followUpQuestions: [
      'Schedule consultation',
      'Treatment estimates',
      'Other services'
    ]
  },
  {
    id: 'cost_bridge',
    question: 'bridge cost|bridge price|dental bridge|tooth bridge|fixed bridge',
    answer: 'Dental bridges typically cost between ₹15,000-₹35,000 depending on the number of teeth and material. A bridge replaces missing teeth by anchoring to adjacent teeth.\n\nWhat to expect:\nPain: Local anesthesia used, minimal discomfort during procedure\nDuration: 2-3 visits over 2-3 weeks\nRecovery: Temporary bridge for 1-2 weeks, avoid hard foods initially\nLongevity: 10-15 years with proper care\n\nWould you like to schedule a consultation?',
    keywords: ['bridge', 'dental bridge', 'tooth bridge', 'fixed bridge', 'cost', 'price'],
    followUpQuestions: [
      'Schedule consultation',
      'Bridge materials',
      'Alternative treatments'
    ]
  },
  {
    id: 'cost_veneers',
    question: 'veneer cost|veneer price|dental veneers|porcelain veneers|tooth veneers',
    answer: 'Dental veneers typically cost between ₹8,000-₹20,000 per tooth depending on the material. Veneers are thin shells that cover the front surface of teeth for cosmetic improvement.\n\nWhat to expect:\nPain: Local anesthesia used, minimal discomfort\nDuration: 2-3 visits over 2-3 weeks\nRecovery: Temporary veneers for 1-2 weeks, avoid hard foods initially\nLongevity: 10-15 years with proper care\n\nWould you like to schedule a consultation?',
    keywords: ['veneer', 'veneers', 'porcelain veneer', 'dental veneer', 'tooth veneer', 'cost', 'price'],
    followUpQuestions: [
      'Schedule consultation',
      'Veneer materials',
      'Other cosmetic treatments'
    ]
  },
  {
    id: 'cost_dentures',
    question: 'denture cost|denture price|false teeth|complete denture|partial denture',
    answer: 'Dentures typically cost between ₹15,000-₹50,000 depending on the type (complete or partial) and material. Complete dentures replace all teeth, while partial dentures replace some missing teeth.\n\nWhat to expect:\nPain: Minimal discomfort during fitting and adjustments\nDuration: 4-6 weeks for complete dentures, 2-4 weeks for partial\nRecovery: Adjustment period of 2-4 weeks, practice speaking and eating\nLongevity: 5-10 years with proper care and regular adjustments\n\nWould you like to schedule a consultation?',
    keywords: ['denture', 'dentures', 'false teeth', 'complete denture', 'partial denture', 'cost', 'price'],
    followUpQuestions: [
      'Schedule consultation',
      'Denture types',
      'Care instructions'
    ]
  },
  {
    id: 'recovery_process',
    question: 'recovery process|recovery time|healing time|aftercare|post treatment care',
    answer: 'Recovery varies by treatment, but here are general guidelines:\n\nCleaning: No downtime, immediate return to normal activities\nFillings: 2-3 hours before eating, avoid hard foods for 24 hours\nRoot Canal: Mild discomfort for 2-3 days, avoid hard foods initially\nImplants: Soft diet for 1-2 weeks, avoid smoking/alcohol during healing\nExtractions: Soft diet for 3-5 days, bleeding stops in 24 hours\nBraces: No downtime, avoid hard/sticky foods\nCrowns: Temporary crown for 1-2 weeks, avoid hard foods initially\n\nWould you like specific recovery instructions for your treatment?',
    keywords: ['recovery', 'healing', 'aftercare', 'post treatment', 'care instructions'],
    followUpQuestions: [
      'Schedule consultation',
      'Pain management',
      'Specific treatment recovery'
    ]
  },
  {
    id: 'pain_management',
    question: 'pain management|pain relief|discomfort|pain after treatment|pain medication',
    answer: 'Pain management strategies for dental treatments:\n\nDuring Treatment: Local anesthesia ensures comfortable procedures\nAfter Treatment: Over-the-counter pain relievers (ibuprofen, paracetamol)\nCold Compress: Apply ice pack for 15-20 minutes to reduce swelling\nSoft Diet: Avoid hard, hot, or spicy foods initially\nRest: Avoid strenuous activities for 24-48 hours\n\nMost discomfort is mild and resolves within 2-3 days. Contact us if pain persists or worsens.\n\nWould you like to schedule a consultation?',
    keywords: ['pain', 'discomfort', 'pain relief', 'pain management', 'pain medication', 'swelling'],
    followUpQuestions: [
      'Schedule consultation',
      'Recovery process',
      'Emergency contact'
    ]
  },
  {
    id: 'schedule_cleaning',
    question: 'schedule cleaning|book cleaning|appointment for cleaning|dental cleaning appointment',
    answer: 'Great! We\'d be happy to schedule your dental cleaning. Our routine cleaning includes scaling, polishing, and oral hygiene instructions.\n\nTo book your cleaning appointment:\nCall us at {phone}\nVisit our clinic during office hours\nBook online through our website\n\nWe recommend cleaning every 6 months for optimal oral health. Would you like to schedule now?',
    keywords: ['schedule cleaning', 'book cleaning', 'cleaning appointment', 'dental cleaning'],
    followUpQuestions: [
      'Call now',
      'Office hours',
      'Preventive care packages'
    ]
  },
  {
    id: 'preventive_care_packages',
    question: 'preventive care packages|preventive care|dental packages|cleaning packages',
    answer: 'We offer comprehensive preventive care packages to maintain your oral health:\n\nBasic Package: 2 cleanings per year + consultation (₹2,500/year)\nFamily Package: 2 cleanings per person + consultation (₹2,000/person/year)\nPremium Package: 4 cleanings + X-rays + consultation (₹4,500/year)\n\nThese packages help prevent dental problems and save money in the long run. Would you like to know more about our packages?',
    keywords: ['preventive care', 'dental packages', 'cleaning packages', 'preventive packages'],
    followUpQuestions: [
      'Schedule consultation',
      'Package details',
      'Family packages'
    ]
  },
  {
    id: 'filling_materials',
    question: 'filling materials|composite filling|amalgam filling|tooth colored filling|silver filling',
    answer: 'We offer different filling materials to suit your needs:\n\nComposite Fillings: Tooth-colored, more aesthetic, ₹2,000-₹4,000\nAmalgam Fillings: Silver-colored, durable, ₹1,500-₹2,500\nGlass Ionomer: Good for children, ₹1,800-₹3,000\n\nComposite fillings are more popular as they match your natural tooth color. The choice depends on the location of the cavity and your preference. Would you like to schedule a consultation?',
    keywords: ['filling materials', 'composite', 'amalgam', 'tooth colored', 'silver filling'],
    followUpQuestions: [
      'Schedule consultation',
      'Filling cost',
      'Other treatments'
    ]
  },
  {
    id: 'alternative_treatments',
    question: 'alternative treatments|other options|treatment alternatives|different treatments',
    answer: 'We offer various treatment alternatives depending on your condition:\n\nInstead of Extraction: Root canal, crown, or bridge\nInstead of Implant: Bridge or partial denture\nInstead of Braces: Clear aligners or veneers\nInstead of Crown: Large filling or inlay/onlay\n\nEach option has different costs, durability, and aesthetic results. We\'ll recommend the best option for your specific case during consultation. Would you like to schedule a consultation?',
    keywords: ['alternative treatments', 'other options', 'treatment alternatives', 'different treatments'],
    followUpQuestions: [
      'Schedule consultation',
      'Treatment comparison',
      'Cost estimates'
    ]
  },
  {
    id: 'treatment_timeline',
    question: 'treatment timeline|treatment duration|how long treatment|treatment time|procedure duration|treatment period',
    answer: 'Treatment timelines vary by procedure:\n\nCleaning: 30-60 minutes\nFillings: 30-60 minutes per tooth\nRoot Canal: 1-2 visits, 60-90 minutes each\nCrown: 2-3 visits over 2-3 weeks\nImplant: 4-8 months total\nBraces: 12-24 months\nExtraction: 15-45 minutes\n\nWe\'ll provide a detailed timeline during your consultation based on your specific needs. Would you like to schedule a consultation?',
    keywords: ['treatment timeline', 'treatment duration', 'how long treatment', 'treatment time', 'procedure duration', 'treatment period'],
    followUpQuestions: [
      'Schedule consultation',
      'Treatment process',
      'Recovery time'
    ]
  },
  {
    id: 'success_rate',
    question: 'success rate|success percentage|treatment success|how successful',
    answer: 'Our treatment success rates are excellent:\n\nRoot Canal: 95%+ success rate\nImplants: 95%+ success rate (can last 20+ years)\nCrowns: 90%+ success rate (can last 10-15 years)\nFillings: 85%+ success rate (can last 5-15 years)\nBraces: 95%+ success rate with proper retention\n\nSuccess depends on proper care, oral hygiene, and following post-treatment instructions. We use modern techniques and high-quality materials for best results. Would you like to schedule a consultation?',
    keywords: ['success rate', 'success percentage', 'treatment success', 'how successful'],
    followUpQuestions: [
      'Schedule consultation',
      'Care instructions',
      'Treatment timeline'
    ]
  },
  {
    id: 'other_cosmetic_treatments',
    question: 'other cosmetic treatments|cosmetic options|beauty treatments|smile makeover',
    answer: 'We offer various cosmetic treatments to enhance your smile:\n\nTeeth Whitening: ₹3,000-₹8,000\nVeneers: ₹8,000-₹20,000 per tooth\nCrowns: ₹8,000-₹15,000 per tooth\nBraces/Aligners: ₹30,000-₹70,000\nGum Contouring: ₹5,000-₹10,000\nBonding: ₹2,000-₹5,000 per tooth\n\nWe can create a personalized smile makeover plan for you. Would you like to schedule a cosmetic consultation?',
    keywords: ['cosmetic treatments', 'cosmetic options', 'beauty treatments', 'smile makeover'],
    followUpQuestions: [
      'Schedule consultation',
      'Smile makeover',
      'Treatment costs'
    ]
  },
  {
    id: 'treatment_options',
    question: 'treatment options|available treatments|what treatments|dental options',
    answer: 'We offer comprehensive dental treatments:\n\nPreventive: Cleaning, checkups, sealants\nRestorative: Fillings, crowns, bridges, implants\nCosmetic: Whitening, veneers, bonding\nOrthodontic: Braces, clear aligners\nOral Surgery: Extractions, wisdom teeth\nEndodontic: Root canal treatment\n\nWe provide personalized treatment plans based on your needs and budget. Would you like to schedule a consultation?',
    keywords: ['treatment options', 'available treatments', 'what treatments', 'dental options'],
    followUpQuestions: [
      'Schedule consultation',
      'Treatment costs',
      'Preventive care'
    ]
  },
  {
    id: 'crown_materials',
    question: 'crown materials|porcelain crown|metal crown|ceramic crown|crown types',
    answer: 'We offer different crown materials:\n\nPorcelain: Most natural looking, ₹10,000-₹15,000\nCeramic: Good aesthetics, durable, ₹8,000-₹12,000\nMetal: Very durable, less aesthetic, ₹6,000-₹10,000\nPorcelain-fused-to-metal: Good balance, ₹8,000-₹13,000\n\nPorcelain crowns look most natural and are popular for front teeth. Metal crowns are stronger and better for back teeth. We\'ll recommend the best option for your case. Would you like to schedule a consultation?',
    keywords: ['crown materials', 'porcelain crown', 'metal crown', 'ceramic crown', 'crown types'],
    followUpQuestions: [
      'Schedule consultation',
      'Crown cost',
      'Crown process'
    ]
  },
  {
    id: 'care_instructions',
    question: 'care instructions|how to care|maintenance|oral hygiene|aftercare',
    answer: 'Proper care ensures long-lasting results:\n\nDaily Care: Brush twice daily, floss once daily\nDiet: Avoid hard, sticky, or sugary foods initially\nRegular Checkups: Visit every 6 months\nAvoid: Smoking, excessive alcohol, grinding teeth\nPain Management: Use prescribed medications as directed\n\nSpecific care instructions vary by treatment. We\'ll provide detailed instructions after your procedure. Would you like to schedule a consultation?',
    keywords: ['care instructions', 'how to care', 'maintenance', 'oral hygiene', 'aftercare'],
    followUpQuestions: [
      'Schedule consultation',
      'Pain management',
      'Recovery process'
    ]
  },
  {
    id: 'replacement_options',
    question: 'replacement options|tooth replacement|missing tooth|gap in teeth',
    answer: 'We offer several tooth replacement options:\n\nDental Implant: ₹30,000-₹60,000 (most natural)\nBridge: ₹15,000-₹35,000 (anchored to adjacent teeth)\nPartial Denture: ₹15,000-₹30,000 (removable)\nComplete Denture: ₹20,000-₹50,000 (for all teeth)\n\nImplants are the gold standard as they function like natural teeth. The best option depends on your budget, oral health, and preferences. Would you like to schedule a consultation?',
    keywords: ['replacement options', 'tooth replacement', 'missing tooth', 'gap in teeth'],
    followUpQuestions: [
      'Schedule consultation',
      'Implant cost',
      'Bridge cost'
    ]
  },
  {
    id: 'types_of_braces',
    question: 'types of braces|braces options|orthodontic options|clear braces|metal braces',
    answer: 'We offer different types of braces:\n\nMetal Braces: Traditional, most affordable, ₹30,000-₹40,000\nCeramic Braces: Less visible, ₹40,000-₹50,000\nClear Aligners: Nearly invisible, ₹50,000-₹70,000\nLingual Braces: Behind teeth, ₹60,000-₹80,000\n\nClear aligners are popular for adults as they\'re nearly invisible and removable. Metal braces are most effective for complex cases. We\'ll recommend the best option for your needs. Would you like to schedule a consultation?',
    keywords: ['types of braces', 'braces options', 'orthodontic options', 'clear braces', 'metal braces'],
    followUpQuestions: [
      'Schedule consultation',
      'Braces cost',
      'Treatment duration'
    ]
  },
  {
    id: 'treatment_duration',
    question: 'treatment duration|how long treatment|time for treatment|treatment period',
    answer: 'Treatment duration varies by procedure:\n\nCleaning: 30-60 minutes (one visit)\nFillings: 30-60 minutes per tooth (one visit)\nRoot Canal: 1-2 visits over 1-2 weeks\nCrown: 2-3 visits over 2-3 weeks\nImplant: 4-8 months (multiple visits)\nBraces: 12-24 months (monthly visits)\nExtraction: 15-45 minutes (one visit)\n\nWe\'ll provide a detailed timeline during your consultation. Would you like to schedule a consultation?',
    keywords: ['treatment duration', 'how long treatment', 'time for treatment', 'treatment period'],
    followUpQuestions: [
      'Schedule consultation',
      'Treatment process',
      'Recovery time'
    ]
  },
  {
    id: 'treatment_estimates',
    question: 'treatment estimates|cost estimates|price estimates|treatment costs',
    answer: 'We provide detailed cost estimates for all treatments:\n\nConsultation: ₹500-₹1,000\nCleaning: ₹800-₹1,500\nFillings: ₹1,500-₹4,000\nRoot Canal: ₹8,000-₹15,000\nCrown: ₹8,000-₹15,000\nImplant: ₹30,000-₹60,000\n\nExact costs depend on your specific case. We\'ll provide a detailed estimate after examination. Would you like to schedule a consultation for a personalized estimate?',
    keywords: ['treatment estimates', 'cost estimates', 'price estimates', 'treatment costs'],
    followUpQuestions: [
      'Schedule consultation',
      'Payment options',
      'Treatment timeline'
    ]
  },
  {
    id: 'bridge_materials',
    question: 'bridge materials|bridge types|dental bridge options|bridge materials',
    answer: 'We offer different bridge materials:\n\nPorcelain Bridge: Most natural looking, ₹20,000-₹35,000\nCeramic Bridge: Good aesthetics, ₹18,000-₹30,000\nMetal Bridge: Very durable, ₹15,000-₹25,000\nPorcelain-fused-to-metal: Good balance, ₹18,000-₹28,000\n\nPorcelain bridges look most natural and are popular for visible areas. Metal bridges are stronger for back teeth. We\'ll recommend the best option for your case. Would you like to schedule a consultation?',
    keywords: ['bridge materials', 'bridge types', 'dental bridge options', 'bridge materials'],
    followUpQuestions: [
      'Schedule consultation',
      'Bridge cost',
      'Alternative treatments'
    ]
  },
  {
    id: 'veneer_materials',
    question: 'veneer materials|veneer types|porcelain veneers|composite veneers',
    answer: 'We offer different veneer materials:\n\nPorcelain Veneers: Most natural, durable, ₹15,000-₹20,000 per tooth\nComposite Veneers: Less expensive, ₹8,000-₹12,000 per tooth\nLumineers: Ultra-thin, minimal preparation, ₹18,000-₹25,000 per tooth\n\nPorcelain veneers are most popular as they look natural and last longer. Composite veneers are more affordable but less durable. We\'ll recommend the best option for your smile goals. Would you like to schedule a consultation?',
    keywords: ['veneer materials', 'veneer types', 'porcelain veneers', 'composite veneers'],
    followUpQuestions: [
      'Schedule consultation',
      'Veneer cost',
      'Smile makeover'
    ]
  },
  {
    id: 'denture_types',
    question: 'denture types|complete denture|partial denture|denture options',
    answer: 'We offer different types of dentures:\n\nComplete Dentures: Replace all teeth, ₹20,000-₹50,000\nPartial Dentures: Replace some teeth, ₹15,000-₹35,000\nImmediate Dentures: Placed same day as extraction, ₹25,000-₹55,000\nOverdentures: Supported by implants, ₹40,000-₹80,000\n\nComplete dentures are for patients missing all teeth. Partial dentures are for patients missing some teeth. We\'ll recommend the best option for your needs. Would you like to schedule a consultation?',
    keywords: ['denture types', 'complete denture', 'partial denture', 'denture options'],
    followUpQuestions: [
      'Schedule consultation',
      'Denture cost',
      'Care instructions'
    ]
  },
  {
    id: 'specific_treatment_recovery',
    question: 'specific treatment recovery|recovery for treatment|post treatment care|after treatment',
    answer: 'Recovery instructions vary by treatment:\n\nCleaning: No special care needed\nFillings: Avoid hard foods for 24 hours\nRoot Canal: Avoid hard foods for 2-3 days\nCrown: Careful with temporary crown for 1-2 weeks\nImplant: Soft diet for 1-2 weeks, no smoking\nExtraction: Soft diet for 3-5 days, no smoking\nBraces: Avoid hard/sticky foods, regular cleaning\n\nWe\'ll provide specific recovery instructions after your treatment. Would you like to schedule a consultation?',
    keywords: ['specific treatment recovery', 'recovery for treatment', 'post treatment care', 'after treatment'],
    followUpQuestions: [
      'Schedule consultation',
      'Pain management',
      'Care instructions'
    ]
  },
  {
    id: 'specific_treatment_cost',
    question: 'specific treatment cost|cost for treatment|price for treatment|treatment pricing',
    answer: 'Treatment costs vary based on your specific needs:\n\nSimple cases: Lower end of price range\nComplex cases: Higher end of price range\nMultiple teeth: May qualify for package discounts\nInsurance: We can help with insurance claims\n\nWe\'ll provide an exact cost estimate after examination and treatment planning. Would you like to schedule a consultation for a personalized estimate?',
    keywords: ['specific treatment cost', 'cost for treatment', 'price for treatment', 'treatment pricing'],
    followUpQuestions: [
      'Schedule consultation',
      'Payment options',
      'Treatment estimates'
    ]
  },
  {
    id: 'cost_xray',
    question: 'xray cost|xray price|dental xray|x-ray cost|x-ray price|dental x-ray|dental imaging|radiograph',
    answer: 'Dental X-rays typically cost between ₹300-₹800 per image depending on the type. We offer various X-ray services for comprehensive diagnosis.\n\nWhat to expect:\nPain: No pain, just positioning for clear images\nDuration: 5-15 minutes per X-ray\nRecovery: No downtime, immediate return to normal activities\nTypes: Bitewing, periapical, panoramic, CBCT scans\n\nX-rays help us diagnose issues not visible during examination. Would you like to schedule a consultation?',
    keywords: ['xray', 'x-ray', 'dental xray', 'dental x-ray', 'dental imaging', 'radiograph', 'cost', 'price'],
    followUpQuestions: [
      'Schedule consultation',
      'X-ray types',
      'Treatment estimates'
    ]
  },
  {
    id: 'xray_types',
    question: 'xray types|x-ray types|dental imaging types|radiograph types|bitewing|panoramic|cbct',
    answer: 'We offer different types of dental X-rays for comprehensive diagnosis:\n\nBitewing X-rays: ₹300-₹500 (check for cavities between teeth)\nPeriapical X-rays: ₹300-₹500 (examine individual tooth roots)\nPanoramic X-rays: ₹500-₹800 (full mouth overview)\nCBCT Scans: ₹1,500-₹3,000 (3D imaging for implants/surgery)\n\nEach type serves different diagnostic purposes. We\'ll recommend the most appropriate X-ray for your needs. Would you like to schedule a consultation?',
    keywords: ['xray types', 'x-ray types', 'dental imaging types', 'radiograph types', 'bitewing', 'panoramic', 'cbct'],
    followUpQuestions: [
      'Schedule consultation',
      'X-ray cost',
      'Treatment planning'
    ]
  },
  {
    id: 'cost_teeth_whitening',
    question: 'teeth whitening cost|teeth whitening price|whiten teeth|bleach teeth|white teeth cost|teeth bleaching price',
    answer: 'Teeth whitening typically costs between ₹3,000-₹8,000 depending on the method:\n\nIn-office Whitening: ₹5,000-₹8,000 (1-2 hours, immediate results)\nTake-home Whitening: ₹3,000-₹5,000 (2-4 weeks, gradual results)\nLaser Whitening: ₹6,000-₹10,000 (fastest, most effective)\n\nWhat to expect:\nPain: Minimal sensitivity during and after treatment\nDuration: 1-2 hours in-office, 2-4 weeks for take-home\nRecovery: Avoid dark foods/drinks for 48 hours\nResults: 2-8 shades whiter, lasts 1-2 years\n\nWould you like to schedule a whitening consultation?',
    keywords: ['teeth whitening', 'whiten teeth', 'bleach teeth', 'white teeth', 'teeth bleaching', 'cost', 'price'],
    followUpQuestions: [
      'Schedule consultation',
      'Whitening methods',
      'Other cosmetic treatments'
    ]
  },
  {
    id: 'cost_gum_treatment',
    question: 'gum treatment cost|gum disease cost|gingivitis cost|periodontal treatment cost|gum surgery cost',
    answer: 'Gum treatment costs vary based on severity:\n\nGingivitis Treatment: ₹2,000-₹4,000 (scaling and cleaning)\nPeriodontal Treatment: ₹5,000-₹15,000 (deep cleaning)\nGum Surgery: ₹10,000-₹25,000 (advanced cases)\nGum Grafting: ₹15,000-₹30,000 (receding gums)\n\nWhat to expect:\nPain: Local anesthesia used, mild discomfort for 2-3 days\nDuration: 1-4 visits depending on severity\nRecovery: Soft diet for 3-5 days, avoid smoking\nSuccess: Early treatment prevents tooth loss\n\nWould you like to schedule a gum evaluation?',
    keywords: ['gum treatment', 'gum disease', 'gingivitis', 'periodontal', 'gum surgery', 'cost', 'price'],
    followUpQuestions: [
      'Schedule consultation',
      'Gum disease symptoms',
      'Prevention tips'
    ]
  },
  {
    id: 'cost_child_dentistry',
    question: 'child dentist cost|kids dentist cost|pediatric dentist cost|children dental cost|baby teeth cost',
    answer: 'Children\'s dental care typically costs:\n\nChild Consultation: ₹300-₹600\nChild Cleaning: ₹500-₹1,000\nChild Fillings: ₹1,000-₹2,500\nTooth Extraction (baby teeth): ₹800-₹1,500\nSpace Maintainers: ₹3,000-₹6,000\nSealants: ₹800-₹1,500 per tooth\n\nWhat to expect:\nPain: Child-friendly techniques, minimal discomfort\nDuration: Shorter appointments (15-30 minutes)\nRecovery: Quick healing, normal activities immediately\nSpecial Care: Child-friendly environment and techniques\n\nWe make dental visits fun and comfortable for children. Would you like to schedule a consultation?',
    keywords: ['child dentist', 'kids dentist', 'pediatric dentist', 'children dental', 'baby teeth', 'cost', 'price'],
    followUpQuestions: [
      'Schedule consultation',
      'Child dental care',
      'Prevention tips'
    ]
  },
  {
    id: 'cost_emergency_dentistry',
    question: 'emergency dentist cost|dental emergency cost|tooth pain cost|broken tooth cost|urgent dental cost',
    answer: 'Emergency dental care costs vary by treatment:\n\nEmergency Consultation: ₹800-₹1,500\nPain Relief: ₹500-₹1,000\nBroken Tooth Repair: ₹2,000-₹8,000\nTooth Extraction (emergency): ₹1,500-₹4,000\nTemporary Filling: ₹800-₹1,500\n\nWhat to expect:\nPain: Immediate pain relief provided\nDuration: 30-60 minutes for most emergencies\nRecovery: Follow-up care instructions provided\nAvailability: 24/7 emergency services\n\nWe provide immediate relief for dental emergencies. Would you like to call our emergency line?',
    keywords: ['emergency dentist', 'dental emergency', 'tooth pain', 'broken tooth', 'urgent dental', 'cost', 'price'],
    followUpQuestions: [
      'Call emergency line',
      'Emergency services',
      'Pain management'
    ]
  },
  {
    id: 'cost_oral_surgery',
    question: 'oral surgery cost|wisdom tooth surgery cost|tooth extraction surgery cost|dental surgery cost',
    answer: 'Oral surgery costs depend on complexity:\n\nSimple Extraction: ₹1,500-₹3,000\nSurgical Extraction: ₹3,000-₹8,000\nWisdom Tooth Surgery: ₹5,000-₹15,000\nImpacted Tooth Surgery: ₹8,000-₹20,000\nBone Grafting: ₹10,000-₹25,000\n\nWhat to expect:\nPain: Local/general anesthesia, comfortable procedure\nDuration: 30-90 minutes depending on complexity\nRecovery: 3-7 days, soft diet, avoid smoking\nFollow-up: Post-operative care instructions provided\n\nWould you like to schedule a surgical consultation?',
    keywords: ['oral surgery', 'wisdom tooth surgery', 'tooth extraction surgery', 'dental surgery', 'cost', 'price'],
    followUpQuestions: [
      'Schedule consultation',
      'Surgery preparation',
      'Recovery process'
    ]
  },
  {
    id: 'cost_orthodontics',
    question: 'orthodontics cost|braces cost|invisalign cost|clear aligners cost|teeth straightening cost',
    answer: 'Orthodontic treatment costs vary by type:\n\nMetal Braces: ₹30,000-₹40,000\nCeramic Braces: ₹40,000-₹50,000\nClear Aligners: ₹50,000-₹70,000\nLingual Braces: ₹60,000-₹80,000\nRetainers: ₹5,000-₹10,000\n\nWhat to expect:\nPain: Mild discomfort for 3-5 days after adjustments\nDuration: 12-24 months depending on complexity\nRecovery: No downtime, avoid hard/sticky foods\nMaintenance: Monthly adjustments, excellent results\n\nWe offer flexible payment plans for orthodontic treatment. Would you like to schedule a consultation?',
    keywords: ['orthodontics', 'braces', 'invisalign', 'clear aligners', 'teeth straightening', 'cost', 'price'],
    followUpQuestions: [
      'Schedule consultation',
      'Types of braces',
      'Payment plans'
    ]
  },
  {
    id: 'cost_dental_hygiene',
    question: 'dental hygiene cost|oral hygiene cost|teeth cleaning cost|scaling cost|polishing cost',
    answer: 'Dental hygiene services typically cost:\n\nRegular Cleaning: ₹800-₹1,500\nDeep Cleaning (Scaling): ₹1,500-₹3,000\nPolishing: ₹500-₹1,000\nFluoride Treatment: ₹300-₹800\nSealants: ₹800-₹1,500 per tooth\n\nWhat to expect:\nPain: Minimal discomfort, mostly just pressure\nDuration: 30-60 minutes\nRecovery: No downtime, can eat normally immediately\nFrequency: Recommended every 6 months\n\nGood oral hygiene prevents costly treatments later. Would you like to schedule a cleaning?',
    keywords: ['dental hygiene', 'oral hygiene', 'teeth cleaning', 'scaling', 'polishing', 'cost', 'price'],
    followUpQuestions: [
      'Schedule cleaning',
      'Hygiene tips',
      'Preventive care'
    ]
  },
  {
    id: 'cost_restorative_dentistry',
    question: 'restorative dentistry cost|tooth restoration cost|dental restoration cost|tooth repair cost',
    answer: 'Restorative dentistry costs vary by treatment:\n\nFillings: ₹1,500-₹4,000\nCrowns: ₹8,000-₹15,000\nBridges: ₹15,000-₹35,000\nImplants: ₹30,000-₹60,000\nDentures: ₹15,000-₹50,000\nInlays/Onlays: ₹5,000-₹12,000\n\nWhat to expect:\nPain: Local anesthesia ensures comfortable procedures\nDuration: 1-3 visits depending on treatment\nRecovery: Varies by treatment, detailed instructions provided\nLongevity: 5-20 years depending on care and material\n\nWe restore function and aesthetics to damaged teeth. Would you like to schedule a consultation?',
    keywords: ['restorative dentistry', 'tooth restoration', 'dental restoration', 'tooth repair', 'cost', 'price'],
    followUpQuestions: [
      'Schedule consultation',
      'Restoration options',
      'Treatment timeline'
    ]
  },
  {
    id: 'cost_preventive_care',
    question: 'preventive care cost|preventive dentistry cost|dental checkup cost|routine care cost',
    answer: 'Preventive dental care is cost-effective:\n\nRegular Checkup: ₹500-₹1,000\nCleaning: ₹800-₹1,500\nX-rays: ₹300-₹800\nFluoride Treatment: ₹300-₹800\nSealants: ₹800-₹1,500 per tooth\n\nWhat to expect:\nPain: No pain, just examination and cleaning\nDuration: 30-60 minutes\nRecovery: No downtime, immediate return to activities\nFrequency: Every 6 months recommended\n\nPreventive care saves money by avoiding costly treatments. Would you like to schedule a checkup?',
    keywords: ['preventive care', 'preventive dentistry', 'dental checkup', 'routine care', 'cost', 'price'],
    followUpQuestions: [
      'Schedule checkup',
      'Preventive packages',
      'Hygiene tips'
    ]
  },
  {
    id: 'gum_disease_symptoms',
    question: 'gum disease symptoms|gingivitis symptoms|bleeding gums|swollen gums|gum problems',
    answer: 'Common gum disease symptoms include:\n\nEarly Signs (Gingivitis):\nBleeding gums when brushing or flossing\nRed, swollen, or tender gums\nBad breath that won\'t go away\nGums that pull away from teeth\n\nAdvanced Signs (Periodontitis):\nLoose or shifting teeth\nPus between teeth and gums\nChanges in bite or tooth alignment\nReceding gums\n\nEarly treatment prevents tooth loss. If you notice these symptoms, schedule an appointment immediately. Would you like to schedule a gum evaluation?',
    keywords: ['gum disease symptoms', 'gingivitis symptoms', 'bleeding gums', 'swollen gums', 'gum problems'],
    followUpQuestions: [
      'Schedule consultation',
      'Gum treatment cost',
      'Prevention tips'
    ]
  },
  {
    id: 'prevention_tips',
    question: 'prevention tips|dental care tips|oral hygiene tips|how to prevent|dental health tips',
    answer: 'Here are essential dental prevention tips:\n\nDaily Care:\nBrush twice daily with fluoride toothpaste\nFloss once daily\nUse mouthwash with fluoride\n\nDiet:\nLimit sugary and acidic foods\nDrink plenty of water\nEat calcium-rich foods\n\nLifestyle:\nAvoid smoking and excessive alcohol\nDon\'t use teeth as tools\nWear mouthguards during sports\n\nRegular Care:\nVisit dentist every 6 months\nGet professional cleanings\nAddress problems early\n\nGood oral hygiene prevents costly treatments. Would you like to schedule a checkup?',
    keywords: ['prevention tips', 'dental care tips', 'oral hygiene tips', 'how to prevent', 'dental health tips'],
    followUpQuestions: [
      'Schedule checkup',
      'Preventive care cost',
      'Hygiene products'
    ]
  },
  {
    id: 'child_dental_care',
    question: 'child dental care|kids dental care|children oral hygiene|baby teeth care|pediatric dental care',
    answer: 'Children\'s dental care is essential for healthy development:\n\nAge 0-2: Clean gums with soft cloth, first tooth visit by age 1\nAge 2-6: Brush with fluoride toothpaste, supervise brushing\nAge 6+: Regular checkups, sealants, orthodontic evaluation\n\nSpecial Care:\nChild-friendly environment\nGentle techniques\nFun activities during visits\nParent education\n\nPrevention:\nLimit sugary snacks and drinks\nEncourage water consumption\nRegular dental visits\n\nWe make dental visits enjoyable for children. Would you like to schedule a pediatric consultation?',
    keywords: ['child dental care', 'kids dental care', 'children oral hygiene', 'baby teeth care', 'pediatric dental care'],
    followUpQuestions: [
      'Schedule consultation',
      'Child dentist cost',
      'Prevention tips'
    ]
  },
  {
    id: 'emergency_services',
    question: 'emergency services|dental emergency|urgent care|emergency dentist|24 hour dentist',
    answer: 'We provide 24/7 emergency dental services for urgent situations:\n\nEmergency Situations:\nSevere tooth pain\nBroken or knocked-out tooth\nSwelling or infection\nBleeding that won\'t stop\nLost filling or crown\n\nWhat to do:\nCall our emergency line immediately\nApply ice for swelling\nRinse with warm salt water\nSave any broken tooth pieces\n\nEmergency Contact: {phone}\nWe provide immediate relief and pain management. For life-threatening emergencies, visit the nearest hospital.\n\nWould you like our emergency contact number?',
    keywords: ['emergency services', 'dental emergency', 'urgent care', 'emergency dentist', '24 hour dentist'],
    followUpQuestions: [
      'Call emergency line',
      'Emergency cost',
      'Pain management'
    ]
  },
  {
    id: 'surgery_preparation',
    question: 'surgery preparation|oral surgery preparation|wisdom tooth preparation|surgical preparation',
    answer: 'Proper preparation ensures successful oral surgery:\n\nBefore Surgery:\nFollow pre-operative instructions\nArrange transportation home\nAvoid eating 8 hours before (if general anesthesia)\nTake prescribed medications as directed\n\nDay of Surgery:\nArrive 30 minutes early\nBring insurance information\nWear comfortable clothing\nRemove jewelry and contact lenses\n\nAfter Surgery:\nFollow post-operative care instructions\nTake prescribed medications\nApply ice packs for swelling\nEat soft foods initially\n\nWe\'ll provide detailed instructions for your specific procedure. Would you like to schedule a surgical consultation?',
    keywords: ['surgery preparation', 'oral surgery preparation', 'wisdom tooth preparation', 'surgical preparation'],
    followUpQuestions: [
      'Schedule consultation',
      'Oral surgery cost',
      'Recovery process'
    ]
  },
  {
    id: 'hygiene_tips',
    question: 'hygiene tips|oral hygiene|dental hygiene|brushing tips|flossing tips',
    answer: 'Proper oral hygiene prevents dental problems:\n\nBrushing Technique:\nBrush for 2 minutes, twice daily\nUse fluoride toothpaste\nBrush at 45-degree angle\nReplace toothbrush every 3 months\n\nFlossing:\nFloss once daily\nUse 18 inches of floss\nGently curve around each tooth\nDon\'t snap floss into gums\n\nAdditional Care:\nUse mouthwash with fluoride\nClean tongue with brush or scraper\nDrink water after meals\nLimit sugary snacks\n\nRegular professional cleanings remove plaque you can\'t reach. Would you like to schedule a cleaning?',
    keywords: ['hygiene tips', 'oral hygiene', 'dental hygiene', 'brushing tips', 'flossing tips'],
    followUpQuestions: [
      'Schedule cleaning',
      'Dental hygiene cost',
      'Prevention tips'
    ]
  },
  {
    id: 'book_online_now',
    question: 'book online now|book appointment online|online booking|schedule online|book online',
    answer: 'You can book your appointment online through our website or call us directly.\n\nOnline Booking:\nVisit our website and use the online booking system\nSelect your preferred date and time\nChoose your treatment type\n\nPhone Booking:\nCall us at {phone}\nWe\'ll help you find the best available time\n\nQuick Actions:\n[Book Online](/appointment)\n[Call Now](tel:{phone})\n[WhatsApp](https://wa.me/{phone})\n\nWe\'re here to help you schedule your appointment. Would you like to book now?',
    keywords: ['book online now', 'book appointment online', 'online booking', 'schedule online', 'book online'],
    followUpQuestions: [
      'Call now',
      'WhatsApp us',
      'Office hours'
    ]
  },
  {
    id: 'call_now',
    question: 'call now|call us|phone call|call clinic|contact by phone',
    answer: 'You can reach us by phone for immediate assistance:\n\nPhone: {phone}\n\nWe\'re available:\nMonday - Friday: 8:00 AM - 6:00 PM\nSaturday: 9:00 AM - 2:00 PM\nSunday: Closed\nEmergency: 24/7\n\nQuick Actions:\n[Call Now](tel:{phone})\n[WhatsApp](https://wa.me/{phone})\n[Book Online](/appointment)\n\nOur team is ready to help you with appointments, questions, or emergencies. Would you like to call now?',
    keywords: ['call now', 'call us', 'phone call', 'call clinic', 'contact by phone'],
    followUpQuestions: [
      'Book online now',
      'WhatsApp us',
      'Office hours'
    ]
  },
  {
    id: 'whatsapp_us',
    question: 'whatsapp|whatsapp us|message us|chat on whatsapp|contact whatsapp',
    answer: 'You can reach us on WhatsApp for quick assistance:\n\nWhatsApp: {phone}\n\nWe respond to WhatsApp messages during office hours:\nMonday - Friday: 8:00 AM - 6:00 PM\nSaturday: 9:00 AM - 2:00 PM\n\nQuick Actions:\n[WhatsApp Now](https://wa.me/{phone})\n[Call Now](tel:{phone})\n[Book Online](/appointment)\n\nWhatsApp is great for:\nAppointment scheduling\nQuick questions\nSending photos of dental issues\n\nWould you like to message us on WhatsApp?',
    keywords: ['whatsapp', 'whatsapp us', 'message us', 'chat on whatsapp', 'contact whatsapp'],
    followUpQuestions: [
      'Call now',
      'Book online now',
      'Office hours'
    ]
  },
  {
    id: 'call_to_schedule',
    question: 'call to schedule|call for appointment|phone appointment|schedule by phone',
    answer: 'You can call us to schedule your appointment:\n\nPhone: {phone}\n\nOur staff will help you:\nFind the best available time\nChoose the right treatment\nAnswer any questions\nProvide cost estimates\n\nWe\'re available:\nMonday - Friday: 8:00 AM - 6:00 PM\nSaturday: 9:00 AM - 2:00 PM\nEmergency: 24/7\n\nQuick Actions:\n[Call Now](tel:{phone})\n[WhatsApp](https://wa.me/{phone})\n[Book Online](/appointment)\n\nWould you like to call us now?',
    keywords: ['call to schedule', 'call for appointment', 'phone appointment', 'schedule by phone'],
    followUpQuestions: [
      'Call now',
      'Book online now',
      'Office hours'
    ]
  },
  {
    id: 'general_pricing',
    question: 'prices|costs|how much|pricing|fees|treatment cost|dental cost|all prices|price list',
    answer: 'Our treatment costs vary depending on the specific procedure. Here are some general ranges:\n\nConsultation: ₹500-₹1,000\nCleaning: ₹800-₹1,500\nX-rays: ₹300-₹800\nFillings: ₹1,500-₹4,000\nRoot Canal: ₹8,000-₹15,000\nCrown: ₹8,000-₹15,000\nImplant: ₹30,000-₹60,000\n\nWould you like to schedule a consultation for a detailed estimate?',
    keywords: ['prices', 'costs', 'how much', 'pricing', 'fees', 'treatment cost', 'dental cost', 'price list'],
    followUpQuestions: [
      'Schedule consultation',
      'Specific treatment cost',
      'Payment options'
    ]
  }
];

// Chatbot settings
export const chatbotSettings: ChatbotSettings = {
  welcomeMessage: 'Hi! I\'m your dental assistant. How can I help you today?',
  fallbackMessage: 'I\'m not sure I understand. Could you rephrase that? I can help with appointments, services, treatment processes, or connect you with our staff.',
  typingDelay: 1000, // milliseconds
  maxRetries: 3,
  escalationMessage: 'Let me connect you with one of our staff members who can better assist you. Please call us at {phone} or use the contact form on our website.'
};
