-- Link the missing appointment with NULL patient_id
-- Run this in Supabase SQL Editor

-- Link the appointment with NULL patient_id to the patient
UPDATE appointments 
SET patient_id = '104dffeb-1013-4b96-854f-6858e4b2d8a3'
WHERE phone = '6361631253' 
AND patient_id IS NULL
AND clinic_id = 'c1ca557d-ca85-4905-beb7-c3985692d463';

-- Show the result
SELECT 'LINKED MISSING APPOINTMENT' as status;
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
WHERE phone = '6361631253'
ORDER BY date DESC;
