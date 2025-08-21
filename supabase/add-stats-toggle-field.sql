-- Migration: Add show_stats_cards field to scheduling_settings table
-- This allows users to toggle the visibility of stats cards on the admin dashboard

-- Add the new column to the scheduling_settings table
ALTER TABLE scheduling_settings 
ADD COLUMN show_stats_cards BOOLEAN DEFAULT true;

-- Update existing records to have show_stats_cards = true (so stats are shown by default)
UPDATE scheduling_settings 
SET show_stats_cards = true 
WHERE show_stats_cards IS NULL;

-- Add a comment to document the new field
COMMENT ON COLUMN scheduling_settings.show_stats_cards IS 'Controls whether stats cards (total, completed, cancelled appointments) are shown on the admin dashboard';

-- Verify the migration
SELECT 
  clinic_id,
  show_stats_cards,
  created_at
FROM scheduling_settings 
LIMIT 5;
