-- Comprehensive Migration: Ensure show_stats_cards field exists for ALL clinics
-- This script ensures that all existing and future clinics have the show_stats_cards field

-- Step 1: Add the column if it doesn't exist (safe to run multiple times)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'scheduling_settings' 
        AND column_name = 'show_stats_cards'
    ) THEN
        ALTER TABLE scheduling_settings ADD COLUMN show_stats_cards BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added show_stats_cards column to scheduling_settings table';
    ELSE
        RAISE NOTICE 'show_stats_cards column already exists';
    END IF;
END $$;

-- Step 2: Update any existing records that have NULL values
UPDATE scheduling_settings 
SET show_stats_cards = true 
WHERE show_stats_cards IS NULL;

-- Step 3: Add a comment to document the field
COMMENT ON COLUMN scheduling_settings.show_stats_cards IS 'Controls whether stats cards (total, completed, cancelled appointments) are shown on the admin dashboard';

-- Step 4: Verify all clinics have the field
SELECT 
  c.name as clinic_name,
  c.slug,
  ss.show_stats_cards,
  CASE 
    WHEN ss.show_stats_cards IS NULL THEN '❌ Missing'
    WHEN ss.show_stats_cards = true THEN '✅ Enabled'
    WHEN ss.show_stats_cards = false THEN '❌ Disabled'
  END as status
FROM clinics c
LEFT JOIN scheduling_settings ss ON c.id = ss.clinic_id
ORDER BY c.created_at;

-- Step 5: Show summary
SELECT 
  COUNT(*) as total_clinics,
  COUNT(ss.id) as clinics_with_settings,
  COUNT(CASE WHEN ss.show_stats_cards = true THEN 1 END) as stats_enabled,
  COUNT(CASE WHEN ss.show_stats_cards = false THEN 1 END) as stats_disabled
FROM clinics c
LEFT JOIN scheduling_settings ss ON c.id = ss.clinic_id;
