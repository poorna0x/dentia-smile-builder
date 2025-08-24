-- =====================================================
-- 🔍 DEBUG PATIENT SEARCH ERROR
-- =====================================================
-- 
-- This script helps debug the patient search error in PatientDataAccess.tsx
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Check if the function exists
SELECT '1. Checking if get_patient_by_phone function exists' as step;
SELECT 
    proname as function_name,
    proargtypes::regtype[] as argument_types,
    prorettype::regtype as return_type
FROM pg_proc 
WHERE proname = 'get_patient_by_phone';

-- 2. Check if the patient exists with the given phone number
SELECT '2. Checking if patient exists with phone 6361631253' as step;
SELECT 
    p.id as patient_id,
    p.first_name,
    p.last_name,
    p.clinic_id,
    pp.phone
FROM patients p
JOIN patient_phones pp ON p.id = pp.patient_id
WHERE pp.phone = '6361631253';

-- 3. Check if the clinic exists
SELECT '3. Checking if clinic exists' as step;
SELECT 
    id,
    name,
    created_at
FROM clinics 
WHERE id = 'c1ca557d-ca85-4905-beb7-c3985692d463';

-- 4. Test the function directly
SELECT '4. Testing get_patient_by_phone function' as step;
SELECT * FROM get_patient_by_phone('6361631253', 'c1ca557d-ca85-4905-beb7-c3985692d463');

-- 5. Check RLS policies on patients table
SELECT '5. Checking RLS policies on patients table' as step;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'patients';

-- 6. Check RLS policies on patient_phones table
SELECT '6. Checking RLS policies on patient_phones table' as step;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'patient_phones';

-- 7. Check if RLS is enabled on both tables
SELECT '7. Checking if RLS is enabled' as step;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('patients', 'patient_phones');

-- 8. Test with a simpler query to isolate the issue
SELECT '8. Testing simpler query' as step;
SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.clinic_id
FROM patients p
WHERE p.clinic_id = 'c1ca557d-ca85-4905-beb7-c3985692d463'
LIMIT 5;

-- 9. Test patient_phones table access
SELECT '9. Testing patient_phones table access' as step;
SELECT 
    patient_id,
    phone
FROM patient_phones 
WHERE phone = '6361631253'
LIMIT 5;

-- =====================================================
-- ✅ END DEBUG SCRIPT
-- =====================================================
