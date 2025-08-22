-- Debug Appointments - Check What's Actually in the Database
-- Run this in Supabase SQL Editor

-- 1. Check if appointments table exists and has data
SELECT 'APPOINTMENTS TABLE STATUS' as check_type;
SELECT 
    COUNT(*) as total_appointments,
    COUNT(CASE WHEN patient_id IS NOT NULL THEN 1 END) as appointments_with_patient_id,
    COUNT(CASE WHEN patient_id IS NULL THEN 1 END) as appointments_without_patient_id
FROM appointments;

-- 2. Show all appointments (if any exist)
SELECT 'ALL APPOINTMENTS' as check_type;
SELECT 
    id,
    name,
    phone,
    email,
    date,
    time,
    status,
    patient_id,
    clinic_id,
    created_at
FROM appointments 
ORDER BY created_at DESC;

-- 3. Check appointments for your specific phone number
SELECT 'APPOINTMENTS FOR YOUR PHONE' as check_type;
SELECT 
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
WHERE phone = '6361631253';

-- 4. Check appointments for your patient ID
SELECT 'APPOINTMENTS FOR YOUR PATIENT ID' as check_type;
SELECT 
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
WHERE patient_id = '104dffeb-1013-4b96-854f-6858e4b2d8a3';

-- 5. Check appointments for your clinic
SELECT 'APPOINTMENTS FOR YOUR CLINIC' as check_type;
SELECT 
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
WHERE clinic_id = 'c1ca557d-ca85-4905-beb7-c3985692d463';

-- 6. Check if the test appointments were actually created
SELECT 'RECENT APPOINTMENTS (LAST 10)' as check_type;
SELECT 
    id,
    name,
    phone,
    email,
    date,
    time,
    status,
    patient_id,
    clinic_id,
    created_at
FROM appointments 
ORDER BY created_at DESC
LIMIT 10;
