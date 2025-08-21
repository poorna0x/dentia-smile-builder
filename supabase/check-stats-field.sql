-- Check if show_stats_cards field exists in scheduling_settings table
-- Run this to verify the migration was successful

-- Check table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'scheduling_settings' 
  AND column_name = 'show_stats_cards';

-- Check if any records have this field
SELECT 
  clinic_id,
  show_stats_cards,
  created_at
FROM scheduling_settings 
LIMIT 3;
