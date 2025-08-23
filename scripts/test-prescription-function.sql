-- Test Prescription Function
-- Run this in Supabase SQL Editor to check if the function works

-- 1. Check if the function exists
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'create_prescription_with_history';

-- 2. Check if prescriptions table exists
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'prescriptions'
ORDER BY ordinal_position;

-- 3. Test the function with sample data
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
        -- Test the function
        SELECT create_prescription_with_history(
            v_clinic_id,
            v_patient_id,
            'Test Medication',
            '500mg',
            '3 times daily',
            '7 days',
            'Take with food',
            'Dr. Test',
            0,
            '',
            '',
            '',
            '',
            ''
        ) INTO v_result;
        
        RAISE NOTICE 'Function test successful. Created prescription ID: %', v_result;
        
        -- Check if prescription was created
        SELECT COUNT(*) FROM prescriptions WHERE id = v_result;
        
    ELSE
        RAISE NOTICE 'No patients found for testing';
    END IF;
END $$;

-- 4. Show recent prescriptions
SELECT 
    p.id,
    p.medication_name,
    p.dosage,
    p.frequency,
    p.duration,
    p.status,
    p.prescribed_date,
    pat.first_name,
    pat.last_name
FROM prescriptions p
JOIN patients pat ON p.patient_id = pat.id
WHERE p.clinic_id = 'c1ca557d-ca85-4905-beb7-c3985692d463'
ORDER BY p.created_at DESC
LIMIT 5;
