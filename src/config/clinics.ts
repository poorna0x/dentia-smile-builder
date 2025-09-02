/**
 * CLINIC CONFIGURATION
 * 
 * This file manages clinic-specific configurations for the frontend.
 * The actual clinic data is now loaded directly from the database.
 * 
 * This configuration file is used for:
 * - Default working hours templates
 * - Email notification settings
 * - Treatment cost defaults
 * 
 * TEMPLATE NOTES:
 * - Update these defaults to match your clinic's preferences
 * - Working hours can be customized per clinic in the database
 * - Email settings are configured per clinic in the database
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

// Default working hours template (can be overridden per clinic)
export const DEFAULT_WORKING_HOURS = {
  monday: { start: '09:00', end: '18:00', enabled: true },
  tuesday: { start: '09:00', end: '18:00', enabled: true },
  wednesday: { start: '09:00', end: '18:00', enabled: true },
  thursday: { start: '09:00', end: '18:00', enabled: true },
  friday: { start: '09:00', end: '18:00', enabled: true },
  saturday: { start: '09:00', end: '17:00', enabled: false },
  sunday: { start: '10:00', end: '16:00', enabled: false }
}

// Default email notification settings
export const DEFAULT_EMAIL_SETTINGS = {
  emailNotifications: true,
  reminderHours: 24,
  autoConfirm: true
}

// Default email configuration
export const DEFAULT_EMAIL_CONFIG = {
  fromEmail: 'noreply@yourclinic.com',
  fromName: 'Your Clinic Name',
  replyTo: 'contact@yourclinic.com'
}

// Helper function to get default working hours
export const getDefaultWorkingHours = () => DEFAULT_WORKING_HOURS

// Helper function to get default email settings
export const getDefaultEmailSettings = () => DEFAULT_EMAIL_SETTINGS

// Helper function to get default email config
export const getDefaultEmailConfig = () => DEFAULT_EMAIL_CONFIG
