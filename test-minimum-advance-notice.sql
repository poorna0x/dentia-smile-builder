-- Test script to check minimum advance notice column status
-- Run this in your Supabase SQL editor to see the current state

-- Check if the column exists and what its name is
SELECT 
  column_name, 
  data_type, 
  column_default, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'scheduling_settings' 
AND (column_name LIKE '%minimum%' OR column_name LIKE '%advance%' OR column_name LIKE '%notice%');

-- Check current values in the scheduling_settings table
SELECT 
  c.name as clinic_name,
  ss.minimum_advance_notice,
  ss.minimum_advance_notice_hours,
  CASE 
    WHEN ss.minimum_advance_notice IS NOT NULL THEN 'minimum_advance_notice column exists'
    WHEN ss.minimum_advance_notice_hours IS NOT NULL THEN 'minimum_advance_notice_hours column exists'
    ELSE 'Neither column exists'
  END as column_status
FROM scheduling_settings ss
JOIN clinics c ON ss.clinic_id = c.id
ORDER BY c.name;

-- Show all columns in the scheduling_settings table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'scheduling_settings'
ORDER BY ordinal_position;
