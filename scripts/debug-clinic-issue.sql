-- Debug Clinic and Patient Tables
-- Run this in Supabase SQL Editor to check the current state

-- Check if clinics table exists and has data
SELECT 'CLINICS TABLE CHECK' as check_type;
SELECT COUNT(*) as clinic_count FROM clinics;
SELECT id, name, slug FROM clinics LIMIT 5;

-- Check patients table structure
SELECT 'PATIENTS TABLE STRUCTURE' as check_type;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'patients' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if there are any existing patients
SELECT 'EXISTING PATIENTS' as check_type;
SELECT COUNT(*) as patient_count FROM patients;

-- Check for any foreign key constraints
SELECT 'FOREIGN KEY CONSTRAINTS' as check_type;
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
AND tc.table_name = 'patients';

-- Check RLS policies
SELECT 'RLS POLICIES' as check_type;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'patients';
