/**
 * EMAIL CONFIGURATION
 * 
 * This file manages email settings and templates for all clinics.
 * 
 * Email Features:
 * - Appointment confirmations
 * - Appointment reminders
 * - Cancellation notifications
 * - Reschedule confirmations
 * 
 * To configure email sending:
 * 1. Set up SMTP credentials in environment variables
 * 2. Update email templates as needed
 * 3. Configure clinic-specific email settings in clinics.ts
 * 
 * TEMPLATE NOTES:
 * - All email templates use clinic name from clinic configuration
 * - Email sender name is configured in clinics.ts
 * - SMTP settings are configured in environment variables
 * - No hardcoded clinic names in this file - all dynamic
 */

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export interface EmailConfig {
  smtp: {
    host: string
    port: number
    secure: boolean
    auth: {
      user: string
      pass: string
    }
  }
  defaultFrom: {
    email: string
    name: string
  }
}

// Email templates
export const EMAIL_TEMPLATES = {
  appointmentConfirmation: (clinicName: string, patientName: string, date: string, time: string): EmailTemplate => ({
    subject: `Appointment Confirmed - ${clinicName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Appointment Confirmed</h2>
        <p>Dear ${patientName},</p>
        <p>Your appointment at <strong>${clinicName}</strong> has been confirmed.</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Appointment Details:</h3>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Time:</strong> ${time}</p>
        </div>
        
        <p>Please arrive 10 minutes before your scheduled time.</p>
        <p>If you need to reschedule or cancel, please contact us at least 24 hours in advance.</p>
        
        <p>Best regards,<br>${clinicName} Team</p>
      </div>
    `,
    text: `
      Appointment Confirmed - ${clinicName}
      
      Dear ${patientName},
      
      Your appointment at ${clinicName} has been confirmed.
      
      Appointment Details:
      Date: ${date}
      Time: ${time}
      
      Please arrive 10 minutes before your scheduled time.
      If you need to reschedule or cancel, please contact us at least 24 hours in advance.
      
      Best regards,
      ${clinicName} Team
    `
  }),

  appointmentReminder: (clinicName: string, patientName: string, date: string, time: string): EmailTemplate => ({
    subject: `Appointment Reminder - ${clinicName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Appointment Reminder</h2>
        <p>Dear ${patientName},</p>
        <p>This is a friendly reminder about your upcoming appointment at <strong>${clinicName}</strong>.</p>
        
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Appointment Details:</h3>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Time:</strong> ${time}</p>
        </div>
        
        <p>Please arrive 10 minutes before your scheduled time.</p>
        <p>If you need to reschedule or cancel, please contact us immediately.</p>
        
        <p>Best regards,<br>${clinicName} Team</p>
      </div>
    `,
    text: `
      Appointment Reminder - ${clinicName}
      
      Dear ${patientName},
      
      This is a friendly reminder about your upcoming appointment at ${clinicName}.
      
      Appointment Details:
      Date: ${date}
      Time: ${time}
      
      Please arrive 10 minutes before your scheduled time.
      If you need to reschedule or cancel, please contact us immediately.
      
      Best regards,
      ${clinicName} Team
    `
  }),

  appointmentCancelled: (clinicName: string, patientName: string, date: string, time: string): EmailTemplate => ({
    subject: `Appointment Cancelled - ${clinicName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Appointment Cancelled</h2>
        <p>Dear ${patientName},</p>
        <p>Your appointment at <strong>${clinicName}</strong> has been cancelled.</p>
        
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Cancelled Appointment:</h3>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Time:</strong> ${time}</p>
        </div>
        
        <p>To reschedule your appointment, please contact us or book online.</p>
        <p>We apologize for any inconvenience.</p>
        
        <p>Best regards,<br>${clinicName} Team</p>
      </div>
    `,
    text: `
      Appointment Cancelled - ${clinicName}
      
      Dear ${patientName},
      
      Your appointment at ${clinicName} has been cancelled.
      
      Cancelled Appointment:
      Date: ${date}
      Time: ${time}
      
      To reschedule your appointment, please contact us or book online.
      We apologize for any inconvenience.
      
      Best regards,
      ${clinicName} Team
    `
  }),

  appointmentRescheduled: (clinicName: string, patientName: string, oldDate: string, oldTime: string, newDate: string, newTime: string): EmailTemplate => ({
    subject: `Appointment Rescheduled - ${clinicName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Appointment Rescheduled</h2>
        <p>Dear ${patientName},</p>
        <p>Your appointment at <strong>${clinicName}</strong> has been rescheduled.</p>
        
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">New Appointment Details:</h3>
          <p><strong>Date:</strong> ${newDate}</p>
          <p><strong>Time:</strong> ${newTime}</p>
          
          <h4 style="margin-top: 20px;">Previous Appointment:</h4>
          <p><strong>Date:</strong> ${oldDate}</p>
          <p><strong>Time:</strong> ${oldTime}</p>
        </div>
        
        <p>Please arrive 10 minutes before your scheduled time.</p>
        <p>If you need to make any changes, please contact us.</p>
        
        <p>Best regards,<br>${clinicName} Team</p>
      </div>
    `,
    text: `
      Appointment Rescheduled - ${clinicName}
      
      Dear ${patientName},
      
      Your appointment at ${clinicName} has been rescheduled.
      
      New Appointment Details:
      Date: ${newDate}
      Time: ${newTime}
      
      Previous Appointment:
      Date: ${oldDate}
      Time: ${oldTime}
      
      Please arrive 10 minutes before your scheduled time.
      If you need to make any changes, please contact us.
      
      Best regards,
      ${clinicName} Team
    `
  })
}

// Get email template by type
export const getEmailTemplate = (
  type: keyof typeof EMAIL_TEMPLATES,
  clinicName: string,
  patientName: string,
  date: string,
  time: string,
  oldDate?: string,
  oldTime?: string
): EmailTemplate => {
  switch (type) {
    case 'appointmentConfirmation':
      return EMAIL_TEMPLATES.appointmentConfirmation(clinicName, patientName, date, time)
    case 'appointmentReminder':
      return EMAIL_TEMPLATES.appointmentReminder(clinicName, patientName, date, time)
    case 'appointmentCancelled':
      return EMAIL_TEMPLATES.appointmentCancelled(clinicName, patientName, date, time)
    case 'appointmentRescheduled':
      if (!oldDate || !oldTime) {
        throw new Error('Old date and time required for reschedule template')
      }
      return EMAIL_TEMPLATES.appointmentRescheduled(clinicName, patientName, oldDate, oldTime, date, time)
    default:
      throw new Error(`Unknown email template type: ${type}`)
  }
}
