/**
 * Chatbot Settings Configuration
 * 
 * This file contains all the chatbot behavior and appearance settings.
 * Users can customize the chatbot's look, feel, and behavior.
 */

export interface ChatbotAppearance {
  // Colors
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  backgroundColor: string;
  
  // Position
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  
  // Size
  width: string;
  height: string;
  
  // Animation
  animationType: 'slide' | 'fade' | 'bounce';
  animationDuration: number;
}

export interface ChatbotBehavior {
  // Auto-responses
  autoGreeting: boolean;
  autoGreetingDelay: number;
  
  // Typing indicators
  showTypingIndicator: boolean;
  typingSpeed: number;
  
  // Message limits
  maxMessages: number;
  maxMessageLength: number;
  
  // Escalation
  autoEscalateAfter: number; // minutes
  escalationTriggers: string[];
}

export interface ChatbotFeatures {
  // Core features
  appointmentBooking: boolean;
  serviceInquiry: boolean;
  emergencySupport: boolean;
  insuranceVerification: boolean;
  
  // Advanced features
  fileUpload: boolean;
  voiceMessages: boolean;
  screenSharing: boolean;
  multiLanguage: boolean;
  
  // Integration
  calendarIntegration: boolean;
  crmIntegration: boolean;
  emailIntegration: boolean;
}

// Default chatbot settings - users can customize these
export const chatbotAppearance: ChatbotAppearance = {
  // Colors (matching dental theme)
  primaryColor: '#3B82F6', // Blue
  secondaryColor: '#10B981', // Green
  textColor: '#1F2937', // Dark gray
  backgroundColor: '#FFFFFF', // White
  
  // Position
  position: 'bottom-right',
  
  // Size
  width: '350px',
  height: '500px',
  
  // Animation
  animationType: 'slide',
  animationDuration: 300
};

export const chatbotBehavior: ChatbotBehavior = {
  // Auto-responses
  autoGreeting: true,
  autoGreetingDelay: 3000, // 3 seconds
  
  // Typing indicators
  showTypingIndicator: true,
  typingSpeed: 50, // characters per second
  
  // Message limits
  maxMessages: 50,
  maxMessageLength: 500,
  
  // Escalation
  autoEscalateAfter: 10, // 10 minutes
  escalationTriggers: [
    'frustrated',
    'angry',
    'not helpful',
    'human',
    'speak to someone'
  ]
};

export const chatbotFeatures: ChatbotFeatures = {
  // Core features
  appointmentBooking: true,
  serviceInquiry: true,
  emergencySupport: true,
  insuranceVerification: true,
  
  // Advanced features
  fileUpload: false,
  voiceMessages: false,
  screenSharing: false,
  multiLanguage: true,
  
  // Integration
  calendarIntegration: true,
  crmIntegration: false,
  emailIntegration: true
};

// Quick setup presets for different clinic types
export const clinicPresets = {
  general: {
    name: 'General Dental Practice',
    features: {
      appointmentBooking: true,
      serviceInquiry: true,
      emergencySupport: true,
      insuranceVerification: true
    }
  },
  cosmetic: {
    name: 'Cosmetic Dental Practice',
    features: {
      appointmentBooking: true,
      serviceInquiry: true,
      emergencySupport: false,
      insuranceVerification: false
    }
  },
  pediatric: {
    name: 'Pediatric Dental Practice',
    features: {
      appointmentBooking: true,
      serviceInquiry: true,
      emergencySupport: true,
      insuranceVerification: true
    }
  },
  emergency: {
    name: 'Emergency Dental Practice',
    features: {
      appointmentBooking: true,
      serviceInquiry: false,
      emergencySupport: true,
      insuranceVerification: false
    }
  }
};
