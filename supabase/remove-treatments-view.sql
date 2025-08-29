-- 🔧 Remove Treatments with Dentist View
-- =====================================================
-- 
-- This script removes the treatments_with_dentist view that's causing
-- the SECURITY DEFINER error. Since your application doesn't use this view,
-- removing it is the simplest solution.
-- =====================================================

-- Check if the view exists
SELECT 
  schemaname,
  viewname,
  definition
FROM pg_views 
WHERE viewname = 'treatments_with_dentist';

-- Drop the view if it exists
DROP VIEW IF EXISTS treatments_with_dentist;

-- Verify the view is gone
SELECT 
  'View removed successfully' as status,
  COUNT(*) as remaining_views
FROM pg_views 
WHERE viewname = 'treatments_with_dentist';

-- Display completion message
SELECT 'Treatments with Dentist View Removed!' as status;
