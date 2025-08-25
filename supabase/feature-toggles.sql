-- Feature toggles for WhatsApp and Review features
-- This extends the existing feature_toggles system

-- Add new feature toggles
INSERT INTO system_settings (key, value, description, category) 
VALUES 
  ('whatsapp_enabled', 'false', 'Enable WhatsApp appointment confirmations', 'notifications'),
  ('whatsapp_api_key', '', 'WhatsApp API key (Twilio/MessageBird)', 'notifications'),
  ('whatsapp_phone_number', '', 'WhatsApp phone number for sending messages', 'notifications'),
  ('review_requests_enabled', 'false', 'Enable review requests after appointment completion', 'notifications'),
  ('review_message_template', 'Thank you for choosing our clinic! We hope your visit was great. Please share your experience: {review_link}', 'Template for review request messages', 'notifications')
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  updated_at = NOW();

-- Add RLS policy for feature toggles
CREATE POLICY "Enable read access for authenticated users" ON system_settings
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create function to get notification settings
CREATE OR REPLACE FUNCTION get_notification_settings()
RETURNS TABLE (
  whatsapp_enabled BOOLEAN,
  whatsapp_api_key TEXT,
  whatsapp_phone_number TEXT,
  review_requests_enabled BOOLEAN,
  review_message_template TEXT
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (value = 'true') as whatsapp_enabled,
    (SELECT value FROM system_settings WHERE key = 'whatsapp_api_key') as whatsapp_api_key,
    (SELECT value FROM system_settings WHERE key = 'whatsapp_phone_number') as whatsapp_phone_number,
    (SELECT value = 'true' FROM system_settings WHERE key = 'review_requests_enabled') as review_requests_enabled,
    (SELECT value FROM system_settings WHERE key = 'review_message_template') as review_message_template
  FROM system_settings 
  WHERE key = 'whatsapp_enabled';
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_notification_settings() TO authenticated;
