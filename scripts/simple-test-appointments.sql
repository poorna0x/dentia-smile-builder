-- Simple Test Appointments Creation
-- Run this in Supabase SQL Editor

-- Get your patient ID and clinic ID
WITH patient_data AS (
    SELECT 
        p.id as patient_id,
        c.id as clinic_id
    FROM patients p
    CROSS JOIN clinics c
    WHERE p.phone = '6361631253'
    LIMIT 1
)

-- Insert test appointments
INSERT INTO appointments (
    clinic_id,
    name,
    email,
    phone,
    date,
    time,
    status,
    patient_id
)
SELECT 
    pd.clinic_id,
    'Poorna',
    'poorna8105@gmail.com',
    '6361631253',
    '2024-01-15'::DATE,
    '10:00',
    'Confirmed',
    pd.patient_id
FROM patient_data pd

UNION ALL

SELECT 
    pd.clinic_id,
    'Poorna',
    'poorna8105@gmail.com',
    '6361631253',
    '2024-01-20'::DATE,
    '14:30',
    'Confirmed',
    pd.patient_id
FROM patient_data pd

UNION ALL

SELECT 
    pd.clinic_id,
    'Poorna',
    'poorna8105@gmail.com',
    '6361631253',
    '2024-02-01'::DATE,
    '09:00',
    'Confirmed',
    pd.patient_id
FROM patient_data pd;

-- Show the created appointments
SELECT 'TEST APPOINTMENTS CREATED' as status;
SELECT 
    a.id,
    a.name,
    a.phone,
    a.date,
    a.time,
    a.status,
    a.patient_id,
    p.first_name as patient_name
FROM appointments a
LEFT JOIN patients p ON a.patient_id = p.id
WHERE a.phone = '6361631253'
ORDER BY a.date DESC;
