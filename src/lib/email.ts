// Email sending functionality for appointment confirmations
import { format } from 'date-fns';
import { Resend } from 'resend';

// Initialize Resend
const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY);

export interface EmailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  replyTo: string;
}

export interface AppointmentEmailData {
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  status: string;
  clinicName: string;
  clinicPhone: string;
  clinicEmail: string;
}

// Email templates
export const emailTemplates = {
  confirmation: (data: AppointmentEmailData) => ({
    subject: `Appointment Confirmed - ${data.clinicName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Appointment Confirmed</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .appointment-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
          .label { font-weight: bold; color: #64748b; }
          .value { color: #1e293b; }
          .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
          .contact-info { background: #e0f2fe; padding: 15px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Appointment Confirmed</h1>
            <p>${data.clinicName}</p>
          </div>
          
          <div class="content">
            <p>Dear <strong>${data.name}</strong>,</p>
            
            <p>Your appointment has been successfully confirmed. Here are the details:</p>
            
            <div class="appointment-details">
              <div class="detail-row">
                <span class="label">Date:</span>
                <span class="value">${format(new Date(data.date), 'EEEE, MMMM dd, yyyy')}</span>
              </div>
              <div class="detail-row">
                <span class="label">Time:</span>
                <span class="value">${data.time}</span>
              </div>
              <div class="detail-row">
                <span class="label">Status:</span>
                <span class="value">${data.status}</span>
              </div>
            </div>
            
            <div class="contact-info">
              <h3>📞 Need to reschedule?</h3>
              <p>If you need to reschedule or cancel your appointment, please contact us:</p>
              <p><strong>Phone:</strong> ${data.clinicPhone}</p>
              <p><strong>Email:</strong> ${data.clinicEmail}</p>
            </div>
            
            <p><strong>Important:</strong></p>
            <ul>
              <li>Please arrive 10 minutes before your scheduled time</li>
              <li>Bring any relevant medical records or insurance information</li>
              <li>If you have any symptoms, please call us before coming</li>
            </ul>
            
            <p>We look forward to seeing you!</p>
            
            <p>Best regards,<br>
            <strong>${data.clinicName} Team</strong></p>
          </div>
          
          <div class="footer">
            <p>This email was sent to ${data.email}</p>
            <p>© ${new Date().getFullYear()} ${data.clinicName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Appointment Confirmed - ${data.clinicName}

Dear ${data.name},

Your appointment has been successfully confirmed.

APPOINTMENT DETAILS:
Date: ${format(new Date(data.date), 'EEEE, MMMM dd, yyyy')}
Time: ${data.time}
Status: ${data.status}

NEED TO RESCHEDULE?
Phone: ${data.clinicPhone}
Email: ${data.clinicEmail}

IMPORTANT:
- Please arrive 10 minutes before your scheduled time
- Bring any relevant medical records or insurance information
- If you have any symptoms, please call us before coming

We look forward to seeing you!

Best regards,
${data.clinicName} Team

---
This email was sent to ${data.email}
© ${new Date().getFullYear()} ${data.clinicName}. All rights reserved.
    `
  }),

  dentistNotification: (data: AppointmentEmailData) => ({
    subject: `New Appointment Booked - ${data.name} on ${format(new Date(data.date), 'MMM dd, yyyy')} at ${data.time}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Appointment Booked</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .patient-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
          .label { font-weight: bold; color: #64748b; }
          .value { color: #1e293b; }
          .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
          .contact-buttons { display: flex; gap: 10px; margin: 20px 0; }
          .contact-btn { padding: 10px 20px; border-radius: 6px; text-decoration: none; color: white; font-weight: bold; }
          .email-btn { background: #2563eb; }
          .phone-btn { background: #059669; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📅 New Appointment Booked</h1>
            <p>${data.clinicName}</p>
          </div>
          
          <div class="content">
            <p>Hello Doctor,</p>
            
            <p>A new appointment has been booked. Here are the details:</p>
            
            <div class="patient-details">
              <h3>👤 Patient Information</h3>
              <div class="detail-row">
                <span class="label">Name:</span>
                <span class="value">${data.name}</span>
              </div>
              <div class="detail-row">
                <span class="label">Phone:</span>
                <span class="value">${data.phone}</span>
              </div>
              <div class="detail-row">
                <span class="label">Email:</span>
                <span class="value">${data.email}</span>
              </div>
              
              <h3>📅 Appointment Details</h3>
              <div class="detail-row">
                <span class="label">Date:</span>
                <span class="value">${format(new Date(data.date), 'EEEE, MMMM dd, yyyy')}</span>
              </div>
              <div class="detail-row">
                <span class="label">Time:</span>
                <span class="value">${data.time}</span>
              </div>
              <div class="detail-row">
                <span class="label">Status:</span>
                <span class="value">${data.status}</span>
              </div>
            </div>
            
            <div class="contact-buttons">
              <a href="mailto:${data.email}" class="contact-btn email-btn">📧 Email Patient</a>
              <a href="tel:${data.phone}" class="contact-btn phone-btn">📞 Call Patient</a>
            </div>
            
            <p><strong>Quick Actions:</strong></p>
            <ul>
              <li>Review patient details above</li>
              <li>Contact patient if needed</li>
              <li>Prepare for the appointment</li>
              <li>Check admin dashboard for more details</li>
            </ul>
            
            <p>Best regards,<br>
            <strong>${data.clinicName} Booking System</strong></p>
          </div>
          
          <div class="footer">
            <p>This notification was sent to the clinic staff</p>
            <p>© ${new Date().getFullYear()} ${data.clinicName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
New Appointment Booked - ${data.clinicName}

Hello Doctor,

A new appointment has been booked.

PATIENT INFORMATION:
Name: ${data.name}
Phone: ${data.phone}
Email: ${data.email}

APPOINTMENT DETAILS:
Date: ${format(new Date(data.date), 'EEEE, MMMM dd, yyyy')}
Time: ${data.time}
Status: ${data.status}

QUICK ACTIONS:
- Review patient details above
- Contact patient if needed: ${data.phone} or ${data.email}
- Prepare for the appointment
- Check admin dashboard for more details

Best regards,
${data.clinicName} Booking System

---
This notification was sent to the clinic staff
© ${new Date().getFullYear()} ${data.clinicName}. All rights reserved.
    `
  }),

  reminder: (data: AppointmentEmailData) => ({
    subject: `Appointment Reminder - ${data.clinicName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Appointment Reminder</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .reminder-box { background: #ecfdf5; border-left: 4px solid #059669; padding: 20px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Appointment Reminder</h1>
            <p>${data.clinicName}</p>
          </div>
          
          <div class="content">
            <p>Dear <strong>${data.name}</strong>,</p>
            
            <div class="reminder-box">
              <h3>Your appointment is tomorrow!</h3>
              <p><strong>Date:</strong> ${format(new Date(data.date), 'EEEE, MMMM dd, yyyy')}</p>
              <p><strong>Time:</strong> ${data.time}</p>
            </div>
            
            <p><strong>Please remember:</strong></p>
            <ul>
              <li>Arrive 10 minutes early</li>
              <li>Bring your ID and insurance information</li>
              <li>If you're feeling unwell, please call us</li>
            </ul>
            
            <p>Need to reschedule? Call us at ${data.clinicPhone}</p>
            
            <p>See you tomorrow!</p>
            
            <p>Best regards,<br>
            <strong>${data.clinicName} Team</strong></p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  cancellation: (data: AppointmentEmailData) => ({
    subject: `Appointment Cancelled - ${data.clinicName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Appointment Cancelled</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Appointment Cancelled</h1>
            <p>${data.clinicName}</p>
          </div>
          
          <div class="content">
            <p>Dear <strong>${data.name}</strong>,</p>
            
            <p>Your appointment has been cancelled as requested.</p>
            
            <p><strong>Cancelled Appointment:</strong></p>
            <p>Date: ${format(new Date(data.date), 'EEEE, MMMM dd, yyyy')}</p>
            <p>Time: ${data.time}</p>
            
            <p>To reschedule, please contact us:</p>
            <p>Phone: ${data.clinicPhone}</p>
            <p>Email: ${data.clinicEmail}</p>
            
            <p>We hope to see you soon!</p>
            
            <p>Best regards,<br>
            <strong>${data.clinicName} Team</strong></p>
          </div>
        </div>
      </body>
      </html>
    `
  })
};

// Send email using Resend
export const sendEmail = async (
  to: string, 
  subject: string, 
  html: string, 
  text: string
): Promise<boolean> => {
  try {
    // Debug: Check API key
    console.log('🔍 Email Debug Info:', {
      hasApiKey: !!import.meta.env.VITE_RESEND_API_KEY,
      apiKeyLength: import.meta.env.VITE_RESEND_API_KEY?.length || 0,
      apiKeyStart: import.meta.env.VITE_RESEND_API_KEY?.substring(0, 3) || 'none'
    });

    // Check if Resend API key is available
    if (!import.meta.env.VITE_RESEND_API_KEY) {
      console.log('📧 Resend API key not found, simulating email send');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('HTML:', html.substring(0, 200) + '...');
      console.log('Text:', text.substring(0, 200) + '...');
      
      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      return true;
    }

    // In development, simulate email sending due to CORS restrictions
    if (import.meta.env.DEV) {
      console.log('📧 Development Mode - Simulating email send:');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('HTML Preview:', html.substring(0, 200) + '...');
      console.log('Text Preview:', text.substring(0, 200) + '...');
      
      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('✅ Email simulation completed successfully');
      return true;
    }

    // In production, send real email using Resend
    const { data, error } = await resend.emails.send({
      from: 'Jeshna Dental Clinic <appointments@resend.dev>',
      to: [to],
      reply_to: 'poorna.shetty@outlook.com', // Dentist's email for replies
      subject: subject,
      html: html,
      text: text,
    });

    if (error) {
      console.error('❌ Resend API Error:', error);
      return false;
    }

    console.log('📧 Email sent successfully:', data);
    return true;
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    return false;
  }
};

// Send appointment confirmation email to patient
export const sendAppointmentConfirmation = async (
  appointmentData: AppointmentEmailData
): Promise<boolean> => {
  const template = emailTemplates.confirmation(appointmentData);
  
  return await sendEmail(
    appointmentData.email,
    template.subject,
    template.html,
    template.text
  );
};

// Send appointment notification email to dentist
export const sendDentistNotification = async (
  appointmentData: AppointmentEmailData
): Promise<boolean> => {
  const template = emailTemplates.dentistNotification(appointmentData);
  
  return await sendEmail(
    'poorna.shetty@outlook.com', // Dentist's email
    template.subject,
    template.html,
    template.text
  );
};

// Send appointment reminder email
export const sendAppointmentReminder = async (
  appointmentData: AppointmentEmailData
): Promise<boolean> => {
  const template = emailTemplates.reminder(appointmentData);
  
  return await sendEmail(
    appointmentData.email,
    template.subject,
    template.html,
    template.text
  );
};

// Send appointment cancellation email
export const sendAppointmentCancellation = async (
  appointmentData: AppointmentEmailData
): Promise<boolean> => {
  const template = emailTemplates.cancellation(appointmentData);
  
  return await sendEmail(
    appointmentData.email,
    template.subject,
    template.html,
    template.text
  );
};
