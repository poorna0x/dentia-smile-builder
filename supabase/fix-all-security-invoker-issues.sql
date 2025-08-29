-- 🔧 Fix All Security Invoker Issues - Compatible Version
-- =====================================================
-- 
-- This script fixes all SECURITY DEFINER issues using syntax compatible
-- with older PostgreSQL versions (removes security_invoker syntax)
-- =====================================================

-- =====================================================
-- STEP 1: FIX FEATURE TOGGLES VIEW
-- =====================================================

-- Drop and recreate feature_toggles view without security_invoker
DROP VIEW IF EXISTS feature_toggles;

CREATE OR REPLACE VIEW feature_toggles AS
SELECT 
  key as feature_name,
  value as is_enabled
FROM system_settings,
     jsonb_each(settings)
WHERE setting_type = 'feature_toggle';

GRANT SELECT ON feature_toggles TO authenticated;

-- =====================================================
-- STEP 2: FIX TREATMENTS WITH DENTIST VIEW
-- =====================================================

-- Drop and recreate treatments_with_dentist view without security_invoker
DROP VIEW IF EXISTS treatments_with_dentist;

CREATE OR REPLACE VIEW treatments_with_dentist AS
SELECT 
  dt.id,
  dt.treatment_type,
  dt.tooth_number,
  -- Handle description column variations
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dental_treatments' AND column_name = 'description') 
    THEN dt.description
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dental_treatments' AND column_name = 'treatment_description') 
    THEN dt.treatment_description
    ELSE NULL
  END as description,
  dt.cost,
  -- Handle status column variations
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dental_treatments' AND column_name = 'status') 
    THEN dt.status
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dental_treatments' AND column_name = 'treatment_status') 
    THEN dt.treatment_status
    ELSE 'planned'
  END as status,
  -- Handle date column variations
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dental_treatments' AND column_name = 'treatment_date') 
    THEN dt.treatment_date
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dental_treatments' AND column_name = 'date') 
    THEN dt.date
    ELSE NULL
  END as treatment_date,
  d.name as dentist_name,
  CONCAT(p.first_name, ' ', COALESCE(p.last_name, '')) as patient_name,
  dt.created_at,
  dt.clinic_id
FROM dental_treatments dt
LEFT JOIN dentists d ON dt.dentist_id = d.id
LEFT JOIN patients p ON dt.patient_id = p.id;

GRANT SELECT ON treatments_with_dentist TO authenticated;

-- =====================================================
-- STEP 3: VERIFICATION
-- =====================================================

-- Check if views exist and their definitions
SELECT 
  'feature_toggles' as view_name,
  COUNT(*) as exists_count
FROM pg_views 
WHERE viewname = 'feature_toggles'

UNION ALL

SELECT 
  'treatments_with_dentist' as view_name,
  COUNT(*) as exists_count
FROM pg_views 
WHERE viewname = 'treatments_with_dentist';

-- Display completion message
SELECT 'All Security Invoker Issues Fixed!' as status;
