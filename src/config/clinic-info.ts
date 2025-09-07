/**
 * Clinic Information Configuration
 * 
 * This file contains all the basic information about the dental clinic.
 * Users can customize these values to match their specific clinic.
 */

export interface ClinicInfo {
  // Basic Information
  name: string;
  tagline: string;
  description: string;
  
  // Contact Information
  phone: string;
  email: string;
  website: string;
  
  // Address
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  
  // Office Hours
  officeHours: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
  
  // Emergency Information
  emergencyPhone: string;
  emergencyHours: string;
  
  // Social Media
  socialMedia: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
  
  // Insurance
  insuranceAccepted: string[];
  
  // Languages Spoken
  languagesSpoken: string[];
}

// Default clinic information - users can modify this
export const clinicInfo: ClinicInfo = {
  // Basic Information
  name: "Jeshna Dental",
  tagline: "Your Smile, Our Priority",
  description: "Providing exceptional dental care with a personal touch. Your smile is our priority, and we're committed to helping you achieve optimal oral health.",
  
  // Contact Information
  phone: "+15551234567",
  email: "info@jeshna-dental.com",
  website: "https://jeshna-dental.com",
  
  // Address
  address: {
    street: "123 Main Street",
    city: "Your City",
    state: "Your State",
    zipCode: "12345",
    country: "United States"
  },
  
  // Office Hours
  officeHours: {
    monday: "8:00 AM - 6:00 PM",
    tuesday: "8:00 AM - 6:00 PM",
    wednesday: "8:00 AM - 6:00 PM",
    thursday: "8:00 AM - 6:00 PM",
    friday: "8:00 AM - 5:00 PM",
    saturday: "9:00 AM - 2:00 PM",
    sunday: "Closed"
  },
  
  // Emergency Information
  emergencyPhone: "+1 (555) 123-4567",
  emergencyHours: "24/7 Emergency Service Available",
  
  // Social Media
  socialMedia: {
    facebook: "https://facebook.com/jeshna-dental",
    instagram: "https://instagram.com/jeshna-dental",
    twitter: "https://twitter.com/jeshna-dental"
  },
  
  // Insurance
  insuranceAccepted: [
    "Delta Dental",
    "Cigna",
    "Aetna",
    "MetLife",
    "United Healthcare",
    "Blue Cross Blue Shield",
    "Humana",
    "Guardian"
  ],
  
  // Languages Spoken
  languagesSpoken: [
    "English",
    "Spanish",
    "French"
  ]
};
