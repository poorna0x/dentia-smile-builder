-- 🔧 Simple View Cleanup
-- =====================================================
-- 
-- This script simply removes problematic views that are causing errors
-- No recreation, just cleanup
-- =====================================================

-- Remove the problematic treatments_with_dentist view
DROP VIEW IF EXISTS treatments_with_dentist;

-- Remove the problematic feature_toggles view (if it has security_invoker)
DROP VIEW IF EXISTS feature_toggles;

-- Display completion message
SELECT 'Problematic Views Removed!' as status;
