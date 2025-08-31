-- Simple debug script to check minimum advance notice
-- Run this in Supabase SQL editor

-- 1. Check what columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'scheduling_settings' 
AND column_name LIKE '%minimum%';

-- 2. Check current values
SELECT 
  clinic_id,
  minimum_advance_notice,
  minimum_advance_notice_hours
FROM scheduling_settings;

-- 3. Check if there are any records
SELECT COUNT(*) as total_records FROM scheduling_settings;

-- 4. Show all columns in the table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'scheduling_settings'
ORDER BY ordinal_position;
