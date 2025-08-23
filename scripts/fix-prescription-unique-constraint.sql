-- Fix Prescription Unique Constraint Issue
-- Run this in Supabase SQL Editor

-- 1. First, let's see what unique constraints exist
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

-- 2. Drop the problematic unique constraint
-- (Replace 'prescriptions_clinic_id_patient_id_medication_name_prescrib_key' with the actual constraint name from step 1)
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find the constraint name
    SELECT tc.constraint_name INTO constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'prescriptions'
    AND tc.constraint_type = 'UNIQUE'
    AND kcu.column_name IN ('clinic_id', 'patient_id', 'medication_name', 'prescribed_by')
    LIMIT 1;
    
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE prescriptions DROP CONSTRAINT ' || constraint_name;
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    ELSE
        RAISE NOTICE 'No matching constraint found';
    END IF;
END $$;

-- 3. Verify the constraint is removed
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

-- 4. Test insert to make sure it works now
DO $$
DECLARE
    v_clinic_id UUID := 'c1ca557d-ca85-4905-beb7-c3985692d463';
    v_patient_id UUID := '0e3f88de-deb1-4843-849b-f0d6998cea3a';
    v_result UUID;
BEGIN
    -- Test insert
    INSERT INTO prescriptions (
        clinic_id,
        patient_id,
        medication_name,
        dosage,
        frequency,
        duration,
        prescribed_by
    ) VALUES (
        v_clinic_id,
        v_patient_id,
        'Amoxicillin',
        '500mg',
        '3 times daily',
        '7 days',
        'Dr. Jeshna'
    ) RETURNING id INTO v_result;
    
    RAISE NOTICE 'Test insert successful. ID: %', v_result;
    
    -- Clean up test data
    DELETE FROM prescriptions WHERE id = v_result;
    RAISE NOTICE 'Test data cleaned up';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error: %', SQLERRM;
END $$;
