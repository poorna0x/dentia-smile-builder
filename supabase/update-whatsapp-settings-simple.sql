-- Update WhatsApp notification settings to remove API key (now using environment variables only)
UPDATE system_settings 
SET settings = '{"enabled": false, "phone_number": ""}'::jsonb
WHERE setting_type = 'whatsapp_notifications';

-- Drop the existing function first
DROP FUNCTION IF EXISTS get_notification_settings();

-- Create the updated function to remove API key field
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
