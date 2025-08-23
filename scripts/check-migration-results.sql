-- =====================================================
-- 📊 CHECK MIGRATION RESULTS
-- =====================================================
-- 
-- Run this in Supabase SQL Editor to see what changed
-- =====================================================

-- 1. Check appointment linking results
SELECT 
    'Appointment Linking Results' as check_type,
    COUNT(*) as total_appointments,
    COUNT(patient_id) as linked_appointments,
    COUNT(*) - COUNT(patient_id) as unlinked_appointments,
    ROUND((COUNT(patient_id)::DECIMAL / COUNT(*)) * 100, 2) as link_percentage
FROM appointments;

-- 2. Check patient phones migration
SELECT 
    'Patient Phones Migration' as check_type,
    COUNT(DISTINCT p.id) as total_patients,
    COUNT(pp.phone) as total_phones,
    COUNT(DISTINCT pp.patient_id) as patients_with_phones,
    ROUND((COUNT(DISTINCT pp.patient_id)::DECIMAL / COUNT(DISTINCT p.id)) * 100, 2) as phone_coverage_percentage
FROM patients p
LEFT JOIN patient_phones pp ON p.id = pp.patient_id;

-- 3. Check patients with multiple phones
SELECT 
    'Multiple Phones per Patient' as check_type,
    p.first_name,
    p.last_name,
    COUNT(pp.phone) as phone_count,
    STRING_AGG(pp.phone, ', ') as phones
FROM patients p
LEFT JOIN patient_phones pp ON p.id = pp.patient_id
GROUP BY p.id, p.first_name, p.last_name
HAVING COUNT(pp.phone) > 1
ORDER BY phone_count DESC
LIMIT 10;

-- 4. Check linked appointments with patient info
SELECT 
    'Linked Appointments Sample' as check_type,
    a.name as appointment_name,
    a.phone as appointment_phone,
    p.first_name,
    p.last_name,
    CONCAT(p.first_name, ' ', COALESCE(p.last_name, '')) as patient_full_name,
    a.date,
    a.status
FROM appointments a
LEFT JOIN patients p ON a.patient_id = p.id
WHERE a.patient_id IS NOT NULL
ORDER BY a.created_at DESC
LIMIT 10;

-- 5. Check unlinked appointments (if any)
SELECT 
    'Unlinked Appointments' as check_type,
    COUNT(*) as count,
    STRING_AGG(name, ', ') as sample_names
FROM appointments 
WHERE patient_id IS NULL
GROUP BY 'Unlinked Appointments';

-- 6. Check database functions
SELECT 
    'Database Functions' as check_type,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'find_or_create_patient',
    'migrate_appointments_to_patients',
    'get_patient_by_phone',
    'get_patient_phones',
    'auto_link_appointment_with_patient'
)
ORDER BY routine_name;

-- 7. Check triggers
SELECT 
    'Database Triggers' as check_type,
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
AND trigger_name LIKE '%appointment%'
ORDER BY trigger_name;

-- =====================================================
-- 🎯 SUMMARY
-- =====================================================
-- 
-- This will show you:
-- • How many appointments were linked
-- • How many patients have phone numbers
-- • Patients with multiple phones
-- • Sample of linked appointments
-- • Any unlinked appointments
-- • Database functions and triggers created
-- 
-- =====================================================
