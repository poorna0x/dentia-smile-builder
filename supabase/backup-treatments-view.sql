-- 🔄 Backup and Revert Script for Treatments with Dentist View
-- =====================================================
-- 
-- This script provides backup information and revert options
-- for the treatments_with_dentist view security fix
-- =====================================================

-- Check current view definition (if it exists)
SELECT 
  schemaname,
  viewname,
  definition
FROM pg_views 
WHERE viewname = 'treatments_with_dentist';

-- Check view security settings
SELECT 
  schemaname,
  viewname,
  security_invoker
FROM pg_views 
WHERE viewname = 'treatments_with_dentist';

-- =====================================================
-- 🔄 REVERT OPTION (if needed)
-- =====================================================
-- 
-- If you need to revert back to SECURITY DEFINER, uncomment and run:
-- 
-- DROP VIEW IF EXISTS treatments_with_dentist;
-- 
-- CREATE OR REPLACE VIEW treatments_with_dentist 
-- WITH (security_definer = true) AS
-- SELECT 
--   dt.id,
--   dt.treatment_type,
--   dt.tooth_number,
--   dt.description,
--   dt.cost,
--   dt.status,
--   dt.treatment_date,
--   d.name as dentist_name,
--   CONCAT(p.first_name, ' ', p.last_name) as patient_name,
--   dt.created_at,
--   dt.clinic_id
-- FROM dental_treatments dt
-- LEFT JOIN dentists d ON dt.dentist_id = d.id
-- LEFT JOIN patients p ON dt.patient_id = p.id;
-- 
-- GRANT SELECT ON treatments_with_dentist TO authenticated;
-- 
-- =====================================================
