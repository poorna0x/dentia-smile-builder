-- =====================================================
-- 🔍 DIAGNOSE WHAT BROKE AFTER SECURITY FIXES
-- =====================================================
-- 
-- This script checks what's currently missing or broken
-- after the aggressive security linting fixes
-- =====================================================

SELECT '=== DIAGNOSING WHAT BROKE ===' as section;

-- =====================================================
-- 1. CHECK SYSTEM_SETTINGS TABLE
-- =====================================================

SELECT '=== CHECKING SYSTEM_SETTINGS ===' as section;

-- Check if system_settings table exists
SELECT 
    'system_settings table' as check_type,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'system_settings' AND table_schema = 'public') as exists,
    CASE 
        WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'system_settings' AND table_schema = 'public') 
        THEN '✅ Table exists'
        ELSE '❌ Table missing - this causes 406 errors'
    END as status;

-- Check if system_settings has data
SELECT 
    'system_settings data' as check_type,
    CASE 
        WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'system_settings' AND table_schema = 'public')
        THEN (SELECT COUNT(*) FROM system_settings)::text
        ELSE 'N/A - table missing'
    END as record_count;

-- Check RLS on system_settings
SELECT 
    'system_settings RLS' as check_type,
    CASE 
        WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'system_settings' AND table_schema = 'public')
        THEN (SELECT rowsecurity::text FROM pg_tables WHERE schemaname = 'public' AND tablename = 'system_settings')
        ELSE 'N/A - table missing'
    END as rls_enabled;

-- =====================================================
-- 2. CHECK PATIENT CREATION SYSTEM
-- =====================================================

SELECT '=== CHECKING PATIENT CREATION SYSTEM ===' as section;

-- Check if patients table exists
SELECT 
    'patients table' as check_type,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'patients' AND table_schema = 'public') as exists,
    CASE 
        WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'patients' AND table_schema = 'public') 
        THEN '✅ Table exists'
        ELSE '❌ Table missing - patient creation broken'
    END as status;

-- Check if patient_phones table exists
SELECT 
    'patient_phones table' as check_type,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'patient_phones' AND table_schema = 'public') as exists,
    CASE 
        WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'patient_phones' AND table_schema = 'public') 
        THEN '✅ Table exists'
        ELSE '❌ Table missing - patient phone management broken'
    END as status;

-- Check if find_or_create_patient function exists
SELECT 
    'find_or_create_patient function' as check_type,
    EXISTS(SELECT 1 FROM information_schema.routines WHERE routine_name = 'find_or_create_patient' AND routine_schema = 'public') as exists,
    CASE 
        WHEN EXISTS(SELECT 1 FROM information_schema.routines WHERE routine_name = 'find_or_create_patient' AND routine_schema = 'public') 
        THEN '✅ Function exists'
        ELSE '❌ Function missing - patient creation broken'
    END as status;

-- Check if auto_link_appointment_trigger exists
SELECT 
    'auto_link_appointment_trigger' as check_type,
    EXISTS(SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'auto_link_appointment_trigger' AND event_object_table = 'appointments') as exists,
    CASE 
        WHEN EXISTS(SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'auto_link_appointment_trigger' AND event_object_table = 'appointments') 
        THEN '✅ Trigger exists'
        ELSE '❌ Trigger missing - appointments not linked to patients'
    END as status;

-- =====================================================
-- 3. CHECK APPOINTMENTS TABLE STRUCTURE
-- =====================================================

SELECT '=== CHECKING APPOINTMENTS TABLE ===' as section;

-- Check if appointments has patient_id column
SELECT 
    'appointments patient_id column' as check_type,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'patient_id' AND table_schema = 'public') as exists,
    CASE 
        WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'patient_id' AND table_schema = 'public') 
        THEN '✅ Column exists'
        ELSE '❌ Column missing - appointments not linked to patients'
    END as status;

-- Check appointments with patient_id
SELECT 
    'appointments with patient_id' as check_type,
    COUNT(*) as total_appointments,
    COUNT(patient_id) as appointments_with_patient,
    COUNT(*) - COUNT(patient_id) as appointments_without_patient,
    CASE 
        WHEN COUNT(patient_id) = 0 THEN '❌ No appointments linked to patients'
        WHEN COUNT(*) - COUNT(patient_id) > 0 THEN '⚠️ Some appointments not linked'
        ELSE '✅ All appointments linked to patients'
    END as status
FROM appointments;

-- =====================================================
-- 4. CHECK RECENTLY DROPPED FUNCTIONS
-- =====================================================

SELECT '=== CHECKING RECENTLY DROPPED FUNCTIONS ===' as section;

-- List all functions that might be missing
SELECT 
    'missing functions check' as check_type,
    routine_name,
    CASE 
        WHEN EXISTS(SELECT 1 FROM information_schema.routines WHERE routine_name = routine_name AND routine_schema = 'public') 
        THEN '✅ Exists'
        ELSE '❌ Missing'
    END as status
FROM (VALUES 
    ('find_or_create_patient'),
    ('find_or_create_patient_improved'),
    ('auto_link_appointment_with_patient'),
    ('migrate_appointments_to_patients'),
    ('get_patient_by_phone')
) AS funcs(routine_name);

-- =====================================================
-- 5. CHECK TRIGGERS
-- =====================================================

SELECT '=== CHECKING TRIGGERS ===' as section;

-- List all triggers on appointments table
SELECT 
    'appointments triggers' as check_type,
    trigger_name,
    event_manipulation,
    action_timing,
    CASE 
        WHEN trigger_name = 'auto_link_appointment_trigger' THEN '✅ Patient linking trigger'
        ELSE 'ℹ️ Other trigger'
    END as description
FROM information_schema.triggers 
WHERE event_object_table = 'appointments'
AND event_object_schema = 'public';

-- =====================================================
-- 6. CHECK RLS POLICIES
-- =====================================================

SELECT '=== CHECKING RLS POLICIES ===' as section;

-- Check RLS policies on key tables
SELECT 
    'RLS policies' as check_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('system_settings', 'patients', 'patient_phones', 'appointments')
ORDER BY tablename, policyname;

-- =====================================================
-- 7. SUMMARY OF WHAT'S BROKEN
-- =====================================================

SELECT '=== SUMMARY OF WHAT BROKE ===' as section;

-- Create a summary of issues
WITH issues AS (
    SELECT 'system_settings table missing' as issue, 
           NOT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'system_settings' AND table_schema = 'public') as is_broken
    UNION ALL
    SELECT 'patients table missing' as issue,
           NOT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'patients' AND table_schema = 'public') as is_broken
    UNION ALL
    SELECT 'patient_phones table missing' as issue,
           NOT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'patient_phones' AND table_schema = 'public') as is_broken
    UNION ALL
    SELECT 'find_or_create_patient function missing' as issue,
           NOT EXISTS(SELECT 1 FROM information_schema.routines WHERE routine_name = 'find_or_create_patient' AND routine_schema = 'public') as is_broken
    UNION ALL
    SELECT 'auto_link_appointment_trigger missing' as issue,
           NOT EXISTS(SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'auto_link_appointment_trigger' AND event_object_table = 'appointments') as is_broken
    UNION ALL
    SELECT 'appointments patient_id column missing' as issue,
           NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'patient_id' AND table_schema = 'public') as is_broken
)
SELECT 
    'broken components' as check_type,
    issue,
    CASE 
        WHEN is_broken THEN '❌ BROKEN'
        ELSE '✅ WORKING'
    END as status
FROM issues
WHERE is_broken = true
ORDER BY issue;

-- =====================================================
-- 8. RECOMMENDATION
-- =====================================================

SELECT '=== RECOMMENDATION ===' as section;

SELECT 
    'next step' as check_type,
    CASE 
        WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'system_settings' AND table_schema = 'public')
        AND EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'patients' AND table_schema = 'public')
        AND EXISTS(SELECT 1 FROM information_schema.routines WHERE routine_name = 'find_or_create_patient' AND routine_schema = 'public')
        THEN '✅ Everything looks good - run the comprehensive fix script'
        ELSE '❌ Critical components missing - run the comprehensive fix script immediately'
    END as recommendation;
