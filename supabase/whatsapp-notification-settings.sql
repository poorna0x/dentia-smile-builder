-- WhatsApp and Review Notification Settings
-- This script adds notification settings to the existing system_settings table

-- First, let's check what columns exist in system_settings
-- Run this first to see the table structure:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'system_settings';

-- Add notification settings (assuming the table has 'setting_key' and 'setting_value' columns)
-- If the column names are different, adjust accordingly

INSERT INTO system_settings (setting_key, setting_value, description, category, created_at, updated_at) 
VALUES 
  ('whatsapp_enabled', 'false', 'Enable WhatsApp appointment confirmations', 'notifications', NOW(), NOW()),
  ('whatsapp_api_key', '', 'WhatsApp API key (Twilio/MessageBird)', 'notifications', NOW(), NOW()),
  ('whatsapp_phone_number', '', 'WhatsApp phone number for sending messages', 'notifications', NOW(), NOW()),
  ('review_requests_enabled', 'false', 'Enable review requests after appointment completion', 'notifications', NOW(), NOW()),
  ('review_message_template', 'Thank you for choosing our clinic! We hope your visit was great. Please share your experience: {review_link}', 'Template for review request messages', 'notifications', NOW(), NOW())
ON CONFLICT (setting_key) DO UPDATE SET 
  setting_value = EXCLUDED.setting_value,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  updated_at = NOW();

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
    (setting_value = 'true') as whatsapp_enabled,
    (SELECT setting_value FROM system_settings WHERE setting_key = 'whatsapp_api_key') as whatsapp_api_key,
    (SELECT setting_value FROM system_settings WHERE setting_key = 'whatsapp_phone_number') as whatsapp_phone_number,
    (SELECT setting_value = 'true' FROM system_settings WHERE setting_key = 'review_requests_enabled') as review_requests_enabled,
    (SELECT setting_value FROM system_settings WHERE setting_key = 'review_message_template') as review_message_template
  FROM system_settings 
  WHERE setting_key = 'whatsapp_enabled';
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_notification_settings() TO authenticated;
