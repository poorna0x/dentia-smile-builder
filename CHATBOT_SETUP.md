# 🤖 Chatbot Setup Guide

This guide will help you customize the chatbot for your dental clinic.

## 📁 Configuration Files

All chatbot settings are located in the `src/config/` folder:

- `clinic-info.ts` - Basic clinic information
- `chatbot-responses.ts` - Q&A responses and conversation flows
- `chatbot-settings.ts` - Appearance and behavior settings

## 🏥 Step 1: Update Clinic Information

Edit `src/config/clinic-info.ts`:

```typescript
export const clinicInfo: ClinicInfo = {
  name: "Your Dental Clinic Name",
  tagline: "Your Clinic Tagline",
  phone: "+1 (555) 123-4567",
  email: "info@yourclinic.com",
  address: {
    street: "123 Your Street",
    city: "Your City",
    state: "Your State",
    zipCode: "12345"
  },
  officeHours: {
    monday: "8:00 AM - 6:00 PM",
    // ... update all days
  },
  insuranceAccepted: [
    "Delta Dental",
    "Your Insurance Provider"
  ]
};
```

## 💬 Step 2: Customize Chatbot Responses

Edit `src/config/chatbot-responses.ts`:

### Add New Responses:
```typescript
{
  id: 'your_question',
  question: 'keyword1|keyword2|keyword3',
  answer: 'Your custom response here. Use {clinicName} for dynamic content.',
  keywords: ['keyword1', 'keyword2'],
  followUpQuestions: [
    'Follow-up option 1',
    'Follow-up option 2'
  ]
}
```

### Dynamic Content Variables:
- `{clinicName}` - Your clinic name
- `{phone}` - Your phone number
- `{email}` - Your email
- `{address}` - Your full address
- `{emergencyPhone}` - Emergency contact

## 🎨 Step 3: Customize Appearance

Edit `src/config/chatbot-settings.ts`:

```typescript
export const chatbotAppearance: ChatbotAppearance = {
  primaryColor: '#3B82F6', // Your brand color
  secondaryColor: '#10B981',
  position: 'bottom-right', // or 'bottom-left'
  width: '350px',
  height: '500px'
};
```

## ⚙️ Step 4: Configure Features

Enable/disable features based on your needs:

```typescript
export const chatbotFeatures: ChatbotFeatures = {
  appointmentBooking: true,
  serviceInquiry: true,
  emergencySupport: true,
  insuranceVerification: true,
  multiLanguage: false // Set to true if you support multiple languages
};
```

## 🚀 Quick Setup Presets

Choose a preset that matches your clinic type:

```typescript
// For general dental practice
const preset = clinicPresets.general;

// For cosmetic dental practice
const preset = clinicPresets.cosmetic;

// For pediatric dental practice
const preset = clinicPresets.pediatric;
```

## 📝 Common Customizations

### 1. Add Your Services
Update the services response in `chatbot-responses.ts`:

```typescript
{
  id: 'services',
  answer: 'We offer:\n\n• Your Service 1\n• Your Service 2\n• Your Service 3'
}
```

### 2. Update Pricing
Modify cost-related responses:

```typescript
{
  id: 'cost_cleaning',
  answer: 'Our cleaning costs $X. Most insurance covers 100% of preventive care.'
}
```

### 3. Add Emergency Procedures
Customize emergency responses:

```typescript
{
  id: 'emergency',
  answer: 'For emergencies, call {emergencyPhone}. We provide 24/7 emergency care.'
}
```

## 🔧 Advanced Customization

### Custom Actions
Add custom actions for specific responses:

```typescript
{
  id: 'book_appointment',
  action: {
    type: 'book_appointment',
    data: { url: '/appointment' }
  }
}
```

### Multi-language Support
Enable multi-language support:

```typescript
export const chatbotFeatures: ChatbotFeatures = {
  multiLanguage: true
};
```

## 📊 Testing Your Chatbot

1. **Test Common Questions**: Try asking about appointments, services, hours
2. **Test Edge Cases**: Try unclear questions, typos
3. **Test Mobile**: Ensure it works on mobile devices
4. **Test Performance**: Check loading speed

## 🎯 Best Practices

1. **Keep Responses Concise**: Aim for 1-2 sentences
2. **Use Clear Language**: Avoid medical jargon
3. **Provide Next Steps**: Always offer follow-up options
4. **Test Regularly**: Update responses based on common questions
5. **Monitor Performance**: Track which responses work best

## 🆘 Troubleshooting

### Chatbot Not Appearing
- Check if the component is imported in your main layout
- Verify the configuration files are properly set up

### Responses Not Working
- Check the keywords in your responses
- Ensure the question patterns match user inputs

### Styling Issues
- Verify color codes are valid hex values
- Check if CSS classes are properly applied

## 📞 Support

If you need help customizing your chatbot, refer to the documentation or contact support.

---

**Happy Chatbot Building! 🦷✨**
