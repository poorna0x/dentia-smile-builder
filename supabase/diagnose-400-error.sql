-- =====================================================
-- 🔍 DIAGNOSE 400 ERROR
-- =====================================================
-- 
-- This script checks what might be causing the 400 error
-- =====================================================

SELECT '=== DIAGNOSING 400 ERROR ===' as section;

-- =====================================================
-- 1. CHECK SYSTEM SETTINGS TABLE
-- =====================================================

-- Check if system_settings table exists and has correct structure
SELECT 
    'system_settings table check' as check_type,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'system_settings'
    ) as table_exists;

-- Check system_settings structure
SELECT 
    'system_settings structure' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'system_settings'
ORDER BY ordinal_position;

-- Check system_settings data
SELECT 
    'system_settings data' as check_type,
    COUNT(*) as total_settings
FROM system_settings;

-- Check feature toggles
SELECT 
    'feature toggles' as check_type,
    setting_type,
    settings
FROM system_settings 
WHERE setting_type = 'feature_toggle';

-- =====================================================
-- 2. CHECK PATIENT CREATION SYSTEM
-- =====================================================

-- Check if patients table exists
SELECT 
    'patients table check' as check_type,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'patients'
    ) as table_exists;

-- Check patients table structure
SELECT 
    'patients structure' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'patients'
ORDER BY ordinal_position;

-- Check patient_phones table
SELECT 
    'patient_phones table check' as check_type,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'patient_phones'
    ) as table_exists;

-- =====================================================
-- 3. CHECK APPOINTMENT PATIENT LINKING
-- =====================================================

-- Check if appointments table has patient_id column
SELECT 
    'appointments patient_id check' as check_type,
    EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments'
        AND column_name = 'patient_id'
    ) as patient_id_exists;

-- Check appointments without patient_id
SELECT 
    'appointments without patient_id' as check_type,
    COUNT(*) as count
FROM appointments 
WHERE patient_id IS NULL;

-- =====================================================
-- 4. CHECK PATIENT CREATION FUNCTIONS
-- =====================================================

-- Check if find_or_create_patient function exists
SELECT 
    'find_or_create_patient function' as check_type,
    EXISTS (
        SELECT FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname = 'find_or_create_patient'
    ) as function_exists;

-- Check if auto_link_appointment_with_patient function exists
SELECT 
    'auto_link_appointment_with_patient function' as check_type,
    EXISTS (
        SELECT FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname = 'auto_link_appointment_with_patient'
    ) as function_exists;

-- Check if auto_link_appointment_trigger exists
SELECT 
    'auto_link_appointment_trigger' as check_type,
    EXISTS (
        SELECT FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public'
        AND c.relname = 'appointments'
        AND t.tgname = 'auto_link_appointment_trigger'
    ) as trigger_exists;

-- =====================================================
-- 5. CHECK PAYMENT SYSTEM
-- =====================================================

-- Check payment tables
SELECT 
    'payment tables check' as check_type,
    table_name,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = table_name
    ) as exists
FROM (VALUES 
    ('treatment_payments'),
    ('payment_transactions')
) AS t(table_name);

-- Check payment_transactions structure
SELECT 
    'payment_transactions structure' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'payment_transactions'
ORDER BY ordinal_position;

-- Check treatment_payments structure
SELECT 
    'treatment_payments structure' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'treatment_payments'
ORDER BY ordinal_position;

-- =====================================================
-- 6. CHECK RLS POLICIES
-- =====================================================

-- Check RLS on key tables
SELECT 
    'RLS policies check' as check_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('system_settings', 'patients', 'appointments', 'treatment_payments', 'payment_transactions')
ORDER BY tablename;

-- Check policies on system_settings
SELECT 
    'system_settings policies' as check_type,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'system_settings';

-- =====================================================
-- 7. CHECK RECENT ERRORS
-- =====================================================

-- Check for any recent errors in logs (if available)
SELECT 
    'recent errors check' as check_type,
    'Check Supabase logs for recent 400 errors' as note;

-- =====================================================
-- 8. TEST API ENDPOINTS
-- =====================================================

-- Test system_settings query
SELECT 
    'system_settings API test' as check_type,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Data available'
        ELSE '❌ No data found'
    END as status,
    COUNT(*) as count
FROM system_settings 
WHERE setting_type = 'feature_toggle';

-- Test patients query
SELECT 
    'patients API test' as check_type,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Data available'
        ELSE '❌ No data found'
    END as status,
    COUNT(*) as count
FROM patients 
WHERE clinic_id = 'c1ca557d-ca85-4905-beb7-c3985692d463'
LIMIT 1;

-- =====================================================
-- 9. RECOMMENDATIONS
-- =====================================================

SELECT '=== RECOMMENDATIONS ===' as section;

-- Check what needs to be fixed
SELECT 
    'fixes needed' as check_type,
    CASE 
        WHEN NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'system_settings')
        THEN '❌ system_settings table missing - run fix-system-settings-406.sql'
        WHEN NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'patients')
        THEN '❌ patients table missing - run fix-system-settings-and-patient-creation.sql'
        WHEN NOT EXISTS (SELECT FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'find_or_create_patient')
        THEN '❌ find_or_create_patient function missing - run fix-system-settings-and-patient-creation.sql'
        WHEN EXISTS (SELECT FROM appointments WHERE patient_id IS NULL)
        THEN '❌ Appointments without patient_id - run migrate_appointments_to_patients()'
        ELSE '✅ All systems appear to be working'
    END as status;

-- =====================================================
-- 10. SUCCESS MESSAGE
-- =====================================================

SELECT '🔍 400 error diagnosis complete! Check the results above.' as status;
