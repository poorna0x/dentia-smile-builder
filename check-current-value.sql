-- Check current minimum advance notice value
SELECT 
  clinic_id,
  minimum_advance_notice,
  updated_at
FROM scheduling_settings;
