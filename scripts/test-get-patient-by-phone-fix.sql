-- =====================================================
-- ✅ TEST GET_PATIENT_BY_PHONE FIX
-- =====================================================
-- 
-- This script tests the fixed get_patient_by_phone function
-- Run this in Supabase SQL Editor after applying the fix
-- =====================================================

-- 1. Test the function with the problematic phone number
SELECT '1. Testing with phone 6361631253' as test_step;
SELECT * FROM get_patient_by_phone('6361631253', 'c1ca557d-ca85-4905-beb7-c3985692d463');

-- 2. Test with another phone number to ensure it works
SELECT '2. Testing with another phone number' as test_step;
SELECT * FROM get_patient_by_phone('8105876772', 'c1ca557d-ca85-4905-beb7-c3985692d463');

-- 3. Test with a non-existent phone number
SELECT '3. Testing with non-existent phone number' as test_step;
SELECT * FROM get_patient_by_phone('9999999999', 'c1ca557d-ca85-4905-beb7-c3985692d463');

-- 4. Check function signature
SELECT '4. Checking function signature' as test_step;
SELECT 
    proname as function_name,
    proargtypes::regtype[] as argument_types,
    prorettype::regtype as return_type
FROM pg_proc 
WHERE proname = 'get_patient_by_phone';

-- =====================================================
-- ✅ END TEST SCRIPT
-- =====================================================
