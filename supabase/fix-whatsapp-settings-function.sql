-- Fix WhatsApp Notification Settings Function
-- This script updates the get_notification_settings function to match the TypeScript interface

-- Drop the existing function
DROP FUNCTION IF EXISTS get_notification_settings();

-- Create the corrected function
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
    COALESCE((settings->>'enabled')::BOOLEAN, false) as whatsapp_enabled,
    COALESCE((settings->>'phone_number')::TEXT, '') as whatsapp_phone_number,
    COALESCE((settings->>'send_confirmation')::BOOLEAN, false) as send_confirmation,
    COALESCE((settings->>'send_reminders')::BOOLEAN, false) as send_reminders,
    COALESCE((settings->>'send_reviews')::BOOLEAN, false) as send_reviews,
    COALESCE((settings->>'reminder_hours')::INTEGER, 24) as reminder_hours,
    COALESCE((settings->>'send_to_dentist')::BOOLEAN, false) as send_to_dentist,
    COALESCE((SELECT (settings->>'enabled')::BOOLEAN FROM system_settings WHERE setting_type = 'review_requests'), false) as review_requests_enabled,
    COALESCE((SELECT (settings->>'message_template')::TEXT FROM system_settings WHERE setting_type = 'review_requests'), 'Thank you for choosing our clinic! Please share your experience: {review_link}') as review_message_template
  FROM system_settings 
  WHERE setting_type = 'whatsapp_notifications';
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_notification_settings() TO authenticated;

-- Update the WhatsApp settings to include all required fields
UPDATE system_settings 
SET settings = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          COALESCE(settings, '{}'::jsonb),
          '{send_confirmation}',
          'true'::jsonb
        ),
        '{send_reminders}',
        'true'::jsonb
      ),
      '{send_reviews}',
      'true'::jsonb
    ),
    '{reminder_hours}',
    '24'::jsonb
  ),
  '{send_to_dentist}',
  'true'::jsonb
)
WHERE setting_type = 'whatsapp_notifications';

-- Test the function
SELECT '=== TESTING get_notification_settings FUNCTION ===' as test_section;

SELECT * FROM get_notification_settings();

SELECT '=== FUNCTION FIXED ===' as completion_message;
