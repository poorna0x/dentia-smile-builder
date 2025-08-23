-- =====================================================
-- 🧪 TEST DATABASE FUNCTIONS
-- =====================================================
-- 
-- Run this in Supabase SQL Editor to test the new functions
-- =====================================================

-- Test 1: Check if functions exist
SELECT 
    'Function Check' as test_type,
    routine_name,
    routine_type,
    '✅ Function exists' as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'get_patient_by_phone',
    'get_patient_phones',
    'find_or_create_patient'
)
ORDER BY routine_name;

-- Test 2: Test get_patient_by_phone function
-- Replace '8105876772' with an actual phone number from your data
SELECT 
    'get_patient_by_phone Test' as test_type,
    patient_id,
    first_name,
    last_name,
    full_name,
    email,
    phone_count
FROM get_patient_by_phone('8105876772', 'c1ca557d-ca85-4905-beb7-c3985692d463');

-- Test 3: Test get_patient_phones function
-- Replace the UUID with an actual patient ID from your data
SELECT 
    'get_patient_phones Test' as test_type,
    phone,
    phone_type,
    is_primary,
    is_verified
FROM get_patient_phones('your-patient-id-here');

-- Test 4: Check patient_phones table structure
SELECT 
    'Table Structure' as test_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'patient_phones'
ORDER BY ordinal_position;

-- Test 5: Check if patient_phones table has data
SELECT 
    'Patient Phones Data' as test_type,
    COUNT(*) as total_records,
    COUNT(DISTINCT patient_id) as unique_patients,
    COUNT(DISTINCT phone) as unique_phones
FROM patient_phones;

-- Test 6: Check appointments with patient_id
SELECT 
    'Appointments Linking' as test_type,
    COUNT(*) as total_appointments,
    COUNT(patient_id) as linked_appointments,
    COUNT(*) - COUNT(patient_id) as unlinked_appointments
FROM appointments;

-- =====================================================
-- 🔧 TROUBLESHOOTING
-- =====================================================
-- 
-- If you get errors:
-- 
-- 1. Function not found: Run the main migration again
-- 2. Permission denied: Check RLS policies
-- 3. Invalid parameters: Check data types
-- 
-- =====================================================
