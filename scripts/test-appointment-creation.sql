-- Test script to check appointment creation and patient linking
-- Run this in Supabase SQL editor to test the functionality

-- 1. Check if the trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'auto_link_appointment_trigger';

-- 2. Check if the find_or_create_patient function exists
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'find_or_create_patient';

-- 3. Test creating a simple appointment (replace clinic_id with actual clinic ID)
-- First, get a clinic ID
SELECT id, name FROM clinics LIMIT 1;

-- 4. Test appointment creation (uncomment and replace clinic_id with actual value)
/*
INSERT INTO appointments (
    clinic_id,
    name,
    phone,
    email,
    date,
    time,
    status,
    patient_id
) VALUES (
    'your-clinic-id-here',
    'Test Patient',
    '9876543210',
    'test@example.com',
    '2024-01-20',
    '10:00',
    'Confirmed',
    NULL
) RETURNING *;
*/

-- 5. Check if patient was created
SELECT 
    p.id as patient_id,
    p.first_name,
    p.last_name,
    p.phone,
    p.email,
    pp.phone as phone_from_phones_table
FROM patients p
LEFT JOIN patient_phones pp ON p.id = pp.patient_id
WHERE p.phone = '9876543210'
ORDER BY p.created_at DESC
LIMIT 5;

-- 6. Check if appointment was linked to patient
SELECT 
    a.id as appointment_id,
    a.name,
    a.phone,
    a.patient_id,
    p.first_name,
    p.last_name
FROM appointments a
LEFT JOIN patients p ON a.patient_id = p.id
WHERE a.phone = '9876543210'
ORDER BY a.created_at DESC
LIMIT 5;
