-- 🔍 Check Function Search Paths (Diagnostic)
-- =====================================================
-- 
-- This script checks the current search_path settings for all functions
-- to see which ones still need to be fixed
-- =====================================================

-- Check search_path for specific functions mentioned in warnings
SELECT 
  'add_treatment_payment' as function_name,
  prosrc LIKE '%SET search_path%' as has_search_path_set
FROM pg_proc 
WHERE proname = 'add_treatment_payment' 
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

SELECT 
  'create_lab_work_order' as function_name,
  prosrc LIKE '%SET search_path%' as has_search_path_set
FROM pg_proc 
WHERE proname = 'create_lab_work_order' 
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

SELECT 
  'add_lab_work_result' as function_name,
  prosrc LIKE '%SET search_path%' as has_search_path_set
FROM pg_proc 
WHERE proname = 'add_lab_work_result' 
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

SELECT 
  'generate_lab_order_number' as function_name,
  prosrc LIKE '%SET search_path%' as has_search_path_set
FROM pg_proc 
WHERE proname = 'generate_lab_order_number' 
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

SELECT 
  'is_same_person' as function_name,
  prosrc LIKE '%SET search_path%' as has_search_path_set
FROM pg_proc 
WHERE proname = 'is_same_person' 
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

SELECT 
  'find_or_create_patient_improved' as function_name,
  prosrc LIKE '%SET search_path%' as has_search_path_set
FROM pg_proc 
WHERE proname = 'find_or_create_patient_improved' 
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

SELECT 
  'create_prescription_with_history' as function_name,
  prosrc LIKE '%SET search_path%' as has_search_path_set
FROM pg_proc 
WHERE proname = 'create_prescription_with_history' 
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

SELECT 
  'refill_prescription' as function_name,
  prosrc LIKE '%SET search_path%' as has_search_path_set
FROM pg_proc 
WHERE proname = 'refill_prescription' 
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

SELECT 
  'update_lab_work_status' as function_name,
  prosrc LIKE '%SET search_path%' as has_search_path_set
FROM pg_proc 
WHERE proname = 'update_lab_work_status' 
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

SELECT 
  'get_lab_work_orders' as function_name,
  prosrc LIKE '%SET search_path%' as has_search_path_set
FROM pg_proc 
WHERE proname = 'get_lab_work_orders' 
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

SELECT 
  'get_active_prescriptions' as function_name,
  prosrc LIKE '%SET search_path%' as has_search_path_set
FROM pg_proc 
WHERE proname = 'get_active_prescriptions' 
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

SELECT 
  'get_patient_by_phone' as function_name,
  prosrc LIKE '%SET search_path%' as has_search_path_set
FROM pg_proc 
WHERE proname = 'get_patient_by_phone' 
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

SELECT 
  'find_or_create_patient' as function_name,
  prosrc LIKE '%SET search_path%' as has_search_path_set
FROM pg_proc 
WHERE proname = 'find_or_create_patient' 
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Summary
SELECT 'Diagnostic Complete - Check results above' as status;
