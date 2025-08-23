-- Fix Prescription Save Issue
-- Run this in Supabase SQL Editor

-- 1. Drop and recreate the function to ensure it works
DROP FUNCTION IF EXISTS create_prescription_with_history(uuid, uuid, varchar, varchar, varchar, varchar, text, varchar, integer, varchar, text, text, text, text);

CREATE OR REPLACE FUNCTION create_prescription_with_history(
    p_clinic_id UUID,
    p_patient_id UUID,
    p_medication_name VARCHAR(255),
    p_dosage VARCHAR(100),
    p_frequency VARCHAR(100),
    p_duration VARCHAR(100),
    p_instructions TEXT,
    p_prescribed_by VARCHAR(255),
    p_refills_remaining INTEGER DEFAULT 0,
    p_refill_quantity VARCHAR(100) DEFAULT '',
    p_pharmacy_notes TEXT DEFAULT '',
    p_patient_notes TEXT DEFAULT '',
    p_side_effects TEXT DEFAULT '',
    p_interactions TEXT DEFAULT ''
)
RETURNS UUID AS $$
DECLARE
    v_prescription_id UUID;
BEGIN
    -- Insert prescription
    INSERT INTO prescriptions (
        clinic_id,
        patient_id,
        medication_name,
        dosage,
        frequency,
        duration,
        instructions,
        prescribed_by,
        refills_remaining,
        refill_quantity,
        pharmacy_notes,
        patient_notes,
        side_effects,
        interactions
    ) VALUES (
        p_clinic_id,
        p_patient_id,
        p_medication_name,
        p_dosage,
        p_frequency,
        p_duration,
        p_instructions,
        p_prescribed_by,
        p_refills_remaining,
        p_refill_quantity,
        p_pharmacy_notes,
        p_patient_notes,
        p_side_effects,
        p_interactions
    ) RETURNING id INTO v_prescription_id;

    -- Log in history
    INSERT INTO prescription_history (
        prescription_id,
        action,
        action_by,
        notes
    ) VALUES (
        v_prescription_id,
        'Created',
        p_prescribed_by,
        'Prescription created'
    );

    RETURN v_prescription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Test the function
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
            'Test Amoxicillin',
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
        
    ELSE
        RAISE NOTICE 'No patients found for testing';
    END IF;
END $$;

-- 3. Check if prescriptions table has correct structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'prescriptions'
ORDER BY ordinal_position;

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
