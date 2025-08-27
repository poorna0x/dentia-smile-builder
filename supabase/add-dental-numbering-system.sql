-- Add dental numbering system setting to scheduling_settings table
-- This allows clinics to choose between Universal (1-32) and FDI (18-11, 21-28, 48-41, 31-38) numbering systems

-- Add the dental_numbering_system column to scheduling_settings table
ALTER TABLE scheduling_settings 
ADD COLUMN IF NOT EXISTS dental_numbering_system VARCHAR(20) DEFAULT 'universal' CHECK (dental_numbering_system IN ('universal', 'fdi'));

-- Update existing records to have the default value
UPDATE scheduling_settings 
SET dental_numbering_system = 'universal' 
WHERE dental_numbering_system IS NULL;

-- Add comment to explain the column
COMMENT ON COLUMN scheduling_settings.dental_numbering_system IS 'Dental numbering system: universal (1-32) or fdi (18-11, 21-28, 48-41, 31-38)';

-- Create a function to get dental numbering system for a clinic
CREATE OR REPLACE FUNCTION get_dental_numbering_system(clinic_uuid UUID)
RETURNS VARCHAR(20) AS $$
BEGIN
  RETURN (
    SELECT dental_numbering_system 
    FROM scheduling_settings 
    WHERE clinic_id = clinic_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_dental_numbering_system(UUID) TO authenticated;

-- Create a function to update dental numbering system for a clinic
CREATE OR REPLACE FUNCTION update_dental_numbering_system(
  clinic_uuid UUID,
  numbering_system VARCHAR(20)
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Validate input
  IF numbering_system NOT IN ('universal', 'fdi') THEN
    RAISE EXCEPTION 'Invalid numbering system. Must be "universal" or "fdi"';
  END IF;

  -- Update the setting
  UPDATE scheduling_settings 
  SET 
    dental_numbering_system = numbering_system,
    updated_at = NOW()
  WHERE clinic_id = clinic_uuid;

  -- Return true if update was successful
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_dental_numbering_system(UUID, VARCHAR) TO authenticated;

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

-- Display current settings for verification
SELECT 
  c.name as clinic_name,
  ss.dental_numbering_system,
  ss.updated_at
FROM clinics c
LEFT JOIN scheduling_settings ss ON c.id = ss.clinic_id
ORDER BY c.name;
