-- Migration: Remove reason field from disabled_slots table
-- This script removes the reason field from existing disabled_slots tables

-- Step 1: Check if the reason column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'disabled_slots' 
        AND column_name = 'reason'
    ) THEN
        -- Step 2: Remove the reason column
        ALTER TABLE disabled_slots DROP COLUMN reason;
        RAISE NOTICE 'Removed reason column from disabled_slots table';
    ELSE
        RAISE NOTICE 'Reason column does not exist in disabled_slots table';
    END IF;
END $$;

-- Step 3: Verify the table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'disabled_slots'
ORDER BY ordinal_position;

-- Step 4: Show sample data (without reason field)
SELECT 
  id,
  clinic_id,
  date,
  start_time,
  end_time,
  created_at
FROM disabled_slots 
LIMIT 3;
