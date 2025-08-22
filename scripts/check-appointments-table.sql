-- Check Appointments Table Structure
-- Run this in Supabase SQL Editor

-- Check appointments table structure
SELECT 'APPOINTMENTS TABLE STRUCTURE' as check_type;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'appointments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if patient_id column exists
SELECT 'PATIENT_ID COLUMN CHECK' as check_type;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'appointments' 
AND column_name = 'patient_id'
AND table_schema = 'public';

-- Count appointments
SELECT 'APPOINTMENTS COUNT' as check_type;
SELECT COUNT(*) as appointment_count FROM appointments;

-- Show sample appointments
SELECT 'SAMPLE APPOINTMENTS' as check_type;
SELECT id, name, phone, email, date, time, status, patient_id, clinic_id 
FROM appointments 
LIMIT 5;

-- Check foreign key constraints for appointments
SELECT 'APPOINTMENTS FOREIGN KEYS' as check_type;
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'appointments';
