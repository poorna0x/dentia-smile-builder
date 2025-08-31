-- Set minimum advance notice to 3 hours for testing
UPDATE scheduling_settings 
SET minimum_advance_notice = 3;

-- Verify the update
SELECT 
  clinic_id,
  minimum_advance_notice
FROM scheduling_settings;
