-- Debug Prescription Table
-- Run this in Supabase SQL Editor

-- 1. Check if prescriptions table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'prescriptions'
) as table_exists;

-- 2. Show table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'prescriptions'
ORDER BY ordinal_position;

-- 3. Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'prescriptions';

-- 4. Test simple insert
DO $$
DECLARE
    v_clinic_id UUID := 'c1ca557d-ca85-4905-beb7-c3985692d463';
    v_patient_id UUID;
    v_result UUID;
BEGIN
    -- Get a patient ID
    SELECT id INTO v_patient_id 
    FROM patients 
    WHERE clinic_id = v_clinic_id 
    LIMIT 1;
    
    IF v_patient_id IS NOT NULL THEN
        RAISE NOTICE 'Testing insert with patient ID: %', v_patient_id;
        
        -- Test minimal insert
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
            'Test Medication',
            '500mg',
            '3 times daily',
            '7 days',
            'Dr. Test'
        ) RETURNING id INTO v_result;
        
        RAISE NOTICE 'Minimal insert successful. ID: %', v_result;
        
        -- Clean up
        DELETE FROM prescriptions WHERE id = v_result;
        RAISE NOTICE 'Test data cleaned up';
        
    ELSE
        RAISE NOTICE 'No patients found';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error: %', SQLERRM;
END $$;

-- 5. Show any existing prescriptions
SELECT COUNT(*) as total_prescriptions FROM prescriptions;
