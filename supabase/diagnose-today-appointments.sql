-- =====================================================
-- 🔍 DIAGNOSE TODAY'S APPOINTMENTS
-- =====================================================
-- 
-- This script checks why today's appointments are not being found
-- in the AdminPatientManagement component
-- =====================================================

SELECT '=== DIAGNOSING TODAY APPOINTMENTS ===' as section;

-- =====================================================
-- 1. CHECK TODAY'S DATE
-- =====================================================

SELECT 
    'today date' as check_type,
    CURRENT_DATE as today_date,
    CURRENT_DATE::text as today_text,
    to_char(CURRENT_DATE, 'YYYY-MM-DD') as today_formatted;

-- =====================================================
-- 2. CHECK APPOINTMENTS FOR TODAY
-- =====================================================

-- Check all appointments for today
SELECT 
    'appointments today' as check_type,
    COUNT(*) as total_appointments_today
FROM appointments 
WHERE date = CURRENT_DATE;

-- Check appointments by status for today
SELECT 
    'appointments by status today' as check_type,
    status,
    COUNT(*) as count
FROM appointments 
WHERE date = CURRENT_DATE
GROUP BY status
ORDER BY status;

-- Check appointments with patient_id for today
SELECT 
    'appointments with patient_id today' as check_type,
    COUNT(*) as appointments_with_patient_id,
    COUNT(patient_id) as appointments_with_patient_id_not_null,
    COUNT(*) - COUNT(patient_id) as appointments_without_patient_id
FROM appointments 
WHERE date = CURRENT_DATE;

-- Show sample appointments for today
SELECT 
    'sample appointments today' as check_type,
    id,
    name,
    phone,
    email,
    date,
    time,
    status,
    patient_id,
    clinic_id
FROM appointments 
WHERE date = CURRENT_DATE
ORDER BY time
LIMIT 5;

-- =====================================================
-- 3. CHECK PATIENT LINKING
-- =====================================================

-- Check if appointments have patient_id
SELECT 
    'patient linking status' as check_type,
    COUNT(*) as total_appointments,
    COUNT(patient_id) as appointments_with_patient,
    COUNT(*) - COUNT(patient_id) as appointments_without_patient,
    ROUND((COUNT(patient_id)::float / COUNT(*)::float) * 100, 2) as percentage_linked
FROM appointments;

-- Check appointments without patient_id
SELECT 
    'appointments without patient_id' as check_type,
    id,
    name,
    phone,
    email,
    date,
    time,
    status,
    clinic_id
FROM appointments 
WHERE patient_id IS NULL
ORDER BY date DESC, time
LIMIT 10;

-- =====================================================
-- 4. CHECK PATIENTS TABLE
-- =====================================================

-- Check if patients table exists and has data
SELECT 
    'patients table check' as check_type,
    COUNT(*) as total_patients
FROM patients;

-- Check patients with appointments today
SELECT 
    'patients with appointments today' as check_type,
    p.id,
    p.first_name,
    p.last_name,
    p.phone,
    p.email,
    COUNT(a.id) as appointment_count
FROM patients p
LEFT JOIN appointments a ON p.id = a.patient_id AND a.date = CURRENT_DATE
WHERE p.clinic_id = 'c1ca557d-ca85-4905-beb7-c3985692d463'
GROUP BY p.id, p.first_name, p.last_name, p.phone, p.email
HAVING COUNT(a.id) > 0
ORDER BY appointment_count DESC
LIMIT 10;

-- =====================================================
-- 5. CHECK CLINIC APPOINTMENTS
-- =====================================================

-- Check appointments for the specific clinic
SELECT 
    'clinic appointments today' as check_type,
    clinic_id,
    COUNT(*) as appointment_count
FROM appointments 
WHERE date = CURRENT_DATE
GROUP BY clinic_id;

-- Check all appointments for the clinic (not just today)
SELECT 
    'all clinic appointments' as check_type,
    clinic_id,
    COUNT(*) as total_appointments,
    COUNT(CASE WHEN date = CURRENT_DATE THEN 1 END) as today_appointments,
    COUNT(CASE WHEN status = 'Confirmed' THEN 1 END) as confirmed_appointments,
    COUNT(CASE WHEN date = CURRENT_DATE AND status = 'Confirmed' THEN 1 END) as today_confirmed
FROM appointments 
GROUP BY clinic_id;

-- =====================================================
-- 6. TEST THE EXACT QUERY FROM THE COMPONENT
-- =====================================================

-- Simulate the exact query from AdminPatientManagement
SELECT 
    'component query test' as check_type,
    COUNT(*) as appointments_found
FROM appointments
WHERE clinic_id = 'c1ca557d-ca85-4905-beb7-c3985692d463'
AND date = CURRENT_DATE
AND status = 'Confirmed';

-- Show the actual results
SELECT 
    'component query results' as check_type,
    id,
    patient_id,
    name,
    phone,
    email,
    date,
    time,
    status
FROM appointments
WHERE clinic_id = 'c1ca557d-ca85-4905-beb7-c3985692d463'
AND date = CURRENT_DATE
AND status = 'Confirmed'
ORDER BY time;

-- =====================================================
-- 7. RECOMMENDATIONS
-- =====================================================

SELECT '=== RECOMMENDATIONS ===' as section;

-- Check if we need to migrate appointments to patients
SELECT 
    'migration needed' as check_type,
    CASE 
        WHEN COUNT(*) > 0 THEN '❌ Appointments without patient_id need migration'
        ELSE '✅ All appointments have patient_id'
    END as status,
    COUNT(*) as appointments_to_migrate
FROM appointments 
WHERE patient_id IS NULL;

-- Check if we need to create appointments for today
SELECT 
    'today appointments needed' as check_type,
    CASE 
        WHEN COUNT(*) = 0 THEN '❌ No appointments for today - create some test appointments'
        ELSE '✅ Appointments exist for today'
    END as status,
    COUNT(*) as today_appointments
FROM appointments 
WHERE date = CURRENT_DATE;

-- =====================================================
-- 8. SUCCESS MESSAGE
-- =====================================================

SELECT '🔍 Today appointments diagnosis complete! Check the results above.' as status;
