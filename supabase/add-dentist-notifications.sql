-- Add dentist phone number to clinics table
ALTER TABLE clinics 
ADD COLUMN IF NOT EXISTS dentist_phone VARCHAR(20);

-- Update existing clinics with dentist phone numbers
UPDATE clinics 
SET dentist_phone = contact_phone 
WHERE dentist_phone IS NULL;

-- Update WhatsApp notification settings to include dentist notifications
UPDATE system_settings 
SET settings = '{"enabled": false, "phone_number": "", "send_confirmation": true, "send_reminders": false, "send_reviews": false, "reminder_hours": 24, "send_to_dentist": true}'::jsonb
WHERE setting_type = 'whatsapp_notifications';

-- Update the function to include dentist notification settings
DROP FUNCTION IF EXISTS get_notification_settings();

CREATE OR REPLACE FUNCTION get_notification_settings()
RETURNS TABLE (
  whatsapp_enabled BOOLEAN,
  whatsapp_phone_number TEXT,
  send_confirmation BOOLEAN,
  send_reminders BOOLEAN,
  send_reviews BOOLEAN,
  reminder_hours INTEGER,
  send_to_dentist BOOLEAN,
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
    (settings->>'send_to_dentist')::BOOLEAN as send_to_dentist,
    (SELECT (settings->>'enabled')::BOOLEAN FROM system_settings WHERE setting_type = 'review_requests') as review_requests_enabled,
    (SELECT (settings->>'message_template')::TEXT FROM system_settings WHERE setting_type = 'review_requests') as review_message_template
  FROM system_settings 
  WHERE setting_type = 'whatsapp_notifications';
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_notification_settings() TO authenticated;
