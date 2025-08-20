/**
 * CLINIC CONFIGURATION
 * 
 * This file manages all clinic-specific configurations.
 * To add a new clinic:
 * 1. Add a new entry to the CLINICS object
 * 2. Update the DEFAULT_CLINIC_SLUG if needed
 * 3. Set up the clinic in your Supabase database
 * 
 * Each clinic can have:
 * - Unique slug for URL identification
 * - Custom domain (optional)
 * - Specific contact information
 * - Custom working hours
 * - Email notification settings
 */

export interface ClinicConfig {
  slug: string
  name: string
  domain?: string
  contactPhone: string
  contactEmail: string
  address: string
  workingHours: {
    [key: string]: {
      start: string
      end: string
      enabled: boolean
    }
  }
  emailSettings: {
    fromEmail: string
    fromName: string
    replyTo?: string
    smtpConfig?: {
      host: string
      port: number
      secure: boolean
      auth: {
        user: string
        pass: string
      }
    }
  }
  notificationSettings: {
    emailNotifications: boolean
    reminderHours: number
    autoConfirm: boolean
  }
}

// All available clinics
export const CLINICS: Record<string, ClinicConfig> = {
  'jeshna-dental': {
    slug: 'jeshna-dental',
    name: 'Jeshna Dental Clinic',
    domain: 'jeshna-dental.com',
    contactPhone: '6363116263',
    contactEmail: 'contact@jeshnadentalclinic.com',
    address: 'Bangalore, Karnataka',
    workingHours: {
      monday: { start: '09:00', end: '20:00', enabled: true },
      tuesday: { start: '09:00', end: '20:00', enabled: true },
      wednesday: { start: '09:00', end: '20:00', enabled: true },
      thursday: { start: '09:00', end: '20:00', enabled: true },
      friday: { start: '09:00', end: '20:00', enabled: true },
      saturday: { start: '09:00', end: '18:00', enabled: false },
      sunday: { start: '10:00', end: '18:00', enabled: false }
    },
    emailSettings: {
      fromEmail: 'poorn8105@gmail.com',
      fromName: 'Jeshna Dental Clinic',
      replyTo: 'poorn8105@gmail.com'
    },
    notificationSettings: {
      emailNotifications: true,
      reminderHours: 24,
      autoConfirm: true
    }
  },
  
  'smile-dental': {
    slug: 'smile-dental',
    name: 'Smile Dental Care',
    domain: 'smiledentalcare.com',
    contactPhone: '9876543210',
    contactEmail: 'info@smiledentalcare.com',
    address: 'Mumbai, Maharashtra',
    workingHours: {
      monday: { start: '08:00', end: '19:00', enabled: true },
      tuesday: { start: '08:00', end: '19:00', enabled: true },
      wednesday: { start: '08:00', end: '19:00', enabled: true },
      thursday: { start: '08:00', end: '19:00', enabled: true },
      friday: { start: '08:00', end: '19:00', enabled: true },
      saturday: { start: '08:00', end: '17:00', enabled: true },
      sunday: { start: '09:00', end: '16:00', enabled: false }
    },
    emailSettings: {
      fromEmail: 'poorn8105@gmail.com',
      fromName: 'Smile Dental Care',
      replyTo: 'poorn8105@gmail.com'
    },
    notificationSettings: {
      emailNotifications: true,
      reminderHours: 48,
      autoConfirm: false
    }
  },
  
  'pearl-dental': {
    slug: 'pearl-dental',
    name: 'Pearl Dental Studio',
    domain: 'pearldentalstudio.com',
    contactPhone: '8765432109',
    contactEmail: 'hello@pearldentalstudio.com',
    address: 'Delhi, NCR',
    workingHours: {
      monday: { start: '10:00', end: '21:00', enabled: true },
      tuesday: { start: '10:00', end: '21:00', enabled: true },
      wednesday: { start: '10:00', end: '21:00', enabled: true },
      thursday: { start: '10:00', end: '21:00', enabled: true },
      friday: { start: '10:00', end: '21:00', enabled: true },
      saturday: { start: '10:00', end: '20:00', enabled: true },
      sunday: { start: '11:00', end: '18:00', enabled: true }
    },
    emailSettings: {
      fromEmail: 'poorn8105@gmail.com',
      fromName: 'Pearl Dental Studio',
      replyTo: 'poorn8105@gmail.com'
    },
    notificationSettings: {
      emailNotifications: true,
      reminderHours: 12,
      autoConfirm: true
    }
  }
}

// Default clinic to use when no specific clinic is detected
export const DEFAULT_CLINIC_SLUG = 'jeshna-dental'

// Get clinic config by slug
export const getClinicConfig = (slug: string): ClinicConfig => {
  return CLINICS[slug] || CLINICS[DEFAULT_CLINIC_SLUG]
}

// Get clinic config by domain
export const getClinicByDomain = (domain: string): ClinicConfig | null => {
  const clinic = Object.values(CLINICS).find(c => c.domain === domain)
  return clinic || null
}

// Get all available clinic slugs
export const getAvailableClinicSlugs = (): string[] => {
  return Object.keys(CLINICS)
}

// Validate clinic slug
export const isValidClinicSlug = (slug: string): boolean => {
  return slug in CLINICS
}
