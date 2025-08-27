-- Add dental numbering system to scheduling_settings table
-- Copy this entire script and paste it in Supabase SQL Editor

-- Add the dental_numbering_system column
ALTER TABLE scheduling_settings 
ADD COLUMN IF NOT EXISTS dental_numbering_system VARCHAR(20) DEFAULT 'universal' CHECK (dental_numbering_system IN ('universal', 'fdi'));

-- Update existing records to have the default value
UPDATE scheduling_settings 
SET dental_numbering_system = 'universal' 
WHERE dental_numbering_system IS NULL;

-- Insert default setting for existing clinics if they don't have scheduling_settings
INSERT INTO scheduling_settings (clinic_id, dental_numbering_system, day_schedules, notification_settings)
SELECT 
  c.id,
  'universal',
  '{}',
  '{"email_notifications": true, "reminder_hours": 24, "auto_confirm": true}'
FROM clinics c
WHERE NOT EXISTS (
  SELECT 1 FROM scheduling_settings ss WHERE ss.clinic_id = c.id
);

-- Show current settings for verification
SELECT 
  c.name as clinic_name,
  ss.dental_numbering_system,
  ss.updated_at
FROM clinics c
LEFT JOIN scheduling_settings ss ON c.id = ss.clinic_id
ORDER BY c.name;
