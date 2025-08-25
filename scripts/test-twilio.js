// Test Twilio WhatsApp integration locally
const twilio = require('twilio');

async function testTwilio() {
  try {
    // Get credentials from environment
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;

    console.log('🔍 Checking Twilio credentials...');
    console.log('Account SID:', accountSid ? '✅ Found' : '❌ Missing');
    console.log('Auth Token:', authToken ? '✅ Found' : '❌ Missing');
    console.log('From Number:', fromNumber ? '✅ Found' : '❌ Missing');

    if (!accountSid || !authToken || !fromNumber) {
      console.error('❌ Missing Twilio credentials in environment variables');
      return;
    }

    // Initialize Twilio client
    const client = twilio(accountSid, authToken);

    console.log('✅ Twilio client initialized successfully');
    console.log('📱 From number:', fromNumber);
    
    // Test message (you'll need to replace with your test number)
    const testTo = 'whatsapp:+1234567890'; // Replace with your test number
    const testMessage = 'Test message from Dental Clinic WhatsApp integration!';

    console.log('📤 Attempting to send test message...');
    console.log('To:', testTo);
    console.log('Message:', testMessage);

    // Uncomment the line below to actually send a test message
    // const result = await client.messages.create({
    //   body: testMessage,
    //   from: fromNumber,
    //   to: testTo
    // });
    
    // console.log('✅ Test message sent successfully:', result.sid);

  } catch (error) {
    console.error('❌ Error testing Twilio:', error);
  }
}

testTwilio();
