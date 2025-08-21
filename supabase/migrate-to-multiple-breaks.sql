-- Migration script to support multiple breaks
-- Run this in your Supabase SQL Editor

-- Update existing day_schedules to convert single break strings to arrays
UPDATE scheduling_settings 
SET day_schedules = (
  SELECT jsonb_object_agg(
    day_key,
    CASE 
      WHEN day_value ? 'break_start' AND jsonb_typeof(day_value->'break_start') = 'string' THEN
        day_value || jsonb_build_object(
          'break_start', jsonb_build_array(day_value->>'break_start'),
          'break_end', jsonb_build_array(day_value->>'break_end')
        )
      ELSE day_value
    END
  )
  FROM jsonb_each(day_schedules) AS days(day_key, day_value)
)
WHERE day_schedules IS NOT NULL;

-- Verify the migration
SELECT 
  clinic_id,
  day_schedules
FROM scheduling_settings 
LIMIT 5;
