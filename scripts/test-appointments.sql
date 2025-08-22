-- Test Appointments Data
-- Run this in Supabase SQL Editor

-- Check all appointments
SELECT 'ALL APPOINTMENTS' as check_type;
SELECT id, name, phone, email, date, time, status, patient_id, clinic_id 
FROM appointments 
ORDER BY created_at DESC;

-- Check appointments for your phone number
SELECT 'APPOINTMENTS FOR YOUR PHONE' as check_type;
SELECT id, name, phone, email, date, time, status, patient_id, clinic_id 
FROM appointments 
WHERE phone = '06361631253' OR phone = '6361631253';

-- Check if patient_id column exists and has data
SELECT 'PATIENT_ID COLUMN STATUS' as check_type;
SELECT 
    COUNT(*) as total_appointments,
    COUNT(patient_id) as appointments_with_patient_id,
    COUNT(*) - COUNT(patient_id) as appointments_without_patient_id
FROM appointments;

-- Check your patient data
SELECT 'YOUR PATIENT DATA' as check_type;
SELECT id, first_name, last_name, phone, email 
FROM patients 
WHERE phone = '06361631253' OR phone = '6361631253';
