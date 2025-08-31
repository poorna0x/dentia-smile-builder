-- Fix minimum advance notice column name mismatch
-- The original schema has minimum_advance_notice_hours but the code expects minimum_advance_notice

-- First, check if the old column exists and has data
DO $$
BEGIN
    -- Check if minimum_advance_notice_hours column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'scheduling_settings' 
        AND column_name = 'minimum_advance_notice_hours'
    ) THEN
        -- Check if minimum_advance_notice column exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'scheduling_settings' 
            AND column_name = 'minimum_advance_notice'
        ) THEN
            -- Add the new column
            ALTER TABLE scheduling_settings 
            ADD COLUMN minimum_advance_notice INTEGER DEFAULT 24;
            
            -- Copy data from old column to new column
            UPDATE scheduling_settings 
            SET minimum_advance_notice = minimum_advance_notice_hours 
            WHERE minimum_advance_notice_hours IS NOT NULL;
            
            -- Drop the old column
            ALTER TABLE scheduling_settings 
            DROP COLUMN minimum_advance_notice_hours;
            
            RAISE NOTICE 'Migrated minimum_advance_notice_hours to minimum_advance_notice';
        ELSE
            RAISE NOTICE 'minimum_advance_notice column already exists';
        END IF;
    ELSE
        RAISE NOTICE 'minimum_advance_notice_hours column does not exist';
    END IF;
END $$;

-- Verify the column exists and has the correct name
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
