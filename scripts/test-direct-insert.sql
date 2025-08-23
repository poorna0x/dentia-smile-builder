-- Test Direct Insert for Prescriptions
-- Run this in Supabase SQL Editor to test the insert

-- 1. Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'prescriptions'
ORDER BY ordinal_position;

-- 2. Test direct insert with correct data types
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
        -- Test direct insert
        INSERT INTO prescriptions (
            clinic_id,
            patient_id,
            medication_name,
            dosage,
            frequency,
            duration,
            instructions,
            prescribed_by,
            status,
            refills_remaining,
            refill_quantity,
            pharmacy_notes,
            patient_notes,
            side_effects,
            interactions
        ) VALUES (
            v_clinic_id,
            v_patient_id,
            'Test Amoxicillin',
            '500mg',
            '3 times daily',
            '7 days',
            'Take with food',
            'Dr. Test',
            'Active',
            0,
            null,
            null,
            null,
            null,
            null
        ) RETURNING id INTO v_result;
        
        RAISE NOTICE 'Direct insert test successful. Created prescription ID: %', v_result;
        
        -- Clean up test data
        DELETE FROM prescriptions WHERE id = v_result;
        RAISE NOTICE 'Test data cleaned up';
        
    ELSE
        RAISE NOTICE 'No patients found for testing';
    END IF;
END $$;

-- 3. Show recent prescriptions
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
