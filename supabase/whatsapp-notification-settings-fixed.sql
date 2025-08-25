-- WhatsApp and Review Notification Settings
-- This script adds notification settings to the existing system_settings table
-- Based on the actual table structure: setting_type (text) and settings (jsonb)

-- Add notification settings
INSERT INTO system_settings (setting_type, settings, description, created_at, updated_at) 
VALUES 
  ('whatsapp_notifications', 
   '{"enabled": false, "phone_number": ""}', 
   'WhatsApp notification settings for appointment confirmations', 
   NOW(), NOW()),
  ('review_requests', 
   '{"enabled": false, "message_template": "Thank you for choosing our clinic! We hope your visit was great. Please share your experience: {review_link}"}', 
   'Review request settings for completed appointments', 
   NOW(), NOW())
ON CONFLICT (setting_type) DO UPDATE SET 
  settings = EXCLUDED.settings,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Create function to get notification settings
CREATE OR REPLACE FUNCTION get_notification_settings()
RETURNS TABLE (
  whatsapp_enabled BOOLEAN,
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
    (settings->>'enabled')::BOOLEAN as whatsapp_enabled,
    (settings->>'phone_number')::TEXT as whatsapp_phone_number,
    (SELECT (settings->>'enabled')::BOOLEAN FROM system_settings WHERE setting_type = 'review_requests') as review_requests_enabled,
    (SELECT (settings->>'message_template')::TEXT FROM system_settings WHERE setting_type = 'review_requests') as review_message_template
  FROM system_settings 
  WHERE setting_type = 'whatsapp_notifications';
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_notification_settings() TO authenticated;
