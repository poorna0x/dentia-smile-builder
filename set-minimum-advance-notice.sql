-- Script to manually set minimum advance notice for testing
-- Run this in Supabase SQL editor

-- First, let's see what we have
SELECT * FROM scheduling_settings;

-- Add the correct column if it doesn't exist
ALTER TABLE scheduling_settings 
ADD COLUMN IF NOT EXISTS minimum_advance_notice INTEGER DEFAULT 24;

-- Update the value to 3 hours for testing
UPDATE scheduling_settings 
SET minimum_advance_notice = 3
WHERE clinic_id IN (SELECT id FROM clinics LIMIT 1);

-- Verify the update
SELECT 
  c.name as clinic_name,
  ss.minimum_advance_notice,
  ss.minimum_advance_notice_hours
FROM scheduling_settings ss
JOIN clinics c ON ss.clinic_id = c.id;
