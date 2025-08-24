-- Check and Fix RLS Issues for Patient Data Access
-- This script helps identify and fix RLS policy issues

-- 1. Check current RLS policies for relevant tables
SELECT 'Current RLS Policies' as info;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('dental_treatments', 'tooth_conditions', 'lab_work', 'patients', 'appointments', 'prescriptions')
ORDER BY tablename, policyname;

-- 2. Check if RLS is enabled on tables
SELECT 'RLS Status on Tables' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('dental_treatments', 'tooth_conditions', 'lab_work', 'patients', 'appointments', 'prescriptions')
ORDER BY tablename;

-- 3. Test direct queries without RLS (temporarily disable for testing)
-- Note: This is for debugging only - don't use in production

-- Test dental_treatments query
SELECT 'Testing dental_treatments query (with RLS)' as test_name;
SELECT COUNT(*) as treatments_count FROM dental_treatments;

-- Test tooth_conditions query  
SELECT 'Testing tooth_conditions query (with RLS)' as test_name;
SELECT COUNT(*) as conditions_count FROM tooth_conditions;

-- Test lab_work query
SELECT 'Testing lab_work query (with RLS)' as test_name;
SELECT COUNT(*) as lab_work_count FROM lab_work;

-- Test patients query
SELECT 'Testing patients query (with RLS)' as test_name;
SELECT COUNT(*) as patients_count FROM patients;

-- 4. Check if there are any clinics in the system
SELECT 'Clinics in system' as info;
SELECT id, name, contact_phone FROM clinics ORDER BY created_at DESC;

-- 5. Check if the get_patient_by_phone function exists and works
SELECT 'Testing get_patient_by_phone function' as info;
-- This will show if the function exists
SELECT 
    proname as function_name,
    prosrc as function_source
FROM pg_proc 
WHERE proname = 'get_patient_by_phone';

-- 6. Show sample data from each table (if any exists)
SELECT 'Sample dental_treatments data' as info;
SELECT 
    id, patient_id, clinic_id, tooth_number, treatment_type, treatment_status
FROM dental_treatments 
LIMIT 5;

SELECT 'Sample tooth_conditions data' as info;
SELECT 
    id, patient_id, clinic_id, tooth_number, condition_type, severity
FROM tooth_conditions 
LIMIT 5;

SELECT 'Sample lab_work data' as info;
SELECT 
    id, patient_id, clinic_id, work_type, status, order_date
FROM lab_work 
LIMIT 5;

-- 7. Check for any data inconsistencies
SELECT 'Data consistency check' as info;
SELECT 
    'dental_treatments' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT patient_id) as unique_patients,
    COUNT(DISTINCT clinic_id) as unique_clinics
FROM dental_treatments
UNION ALL
SELECT 
    'tooth_conditions' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT patient_id) as unique_patients,
    COUNT(DISTINCT clinic_id) as unique_clinics
FROM tooth_conditions
UNION ALL
SELECT 
    'lab_work' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT patient_id) as unique_patients,
    COUNT(DISTINCT clinic_id) as unique_clinics
FROM lab_work;
