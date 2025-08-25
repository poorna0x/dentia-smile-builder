# WhatsApp Integration Setup Guide

## Overview
This guide will help you set up WhatsApp notifications for appointment confirmations and review requests using Twilio's WhatsApp Business API.

## Features Added

### 1. WhatsApp Appointment Confirmations
- Automatically sends WhatsApp messages when appointments are booked
- Works for all three booking scenarios:
  - Public appointment booking
  - Admin panel - existing patient booking
  - Admin panel - general appointment booking

### 2. WhatsApp Review Requests
- Sends review requests when appointments are marked as "Complete"
- Customizable message template
- Includes review link for patients

### 3. Super Admin Controls
- Enable/disable WhatsApp notifications
- Configure Twilio API credentials
- Enable/disable review requests
- Customize review message templates

## Setup Steps

### Step 1: Create Twilio Account
1. Go to [Twilio Console](https://console.twilio.com/)
2. Sign up for a free account
3. Verify your email and phone number

### Step 2: Get Twilio Credentials
1. In Twilio Console, go to **Dashboard**
2. Copy your **Account SID** and **Auth Token**
3. Go to **Phone Numbers** → **Manage** → **Active numbers**
4. Add a phone number (you'll get a sandbox number for free)

### Step 3: Enable WhatsApp Business API
1. In Twilio Console, go to **Messaging** → **Try it out** → **Send a WhatsApp message**
2. Follow the instructions to join your sandbox
3. Note your WhatsApp number (format: `whatsapp:+1234567890`)

### Step 4: Configure Environment Variables

#### For Local Development (.env.local)
Create a `.env.local` file in your project root and add:

```
# Twilio WhatsApp Configuration
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890
```

#### For Production (Netlify)
Add these to your Netlify environment variables:

```
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890
```

### Step 5: Configure Super Admin Settings
1. Access your Super Admin page
2. Go to **Notification Settings**
3. Enable **WhatsApp Enabled**
4. Enter your Twilio API key
5. Enter your WhatsApp phone number
6. Enable **Review Requests Enabled** (optional)
7. Customize review message template (optional)

## Costs & Limits

### Twilio Free Tier
- **1,000 free messages/month**
- **Sandbox number included**
- **No setup fees**

### Twilio Paid Tier
- **₹0.50-1.00 per message in India**
- **Your own WhatsApp Business number**
- **Advanced features**

### Netlify Free Tier
- **125,000 function invocations/month**
- **More than enough for typical usage**

### Supabase Free Tier
- **500MB storage**
- **2GB bandwidth/month**
- **500,000 function calls/month**

## Message Templates

### Appointment Confirmation
```
Hi {name}! Your appointment at {clinic_name} is confirmed for {date} at {time}. For any changes, call {clinic_phone}. Thank you!
```

### Review Request (Customizable)
```
Thank you for choosing our clinic! We hope your visit was great. Please share your experience: {review_link}
```

## Testing

### Test WhatsApp Setup
1. Enable WhatsApp in Super Admin
2. Create a test appointment
3. Check console logs for WhatsApp sending status
4. Verify message received on your phone

### Test Review Requests
1. Enable review requests in Super Admin
2. Mark an appointment as "Complete"
3. Check for review request message
4. Verify review link works

## Troubleshooting

### Common Issues

1. **"WhatsApp number not verified"**
   - Join your Twilio sandbox first
   - Use the correct number format: `whatsapp:+1234567890`

2. **"Invalid phone number format"**
   - Ensure patient phone numbers include country code
   - Format: `+1234567890`

3. **"WhatsApp service not configured"**
   - Check environment variables in Netlify
   - Verify API credentials are correct

4. **Messages not sending**
   - Check Netlify function logs
   - Verify Twilio account has credits
   - Ensure WhatsApp is enabled in Super Admin

### Debug Steps
1. Check browser console for error messages
2. Check Netlify function logs
3. Verify Twilio console for message status
4. Test with a known working phone number

## Security Notes

- API keys are stored securely in environment variables
- Phone numbers are validated before sending
- Failed WhatsApp sends don't affect email confirmations
- All attempts are logged for debugging

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Netlify function logs
3. Check Twilio console for error details
4. Verify all environment variables are set correctly

## Next Steps

Once setup is complete:
1. Test with real appointments
2. Monitor usage in Twilio console
3. Consider upgrading to paid tier for production use
4. Customize message templates as needed
