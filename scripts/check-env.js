// Check if environment variables are loaded
console.log('🔍 Checking environment variables...');

// Check if we're in a browser environment
if (typeof window !== 'undefined') {
  console.log('🌐 Browser environment detected');
  console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? '✅ Found' : '❌ Missing');
  console.log('VITE_RESEND_API_KEY:', import.meta.env.VITE_RESEND_API_KEY ? '✅ Found' : '❌ Missing');
  
  // Note: Server-side env vars (TWILIO_*) are not available in browser
  console.log('📱 Twilio credentials: Only available in Netlify functions (server-side)');
} else {
  console.log('🖥️ Node.js environment detected');
  console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? '✅ Found' : '❌ Missing');
  console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? '✅ Found' : '❌ Missing');
  console.log('TWILIO_WHATSAPP_NUMBER:', process.env.TWILIO_WHATSAPP_NUMBER ? '✅ Found' : '❌ Missing');
}

console.log('📋 Environment check complete');
