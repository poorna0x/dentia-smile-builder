-- Check existing prescriptions and constraints
-- Run this in Supabase SQL Editor

-- 1. Check existing prescriptions for this patient
SELECT 
    id,
    medication_name,
    dosage,
    frequency,
    duration,
    prescribed_by,
    status,
    created_at
FROM prescriptions 
WHERE patient_id = '0e3f88de-deb1-4843-849b-f0d6998cea3a'
AND clinic_id = 'c1ca557d-ca85-4905-beb7-c3985692d463'
ORDER BY created_at DESC;

-- 2. Check unique constraints on prescriptions table
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'prescriptions'
AND tc.constraint_type = 'UNIQUE'
ORDER BY tc.constraint_name, kcu.ordinal_position;

-- 3. Show all constraints
SELECT 
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'prescriptions';

-- 4. Check if there's already an Amoxicillin prescription for this patient
SELECT COUNT(*) as existing_amoxicillin_count
FROM prescriptions 
WHERE patient_id = '0e3f88de-deb1-4843-849b-f0d6998cea3a'
AND clinic_id = 'c1ca557d-ca85-4905-beb7-c3985692d463'
AND medication_name = 'Amoxicillin'
AND prescribed_by = 'Dr. Jeshna';
