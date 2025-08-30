-- =====================================================
-- 🔍 CHECK EXISTING TABLES AND FUNCTIONS
-- =====================================================

-- Check what tables exist
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'clinics',
  'appointments', 
  'dentists',
  'dental_treatments',
  'treatment_payments',
  'payment_transactions',
  'doctor_attributions',
  'analytics_cache'
)
ORDER BY table_name;

-- Check what functions exist
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
  'get_income_breakdown',
  'get_doctor_performance',
  'get_appointment_analytics',
  'get_treatment_analytics',
  'cache_analytics_data'
)
ORDER BY routine_name;

-- Check if update_updated_at_column function exists
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'update_updated_at_column';
