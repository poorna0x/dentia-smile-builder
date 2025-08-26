-- Add minimum_advance_notice column to scheduling_settings table
-- This allows clinics to set how many hours in advance patients must book appointments

-- Add the column with a default value of 24 hours (1 day)
ALTER TABLE scheduling_settings 
ADD COLUMN IF NOT EXISTS minimum_advance_notice INTEGER DEFAULT 24;

-- Add a comment to explain the column
COMMENT ON COLUMN scheduling_settings.minimum_advance_notice IS 
'Minimum hours in advance that patients must book appointments (0 = immediate booking allowed)';

-- Update existing records to have the default value if they don't have it
UPDATE scheduling_settings 
SET minimum_advance_notice = 24 
WHERE minimum_advance_notice IS NULL;

-- Verify the column was added
SELECT 
  column_name, 
  data_type, 
  column_default, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'scheduling_settings' 
AND column_name = 'minimum_advance_notice';

-- Show current values
SELECT 
  c.name as clinic_name,
  ss.minimum_advance_notice,
  CASE 
    WHEN ss.minimum_advance_notice = 0 THEN 'Immediate booking allowed'
    WHEN ss.minimum_advance_notice < 24 THEN CONCAT(ss.minimum_advance_notice, ' hours advance notice')
    ELSE CONCAT(
      FLOOR(ss.minimum_advance_notice / 24), ' day(s) and ',
      ss.minimum_advance_notice % 24, ' hour(s) advance notice'
    )
  END as notice_description
FROM scheduling_settings ss
JOIN clinics c ON ss.clinic_id = c.id
ORDER BY c.name;
