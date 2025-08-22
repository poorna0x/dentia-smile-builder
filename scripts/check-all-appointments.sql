-- Check All Appointments and Link Missing Ones
-- Run this in Supabase SQL Editor

-- 1. Check all appointments
SELECT 'ALL APPOINTMENTS' as check_type;
SELECT id, name, phone, email, date, time, status, patient_id, clinic_id, created_at
FROM appointments 
ORDER BY created_at DESC;

-- 2. Check appointments for your phone (any format)
SELECT 'APPOINTMENTS FOR YOUR PHONE' as check_type;
SELECT id, name, phone, email, date, time, status, patient_id, clinic_id
FROM appointments 
WHERE phone LIKE '%6361631253%' OR phone LIKE '%06361631253%';

-- 3. Check your patient data again
SELECT 'YOUR PATIENT DATA' as check_type;
SELECT id, first_name, last_name, phone, email, clinic_id
FROM patients 
WHERE phone = '6361631253';

-- 4. Link appointments to patient (if any exist)
SELECT 'LINKING APPOINTMENTS' as check_type;
UPDATE appointments 
SET patient_id = (
    SELECT id FROM patients 
    WHERE phone = '6361631253' 
    LIMIT 1
)
WHERE phone = '6361631253' 
AND patient_id IS NULL;

-- 5. Show linked appointments
SELECT 'LINKED APPOINTMENTS' as check_type;
SELECT a.id, a.name, a.phone, a.date, a.time, a.status, a.patient_id, p.first_name
FROM appointments a
LEFT JOIN patients p ON a.patient_id = p.id
WHERE a.phone = '6361631253';
