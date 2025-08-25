-- 🔧 Fix Feature Toggles View Security Issue
-- =====================================================
-- 
-- This script fixes the SECURITY DEFINER issue with the feature_toggles view
-- by recreating it with SECURITY INVOKER
-- =====================================================

-- Drop the existing view
DROP VIEW IF EXISTS feature_toggles;

-- Recreate the view with SECURITY INVOKER (explicit)
CREATE OR REPLACE VIEW feature_toggles 
WITH (security_invoker = true) AS
SELECT 
  key as feature_name,
  value as is_enabled
FROM system_settings,
     jsonb_each(settings)
WHERE setting_type = 'feature_toggle';

-- Grant access to the view
GRANT SELECT ON feature_toggles TO authenticated;

-- Display completion message
SELECT 'Feature Toggles View Security Fix Complete!' as status;
