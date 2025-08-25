-- 🔍 Check Function Signatures (Diagnostic)
-- =====================================================
-- 
-- This script checks the actual function signatures in the database
-- to see what parameters they currently have
-- =====================================================

-- Check add_lab_work_result function signature
SELECT 
  'add_lab_work_result' as function_name,
  p.proname,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'add_lab_work_result' 
  AND n.nspname = 'public';

-- Check create_prescription_with_history function signature
SELECT 
  'create_prescription_with_history' as function_name,
  p.proname,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'create_prescription_with_history' 
  AND n.nspname = 'public';

-- Check all functions mentioned in warnings
SELECT 
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname IN (
  'add_treatment_payment',
  'create_lab_work_order',
  'add_lab_work_result',
  'generate_lab_order_number',
  'is_same_person',
  'find_or_create_patient_improved',
  'create_prescription_with_history',
  'refill_prescription',
  'update_lab_work_status',
  'get_lab_work_orders',
  'get_active_prescriptions',
  'get_patient_by_phone',
  'find_or_create_patient'
)
  AND n.nspname = 'public'
ORDER BY p.proname;

-- Display completion message
SELECT 'Function Signature Check Complete!' as status;
