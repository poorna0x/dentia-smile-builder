-- 🔧 Remove Problematic Views
-- =====================================================
-- 
-- This script removes the problematic views that are causing errors
-- Since your application doesn't use these views, removing them is the simplest solution
-- =====================================================

-- =====================================================
-- STEP 1: REMOVE TREATMENTS WITH DENTIST VIEW
-- =====================================================

-- Check if the view exists
SELECT 
  'treatments_with_dentist' as view_name,
  COUNT(*) as exists_count
FROM pg_views 
WHERE viewname = 'treatments_with_dentist';

-- Drop the view if it exists
DROP VIEW IF EXISTS treatments_with_dentist;

-- =====================================================
-- STEP 2: FIX FEATURE TOGGLES VIEW
-- =====================================================

-- Drop the existing feature_toggles view
DROP VIEW IF EXISTS feature_toggles;

-- Recreate feature_toggles view without security_invoker syntax
CREATE OR REPLACE VIEW feature_toggles AS
SELECT 
  key as feature_name,
  value as is_enabled
FROM system_settings,
     jsonb_each(settings)
WHERE setting_type = 'feature_toggle';

-- Grant access to the view
GRANT SELECT ON feature_toggles TO authenticated;

-- =====================================================
-- STEP 3: VERIFICATION
-- =====================================================

-- Check final status
SELECT 
  'treatments_with_dentist' as view_name,
  COUNT(*) as exists_count
FROM pg_views 
WHERE viewname = 'treatments_with_dentist'

UNION ALL

SELECT 
  'feature_toggles' as view_name,
  COUNT(*) as exists_count
FROM pg_views 
WHERE viewname = 'feature_toggles';

-- Display completion message
SELECT 'Problematic Views Fixed!' as status;
