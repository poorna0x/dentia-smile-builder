-- 🔧 Fix Feature Toggles View - Compatible Version
-- =====================================================
-- 
-- This script fixes the SECURITY DEFINER issue with the feature_toggles view
-- using syntax compatible with older PostgreSQL versions
-- =====================================================

-- Drop the existing view
DROP VIEW IF EXISTS feature_toggles;

-- Recreate the view without security_invoker syntax (compatible with older PostgreSQL)
CREATE OR REPLACE VIEW feature_toggles AS
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
