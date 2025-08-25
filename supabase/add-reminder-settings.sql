-- Add reminder settings to WhatsApp notifications
UPDATE system_settings 
SET settings = '{"enabled": false, "phone_number": "", "send_confirmation": true, "send_reminders": false, "send_reviews": false, "reminder_hours": 24}'::jsonb
WHERE setting_type = 'whatsapp_notifications';

-- Drop the existing function first
DROP FUNCTION IF EXISTS get_notification_settings();

-- Create the updated function to include reminder settings
CREATE OR REPLACE FUNCTION get_notification_settings()
RETURNS TABLE (
  whatsapp_enabled BOOLEAN,
  whatsapp_phone_number TEXT,
  send_confirmation BOOLEAN,
  send_reminders BOOLEAN,
  send_reviews BOOLEAN,
  reminder_hours INTEGER,
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
    (settings->>'send_confirmation')::BOOLEAN as send_confirmation,
    (settings->>'send_reminders')::BOOLEAN as send_reminders,
    (settings->>'send_reviews')::BOOLEAN as send_reviews,
    (settings->>'reminder_hours')::INTEGER as reminder_hours,
    (SELECT (settings->>'enabled')::BOOLEAN FROM system_settings WHERE setting_type = 'review_requests') as review_requests_enabled,
    (SELECT (settings->>'message_template')::TEXT FROM system_settings WHERE setting_type = 'review_requests') as review_message_template
  FROM system_settings 
  WHERE setting_type = 'whatsapp_notifications';
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_notification_settings() TO authenticated;
