-- Link Appointments to Patient
-- Run this in Supabase SQL Editor to link existing appointments to the patient

-- First, let's see what appointments exist for the phone number
SELECT 'EXISTING APPOINTMENTS FOR PHONE' as check_type;
SELECT id, name, phone, email, date, time, status, patient_id, clinic_id 
FROM appointments 
WHERE phone = '06361631253' OR phone = '6361631253';

-- Update appointments to link them to the patient
UPDATE appointments 
SET patient_id = (
    SELECT id FROM patients 
    WHERE phone = '06361631253' OR phone = '6361631253'
    LIMIT 1
)
WHERE (phone = '06361631253' OR phone = '6361631253')
AND patient_id IS NULL;

-- Check the result
SELECT 'UPDATED APPOINTMENTS' as check_type;
SELECT id, name, phone, email, date, time, status, patient_id, clinic_id 
FROM appointments 
WHERE phone = '06361631253' OR phone = '6361631253';

-- Also check all appointments for the clinic
SELECT 'ALL APPOINTMENTS FOR CLINIC' as check_type;
SELECT id, name, phone, email, date, time, status, patient_id, clinic_id 
FROM appointments 
WHERE clinic_id = 'c1ca557d-ca85-4905-beb7-c3985692d463'
ORDER BY date DESC;
